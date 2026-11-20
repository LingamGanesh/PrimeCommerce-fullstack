import mongoose from "mongoose";
import OrderModel from "../models/order.model.js";
import ProductModel from "../models/product.model.js";

async function restoreReservedInventory(order) {
  let items = [];
  try { items = JSON.parse(order.product_details || "[]"); } catch { return false; }
  await Promise.all(items.map(item => ProductModel.updateOne({ _id: item.productId }, { $inc: { stock: Number(item.quantity) || 0 } })));
  return true;
}

export async function cancelMyOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid order id" });
    const order = await OrderModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.delivery_status !== "processing") return res.status(409).json({ success: false, message: "Orders can only be cancelled before picker assignment" });
    if (order.paymentMethod === "RAZORPAY") {
      if (order.payment_status !== "paid" || !order.payment_id) return res.status(409).json({ success: false, message: "Only captured online payments can be refunded. Contact support for this payment state." });
      const claimed = await OrderModel.findOneAndUpdate({ _id: order._id, userId: req.userId, delivery_status: "processing", payment_status: "paid", refund_status: "not_required" }, { $set: { refund_status: "initiating" } }, { new: true });
      if (!claimed) return res.status(409).json({ success: false, message: "Cancellation or refund is already being processed" });
      try {
        const key = process.env.RAZORPAY_KEY_ID; const secret = process.env.RAZORPAY_KEY_SECRET;
        if (!key || !secret) throw new Error("Payment gateway is not configured");
        const response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(order.payment_id)}/refund`, {
          method: "POST", signal: AbortSignal.timeout(15000),
          headers: { Authorization: "Basic " + Buffer.from(`${key}:${secret}`).toString("base64"), "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(Number(order.totalAmt) * 100), notes: { orderId: order.orderId, reason: "Customer cancellation before fulfilment" } })
        });
        const refund = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(refund.error?.description || "Refund request failed");
        await OrderModel.updateOne({ _id: order._id, refund_status: "initiating" }, { $set: { refund_status: refund.status === "processed" ? "processed" : "pending" } });
        const updated = await OrderModel.findOneAndUpdate({ _id: order._id, delivery_status: "processing", refund_status: { $in: ["initiating", "pending", "processed", "failed"] } }, { $set: { refund_id: refund.id, refund_amount: Number(refund.amount || 0) / 100, delivery_status: "cancelled", cancelledAt: new Date(), inventoryReleased: true } }, { new: true });
        if (!updated) return res.status(409).json({ success: false, message: "Refund was accepted but order state needs support reconciliation" });
        await restoreReservedInventory(updated);
        return res.json({ success: true, message: "Order cancelled. Your Razorpay refund status is being tracked.", data: { orderId: updated.orderId, refundStatus: updated.refund_status, refundId: updated.refund_id } });
      } catch (error) {
        await OrderModel.updateOne({ _id: order._id, refund_status: "initiating" }, { $set: { refund_status: "failed" } });
        return res.status(502).json({ success: false, message: error.message || "Refund could not be initiated. Contact support before retrying." });
      }
    }
    const cancelled = await OrderModel.findOneAndUpdate({ _id: order._id, userId: req.userId, delivery_status: "processing", inventoryReleased: false }, { $set: { delivery_status: "cancelled", cancelledAt: new Date(), inventoryReleased: true } }, { new: true });
    if (!cancelled) return res.status(409).json({ success: false, message: "Order cancellation is already being processed" });
    await restoreReservedInventory(cancelled);
    return res.json({ success: true, message: "Cash on Delivery order cancelled", data: { orderId: cancelled.orderId, refundStatus: "not_required" } });
  } catch (error) { return res.status(500).json({ success: false, message: error.message || "Unable to cancel order" }); }
}