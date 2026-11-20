import mongoose from "mongoose";
import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";
import { canCustomerCancelOrder, canRequestFullRazorpayRefund } from "../utils/orderPolicy.js";

async function restoreReservedInventory(order, session) {
  let items;
  try { items = JSON.parse(order.product_details || "[]"); } catch {
    throw new Error(`Cannot restore inventory for order ${order.orderId}: invalid product snapshot`);
  }
  if (!Array.isArray(items) || items.some(item =>
    !mongoose.isValidObjectId(item.productId) ||
    !Number.isSafeInteger(Number(item.quantity)) ||
    Number(item.quantity) < 1
  )) {
    throw new Error(`Cannot restore inventory for order ${order.orderId}: invalid product quantities`);
  }
  for (const item of items) {
    const result = await ProductModel.updateOne(
      { _id: item.productId },
      { $inc: { stock: Number(item.quantity) } },
      { session }
    );
    if (result.matchedCount !== 1) {
      throw new Error(`Cannot restore inventory for order ${order.orderId}: product ${item.productId} no longer exists`);
    }
  }
}

async function finalizeRazorpayRefund(orderId, refund) {
  if (!refund?.id || !refund?.payment_id) throw new Error("Refund response is missing its identifiers");
  const session = await mongoose.startSession();
  let finalized;
  try {
    await session.withTransaction(async () => {
      const order = await OrderModel.findOneAndUpdate(
        {
          _id: orderId,
          paymentMethod: "RAZORPAY",
          payment_status: "paid",
          delivery_status: "processing",
          inventoryReleased: false,
          refund_status: { $in: ["initiating", "pending"] }
        },
        {
          $set: {
            refund_status: refund.status === "processed" ? "processed" : "pending",
            refund_id: refund.id,
            refund_amount: Number(refund.amount || 0) / 100,
            delivery_status: "cancelled",
            cancelledAt: new Date(),
            inventoryReleased: true
          }
        },
        { new: true, session }
      );
      if (order) {
        await restoreReservedInventory(order, session);
        finalized = order;
      } else {
        const existing = await OrderModel.findById(orderId).session(session);
        if (existing?.inventoryReleased && existing?.refund_id === refund.id && existing?.delivery_status === "cancelled") {
          finalized = existing;
        } else {
          throw new Error("Refund was accepted but order state needs support reconciliation");
        }
      }
    });
    return finalized;
  } finally {
    await session.endSession();
  }
}

export async function cancelMyOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid order id" });
    const order = await OrderModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (!canCustomerCancelOrder(order)) return res.status(409).json({ success: false, message: "Orders can only be cancelled before picker assignment" });
    if (order.paymentMethod === "RAZORPAY") {
      if (!canRequestFullRazorpayRefund(order)) return res.status(409).json({ success: false, message: "Only captured online payments without a previous refund request can be refunded. Contact support for this payment state." });
      const claimed = await OrderModel.findOneAndUpdate({ _id: order._id, userId: req.userId, delivery_status: "processing", payment_status: "paid", refund_status: "not_required" }, { $set: { refund_status: "initiating" } }, { new: true });
      if (!claimed) return res.status(409).json({ success: false, message: "Cancellation or refund is already being processed" });
      let refundRequestDispatched = false;
      let definitiveGatewayFailure = false;
      try {
        const key = process.env.RAZORPAY_KEY_ID; const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key || !secret) throw new Error("Payment gateway is not configured");
        refundRequestDispatched = true;
        const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(order.payment_id)}/refund`, {
          method: "POST", signal: AbortSignal.timeout(15000),
          headers: { Authorization: "Basic " + Buffer.from(`${key}:${secret}`).toString("base64"), "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(Number(order.totalAmt) * 100), notes: { orderId: order.orderId, reason: "Customer cancellation before fulfilment" } })
        });
        const refund = await response.json().catch(() => ({}));
        // A definitive client rejection means no refund was created. Timeouts,
        // rate limits and server errors are ambiguous and must stay reconcilable.
        definitiveGatewayFailure = response.status >= 400 && response.status < 500 && response.status !== 429;
        if (!response.ok) throw new Error(refund.error?.description || "Refund request failed");
        const expectedAmount = Math.round(Number(order.totalAmt) * 100);
        const responseHasValidIdentity =
          typeof refund.id === "string" && refund.id.length > 0 &&
          refund.payment_id === order.payment_id;
        if (responseHasValidIdentity && refund.status === "failed") {
          await OrderModel.updateOne(
            { _id: order._id, refund_status: "initiating", inventoryReleased: false },
            { $set: {
              refund_status: "failed",
              refund_id: refund.id,
              refund_amount: Number.isFinite(Number(refund.amount)) ? Number(refund.amount) / 100 : 0
            } }
          );
          return res.status(502).json({
            success: false,
            message: "The payment provider reported that the refund failed. Your order has not been cancelled; please contact support."
          });
        }
        const responseMatchesOrder =
          responseHasValidIdentity &&
          Number(refund.amount) === expectedAmount &&
          refund.currency === "INR" &&
          ["pending", "processed"].includes(refund.status);
        if (!responseMatchesOrder) {
          // Razorpay accepted a refund response that does not match the full
          // order amount/currency. Do not cancel or release stock automatically;
          // retain a visible pending reconciliation record for support.
          await OrderModel.updateOne(
            { _id: order._id, refund_status: "initiating", inventoryReleased: false },
            { $set: {
              refund_status: "pending",
              ...(refund.id ? { refund_id: String(refund.id) } : {}),
              refund_amount: Number.isFinite(Number(refund.amount)) ? Number(refund.amount) / 100 : 0
            } }
          );
          return res.status(202).json({
            success: true,
            message: "The payment provider accepted a refund response that needs manual verification. Your order remains active until support confirms the refund."
          });
        }
        const updated = await finalizeRazorpayRefund(order._id, refund);
        return res.json({ success: true, message: "Order cancelled. Your Razorpay refund status is being tracked.", data: { orderId: updated.orderId, refundStatus: updated.refund_status, refundId: updated.refund_id } });
      } catch (error) {
        // A timeout can occur after Razorpay accepted the refund. Keep the claim
        // recoverable; the signed refund webhook reconciles the final state.
        if (/Refund was accepted but order state/.test(error.message)) {
          return res.status(202).json({ success: true, message: "Refund may have been accepted. Order reconciliation is pending; please do not retry the cancellation." });
        }
        const needsReconciliation = refundRequestDispatched && !definitiveGatewayFailure;
        await OrderModel.updateOne(
          { _id: order._id, refund_status: "initiating", inventoryReleased: false },
          { $set: { refund_status: needsReconciliation ? "pending" : "failed" } }
        );
        if (needsReconciliation) {
          return res.status(202).json({
            success: true,
            message: "The refund request outcome is not yet confirmed. We are checking with the payment provider; please do not submit another cancellation or payment."
          });
        }
        return res.status(502).json({ success: false, message: error.message || "Refund could not be initiated. Contact support before retrying." });
      }
    }
    const session = await mongoose.startSession();
    let cancelled;
    try {
      await session.withTransaction(async () => {
        cancelled = await OrderModel.findOneAndUpdate(
          { _id: order._id, userId: req.userId, delivery_status: "processing", inventoryReleased: false },
          { $set: { delivery_status: "cancelled", cancelledAt: new Date(), inventoryReleased: true } },
          { new: true, session }
        );
        if (!cancelled) throw new Error("Order cancellation is already being processed");
        await restoreReservedInventory(cancelled, session);
      });
    } finally {
      await session.endSession();
    }
    return res.json({ success: true, message: "Cash on Delivery order cancelled", data: { orderId: cancelled.orderId, refundStatus: "not_required" } });
  } catch (error) {
    const conflict = /already being processed|state has changed|write conflict|TransientTransactionError/i.test(error.message || "");
    return res.status(conflict ? 409 : 500).json({
      success: false,
      message: conflict ? "This order is already being updated. Refresh your orders and try again." : (error.message || "Unable to cancel order")
    });
  }
}