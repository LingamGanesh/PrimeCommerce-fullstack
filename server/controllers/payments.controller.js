import crypto from "node:crypto";
import mongoose from "mongoose";
import CartProductModel from "../models/cartProduct.model.js";
import ProductModel from "../models/product.model.js";
import AddressModel from "../models/address.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";
import { verifyHmacHex, isValidRazorpayAmount } from "../utils/paymentSecurity.js";

const roundMoney = (value) => Math.round(Number(value) * 100) / 100;
const razorpayAuth = () => {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) throw new Error("Online payments are not configured. Please use Cash on Delivery.");
  return { id, secret, header: "Basic " + Buffer.from(`${id}:${secret}`).toString("base64") };
};
const gatewayRequest = async (path, options = {}) => {
  const { header } = razorpayAuth();
  const response = await fetch(`https://api.razorpay.com/v1${path}`, {
    ...options, signal: AbortSignal.timeout(15000),
    headers: { Authorization: header, "Content-Type": "application/json", ...(options.headers || {}) }
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error?.description || "Payment gateway request failed");
  return body;
};
const getCartSnapshot = async (userId, session) => {
  let query = CartProductModel.find({ userId }).populate({ path: "productId", select: "name image unit price stock publish" });
  if (session) query = query.session(session);
  const rows = await query;
  if (!rows.length) throw new Error("Your cart is empty");
  const items = []; let subtotal = 0;
  for (const row of rows) {
    const product = row.productId;
    if (!product || !product.publish) throw new Error("A product in your cart is no longer available");
    const unitPrice = roundMoney(product.price);
    const lineTotal = roundMoney(unitPrice * row.quantity); subtotal = roundMoney(subtotal + lineTotal);
    items.push({ productId: product._id, name: product.name, image: product.image || [], unit: product.unit, unitPrice, quantity: row.quantity, lineTotal });
  }
  const cartRowIds = rows.map(row => String(row._id)).sort();
  const fingerprint = items
    .map(item => ({ productId: String(item.productId), quantity: item.quantity, unitPrice: item.unitPrice }))
    .sort((a, b) => a.productId.localeCompare(b.productId));
  return { items, subtotal, cartRowIds, fingerprint: JSON.stringify(fingerprint) };
};
const reserveStock = async (items, session) => {
  for (const item of items) {
    const product = await ProductModel.findOneAndUpdate(
      { _id: item.productId, publish: true, stock: { $gte: item.quantity } },
      { $inc: { stock: -item.quantity } },
      { new: true, session }
    );
    if (!product) throw new Error(`Insufficient stock for ${item.name}. Please update your cart.`);
  }
};
const restoreOrderStock = async (order, session) => {
  let items;
  try {
    items = JSON.parse(order.product_details || "[]");
  } catch {
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
};

async function reconcileRazorpayRefund(refund, eventName) {
  if (!refund?.id || !refund?.payment_id) return null;
  const candidate = await OrderModel.findOne({ payment_id: refund.payment_id, paymentMethod: "RAZORPAY" }).select("_id totalAmt");
  if (!candidate || Number(refund.amount) !== Math.round(Number(candidate.totalAmt) * 100) ||
      refund.currency !== "INR") {
    throw new Error("Refund webhook amount or currency does not match the order");
  }
  const failed = eventName === "refund.failed";
  if (failed) {
    await OrderModel.updateOne(
      {
        payment_id: refund.payment_id,
        paymentMethod: "RAZORPAY",
        refund_status: { $in: ["initiating", "pending", "failed"] }
      },
      {
        $set: {
          refund_status: "failed",
          refund_id: refund.id,
          refund_amount: Number(refund.amount || 0) / 100
        }
      }
    );
    return;
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      const order = await OrderModel.findOneAndUpdate(
        {
          payment_id: refund.payment_id,
          paymentMethod: "RAZORPAY",
          payment_status: "paid",
          delivery_status: "processing",
          inventoryReleased: false,
          refund_status: { $in: ["initiating", "pending", "failed"] }
        },
        {
          $set: {
            refund_status: "processed",
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
        await restoreOrderStock(order, session);
        return;
      }
      const existing = await OrderModel.findOne({ payment_id: refund.payment_id }).session(session);
      if (existing?.inventoryReleased && existing?.refund_id === refund.id && existing?.delivery_status === "cancelled") {
        await OrderModel.updateOne(
          { _id: existing._id, refund_id: refund.id, inventoryReleased: true, delivery_status: "cancelled" },
          { $set: { refund_status: "processed", refund_amount: Number(refund.amount || 0) / 100 } },
          { session }
        );
        return;
      }
      throw new Error("Refund webhook could not be reconciled with an active cancellation");
    });
  } finally {
    await session.endSession();
  }
}

export async function createRazorpayOrder(req, res) {
  const session = await mongoose.startSession();
  try {
    // Recover stock from expired reservations before starting another online checkout.
    await expireRazorpayReservations();
    const { addressId } = req.body;
    if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ success: false, message: "Select a valid delivery address" });
    const address = await AddressModel.findOne({ _id: addressId, userId: req.userId }).lean();
    if (!address) return res.status(404).json({ success: false, message: "Delivery address not found" });
    const { items, subtotal, cartRowIds } = await getCartSnapshot(req.userId);
    const orderId = "PC" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString("hex").toUpperCase();

    // Create the gateway order before opening the DB transaction. A DB conflict may
    // leave an unused gateway order, but can never duplicate a charge or reserve stock.
    const gatewayOrder = await gatewayRequest("/orders", {
      method: "POST",
      body: JSON.stringify({ amount: Math.round(subtotal * 100), currency: "INR", receipt: orderId, notes: { customerId: String(req.userId) } })
    });
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    let responseData;

    await session.withTransaction(async () => {
      // Re-read the cart inside the transaction. The gateway order was created
      // from an earlier snapshot; reject if quantity, product, or price changed
      // while the customer was being redirected to the payment gateway.
      const currentCart = await getCartSnapshot(req.userId, session);
      if (currentCart.fingerprint !== JSON.stringify(items
        .map(item => ({ productId: String(item.productId), quantity: item.quantity, unitPrice: item.unitPrice }))
        .sort((a, b) => a.productId.localeCompare(b.productId))) ||
        currentCart.subtotal !== subtotal ||
        currentCart.cartRowIds.join(",") !== cartRowIds.map(String).sort().join(",")) {
        throw new Error("Your cart changed during checkout. Please review it and try again.");
      }
      await reserveStock(currentCart.items, session);
      const [savedOrder] = await OrderModel.create([{
        userId: req.userId, orderId, product_details: JSON.stringify(items), payment_id: "", payment_status: "pending",
        paymentMethod: "RAZORPAY", razorpayOrderId: gatewayOrder.id, paymentReservationExpiresAt: expiresAt, inventoryReleased: false,
        delivery_address: { address_line: address.address_line, city: address.city, state: address.state, pincode: address.pincode, country: address.country, mobile: address.mobile },
        delivery_status: "processing", subTotalAmt: subtotal, totalAmt: subtotal
      }], { session });
      await UserModel.updateOne({ _id: req.userId }, { $addToSet: { orderHistory: savedOrder._id } }, { session });

      // Only the transaction that successfully consumes the complete cart may place
      // the order. A competing checkout aborts and rolls back all stock decrements.
      const deleted = await CartProductModel.deleteMany({ _id: { $in: cartRowIds }, userId: req.userId }, { session });
      if (deleted.deletedCount !== cartRowIds.length) throw new Error("Your cart changed during checkout. Please review it and try again.");

      responseData = {
        orderDbId: savedOrder._id, orderId, razorpayOrderId: gatewayOrder.id,
        amount: gatewayOrder.amount, currency: gatewayOrder.currency,
        keyId: process.env.RAZORPAY_KEY_ID, expiresAt
      };
    });

    if (!responseData) throw new Error("Unable to start online payment");
    return res.status(201).json({ success: true, data: responseData });
  } catch (error) {
    const conflict = /cart changed|cart is empty|insufficient stock|no longer available|write conflict|transienttransactionerror/i.test(error.message || "");
    return res.status(conflict ? 409 : 400).json({ success: false, message: error.message || "Unable to start online payment" });
  } finally {
    await session.endSession();
  }
}

export async function retryRazorpayPayment(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid order id" });
    }
    const order = await OrderModel.findOne({
      _id: req.params.id,
      userId: req.userId,
      paymentMethod: "RAZORPAY",
      payment_status: { $in: ["pending", "authorized"] },
      delivery_status: "processing",
      inventoryReleased: false,
      paymentReservationExpiresAt: { $gt: new Date() }
    }).lean();
    if (!order?.razorpayOrderId) {
      return res.status(409).json({ success: false, message: "This payment reservation has expired or is no longer payable. Start a new checkout." });
    }

    // Confirm the gateway order is still payable; do not reopen a paid/closed order.
    const gatewayOrder = await gatewayRequest(`/orders/${encodeURIComponent(order.razorpayOrderId)}`);
    if (!["created", "attempted"].includes(gatewayOrder.status) ||
        Number(gatewayOrder.amount) !== Math.round(Number(order.totalAmt) * 100) ||
        gatewayOrder.currency !== "INR") {
      return res.status(409).json({ success: false, message: "This Razorpay order is no longer payable. Refresh your orders and contact support if you were charged." });
    }
    const keyId = process.env.RAZORPAY_KEY_ID;
    if (!keyId) return res.status(503).json({ success: false, message: "Online payments are not configured" });
    return res.json({
      success: true,
      data: {
        orderDbId: order._id,
        orderId: order.orderId,
        razorpayOrderId: order.razorpayOrderId,
        amount: gatewayOrder.amount,
        currency: gatewayOrder.currency,
        keyId,
        expiresAt: order.paymentReservationExpiresAt,
        contact: String(order.delivery_address?.mobile || "")
      }
    });
  } catch (error) {
    return res.status(502).json({ success: false, message: error.message || "Unable to retry this payment" });
  }
}

export async function verifyRazorpayPayment(req, res) {
  try {
    const { razorpay_order_id: gatewayOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (![gatewayOrderId, paymentId].every(value => typeof value === "string" && value.length > 0) || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)) return res.status(400).json({ success: false, message: "Payment verification details are incomplete" });
    const order = await OrderModel.findOne({ razorpayOrderId: gatewayOrderId, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Payment order not found" });
    const { secret } = razorpayAuth();
    const expected = crypto.createHmac("sha256", secret).update(`${gatewayOrderId}|${paymentId}`).digest("hex");
    const supplied = Buffer.from(signature, "hex"); const expectedBuffer = Buffer.from(expected, "hex");
    if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(supplied, expectedBuffer)) return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    const payment = await gatewayRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if (payment.order_id !== gatewayOrderId || !["authorized", "captured"].includes(payment.status) || Number(payment.amount) !== Math.round(Number(order.totalAmt) * 100) || payment.currency !== "INR") return res.status(400).json({ success: false, message: "Payment amount, currency or status could not be verified" });
    if (payment.status === "captured") {
      const paidOrder = await OrderModel.findOneAndUpdate(
        {
          _id: order._id, userId: req.userId, paymentMethod: "RAZORPAY",
          inventoryReleased: false, delivery_status: "processing",
          payment_status: { $in: ["pending", "authorized", "paid"] }
        },
        { $set: { payment_status: "paid", payment_id: paymentId } },
        { new: true }
      );
      if (!paidOrder) {
        // The reservation may have expired while we were verifying with Razorpay.
        // Record the captured funds for manual reconciliation, never as a normal paid order.
        const reviewOrder = await OrderModel.findOneAndUpdate(
          {
            _id: order._id, userId: req.userId, paymentMethod: "RAZORPAY",
            payment_status: { $in: ["expired", "pending", "authorized"] },
            $or: [{ inventoryReleased: true }, { payment_status: "expired" }]
          },
          { $set: { payment_status: "paid_review_required", payment_id: paymentId } },
          { new: true }
        );
        if (!reviewOrder) {
          const current = await OrderModel.findOne({ _id: order._id, userId: req.userId }).select("payment_status payment_id");
          if (!(current?.payment_status === "paid" && current.payment_id === paymentId)) {
            return res.status(409).json({ success: false, message: "Payment state changed. Contact support before retrying." });
          }
        }
        if (reviewOrder) {
          return res.status(200).json({
            success: true, reviewRequired: true, paymentStatus: reviewOrder.payment_status,
            message: "Payment received after the reservation expired. Support will review this order."
          });
        }
      }
    } else {
      if (order.payment_status === "expired" || order.inventoryReleased) return res.status(409).json({ success: false, message: "This payment reservation has expired. Please start a new checkout." });
      const authorizedOrder = await OrderModel.findOneAndUpdate(
        {
          _id: order._id, userId: req.userId, inventoryReleased: false,
          delivery_status: "processing", payment_status: { $in: ["pending", "authorized"] }
        },
        { $set: { payment_status: "authorized", payment_id: paymentId } },
        { new: true }
      );
      if (!authorizedOrder) return res.status(409).json({ success: false, message: "This payment reservation expired or changed during verification. Please refresh your orders." });
    }
    const latest = await OrderModel.findOne({ _id: order._id, userId: req.userId });
    if (!latest) return res.status(404).json({ success: false, message: "Payment order not found" });
    return res.json({
      success: true,
      paymentStatus: latest.payment_status,
      reviewRequired: latest.payment_status === "paid_review_required",
      message: latest.payment_status === "paid" ? "Payment verified" :
        latest.payment_status === "paid_review_required" ? "Payment received. Support will review this order." :
        "Payment authorized; final confirmation is pending"
    });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Unable to verify payment" }); }
}

export async function handleRazorpayWebhook(req, res) {
  try {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) return res.status(503).json({ success: false, message: "Webhook is not configured" });
    if (!Buffer.isBuffer(req.body)) return res.status(400).json({ success: false, message: "Raw webhook body is required" });
    const signature = String(req.headers["x-razorpay-signature"] || "");
    if (!verifyHmacHex(req.body, signature, secret)) return res.status(400).json({ success: false, message: "Invalid webhook signature" });
    const event = JSON.parse(req.body.toString("utf8"));
    if (["refund.processed", "refund.failed"].includes(event.event)) {
      const refund = event.payload?.refund?.entity;
      if (!refund?.payment_id || !refund?.id) return res.json({ success: true, ignored: true });
      await reconcileRazorpayRefund(refund, event.event);
      return res.json({ success: true });
    }
    if (!["payment.captured", "order.paid", "payment.failed"].includes(event.event)) return res.json({ success: true, ignored: true });
    const payment = event.payload?.payment?.entity;
    const gatewayOrder = event.payload?.order?.entity;
    const gatewayOrderId = payment?.order_id || gatewayOrder?.id;
    if (!gatewayOrderId) return res.json({ success: true, ignored: true });
    const order = await OrderModel.findOne({ razorpayOrderId: gatewayOrderId });
    if (!order) return res.json({ success: true, ignored: true });
    if (event.event === "payment.failed") {
      // Razorpay can emit payment.failed for one attempt while the customer
      // still has other attempts available on the same gateway order. Keep the
      // order and its stock reservation alive until the reservation expires;
      // the expiry worker is the single place that releases abandoned stock.
      return res.json({ success: true, ignored: true, reason: "payment_attempt_failed_reservation_retained" });
    } else {
      // order.paid webhooks carry the order entity, not necessarily a payment
      // entity. Resolve the captured payment from Razorpay so refunds always
      // have the payment_id required by the refunds API.
      let paidPayment = payment;
      if (event.event === "order.paid" && !paidPayment?.id) {
        const paymentList = await gatewayRequest(`/orders/${encodeURIComponent(gatewayOrderId)}/payments`);
        paidPayment = (paymentList.items || []).find(item =>
          item.order_id === gatewayOrderId &&
          item.status === "captured" &&
          Number(item.amount) === Math.round(Number(order.totalAmt) * 100) &&
          item.currency === "INR"
        ) || null;
      }
      const paidEntity = paidPayment || (event.event === "order.paid" && gatewayOrder ? {
        amount: gatewayOrder.amount_paid, currency: gatewayOrder.currency, status: gatewayOrder.status
      } : null);
      const amountIsValid = isValidRazorpayAmount(paidEntity, Math.round(Number(order.totalAmt) * 100));
      const captured = event.event === "payment.captured" ? paidPayment?.status === "captured" : gatewayOrder?.status === "paid" || paidPayment?.status === "captured";
      if (!paidEntity || !amountIsValid || !captured || (event.event === "order.paid" && !paidPayment?.id)) {
        return res.status(400).json({ success: false, message: "Webhook payment amount, currency or captured payment ID could not be verified" });
      }
      // Apply the captured payment against the order's current database state,
      // not the snapshot read before the gateway lookup. Reservation expiry may
      // have released stock while this webhook was resolving the payment.
      if (order.payment_status === "paid" && order.payment_id === paidPayment.id) {
        return res.json({ success: true, alreadyProcessed: true });
      }

      const paidOrder = await OrderModel.findOneAndUpdate(
        {
          _id: order._id,
          paymentMethod: "RAZORPAY",
          payment_status: { $in: ["pending", "authorized"] },
          inventoryReleased: false,
          delivery_status: "processing"
        },
        { $set: { payment_status: "paid", payment_id: paidPayment.id } },
        { new: true }
      );

      if (!paidOrder) {
        // If expiry won the race, preserve the captured payment for manual
        // reconciliation; never mark a stock-released order as normally paid.
        const reviewOrder = await OrderModel.findOneAndUpdate(
          {
            _id: order._id,
            paymentMethod: "RAZORPAY",
            payment_status: { $in: ["expired", "pending", "authorized"] },
            $or: [{ inventoryReleased: true }, { payment_status: "expired" }]
          },
          { $set: { payment_status: "paid_review_required", payment_id: paidPayment.id } },
          { new: true }
        );
        if (!reviewOrder) {
          const latest = await OrderModel.findById(order._id).select("payment_status payment_id");
          if (!(latest?.payment_status === "paid" && latest.payment_id === paidPayment.id)) {
            return res.status(409).json({ success: false, message: "Captured payment could not be matched to the current order state" });
          }
        }
      }
    }
    return res.json({ success: true });
  } catch (error) {
    // Signature/body errors are permanent client-side webhook failures. For
    // transient gateway, database, or transaction errors, return 5xx so
    // Razorpay can retry delivery instead of silently losing reconciliation.
    if (error instanceof SyntaxError || /Refund webhook amount or currency does not match the order|Webhook payment amount, currency or captured payment ID could not be verified|Refund response is missing/i.test(error.message || "")) {
      return res.status(400).json({ success: false, message: error.message || "Invalid webhook payload" });
    }
    return res.status(503).json({ success: false, message: "Webhook processing is temporarily unavailable; retry delivery" });
  }
}

export async function expireRazorpayReservations() {
  const expired = await OrderModel.find({
    paymentMethod: "RAZORPAY",
    payment_status: { $in: ["pending", "authorized"] },
    inventoryReleased: false,
    paymentReservationExpiresAt: { $lte: new Date() }
  }).select("_id").limit(100).lean();

  for (const candidate of expired) {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        // Expire the order and restore every product in one MongoDB transaction.
        // A crash cannot leave the order marked released while stock remains deducted,
        // and concurrent workers cannot restore the same reservation twice.
        const claimed = await OrderModel.findOneAndUpdate({
          _id: candidate._id,
          paymentMethod: "RAZORPAY",
          payment_status: { $in: ["pending", "authorized"] },
          inventoryReleased: false,
          paymentReservationExpiresAt: { $lte: new Date() }
        }, {
          $set: {
            payment_status: "expired",
            inventoryReleased: true,
            delivery_status: "cancelled",
            cancelledAt: new Date()
          }
        }, { new: true, session });

        if (claimed) await restoreOrderStock(claimed, session);
      });
    } finally {
      await session.endSession();
    }
  }
}