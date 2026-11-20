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
const getCartSnapshot = async (userId) => {
  const rows = await CartProductModel.find({ userId }).populate({ path: "productId", select: "name image unit price stock publish" });
  if (!rows.length) throw new Error("Your cart is empty");
  const items = []; let subtotal = 0;
  for (const row of rows) {
    const product = row.productId;
    if (!product || !product.publish) throw new Error("A product in your cart is no longer available");
    const unitPrice = roundMoney(product.price);
    const lineTotal = roundMoney(unitPrice * row.quantity); subtotal = roundMoney(subtotal + lineTotal);
    items.push({ productId: product._id, name: product.name, image: product.image || [], unit: product.unit, unitPrice, quantity: row.quantity, lineTotal });
  }
  return { items, subtotal };
};
const reserveStock = async (items) => {
  const reserved = [];
  try {
    for (const item of items) {
      const product = await ProductModel.findOneAndUpdate({ _id: item.productId, publish: true, stock: { $gte: item.quantity } }, { $inc: { stock: -item.quantity } }, { new: true });
      if (!product) throw new Error(`Insufficient stock for ${item.name}. Please update your cart.`);
      reserved.push(item);
    }
    return reserved;
  } catch (error) {
    await Promise.all(reserved.map(item => ProductModel.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })));
    throw error;
  }
};
const restoreOrderStock = async (order) => {
  let items = [];
  try { items = JSON.parse(order.product_details || "[]"); } catch { return; }
  await Promise.all(items.map(item => ProductModel.updateOne({ _id: item.productId }, { $inc: { stock: Number(item.quantity) || 0 } })));
};

export async function createRazorpayOrder(req, res) {
  let reserved = []; let savedOrder = null;
  try {
    // Recover stock from expired reservations when a new online checkout is attempted.
    await expireRazorpayReservations();
    const { addressId } = req.body;
    if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ success: false, message: "Select a valid delivery address" });
    const address = await AddressModel.findOne({ _id: addressId, userId: req.userId }).lean();
    if (!address) return res.status(404).json({ success: false, message: "Delivery address not found" });
    const { items, subtotal } = await getCartSnapshot(req.userId);
    reserved = await reserveStock(items);
    const orderId = "PC" + Date.now().toString(36).toUpperCase() + crypto.randomBytes(3).toString("hex").toUpperCase();
    const gatewayOrder = await gatewayRequest("/orders", { method: "POST", body: JSON.stringify({ amount: Math.round(subtotal * 100), currency: "INR", receipt: orderId, notes: { customerId: String(req.userId) } }) });
    const expiresAt = new Date(Date.now() + 20 * 60 * 1000);
    savedOrder = await OrderModel.create({
      userId: req.userId, orderId, product_details: JSON.stringify(items), payment_id: "", payment_status: "pending",
      paymentMethod: "RAZORPAY", razorpayOrderId: gatewayOrder.id, paymentReservationExpiresAt: expiresAt, inventoryReleased: false,
      delivery_address: { address_line: address.address_line, city: address.city, state: address.state, pincode: address.pincode, country: address.country, mobile: address.mobile },
      delivery_status: "processing", subTotalAmt: subtotal, totalAmt: subtotal
    });
    await UserModel.findByIdAndUpdate(req.userId, { $addToSet: { orderHistory: savedOrder._id } });
    await CartProductModel.deleteMany({ userId: req.userId });
    return res.status(201).json({ success: true, data: { orderDbId: savedOrder._id, orderId, razorpayOrderId: gatewayOrder.id, amount: gatewayOrder.amount, currency: gatewayOrder.currency, keyId: process.env.RAZORPAY_KEY_ID, expiresAt } });
  } catch (error) {
    if (savedOrder?._id) { await OrderModel.deleteOne({ _id: savedOrder._id }); await UserModel.findByIdAndUpdate(req.userId, { $pull: { orderHistory: savedOrder._id } }); }
    if (reserved.length) await Promise.all(reserved.map(item => ProductModel.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })));
    return res.status(400).json({ success: false, message: error.message || "Unable to start online payment" });
  }
}

export async function verifyRazorpayPayment(req, res) {
  try {
    const { razorpay_order_id: gatewayOrderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = req.body;
    if (![gatewayOrderId, paymentId, signature].every(value => typeof value === "string" && value.length > 0)) return res.status(400).json({ success: false, message: "Payment verification details are incomplete" });
    const order = await OrderModel.findOne({ razorpayOrderId: gatewayOrderId, userId: req.userId });
    if (!order) return res.status(404).json({ success: false, message: "Payment order not found" });
    const { secret } = razorpayAuth();
    const expected = crypto.createHmac("sha256", secret).update(`${gatewayOrderId}|${paymentId}`).digest("hex");
    const supplied = Buffer.from(signature, "hex"); const expectedBuffer = Buffer.from(expected, "hex");
    if (supplied.length !== expectedBuffer.length || !crypto.timingSafeEqual(supplied, expectedBuffer)) return res.status(400).json({ success: false, message: "Payment signature verification failed" });
    const payment = await gatewayRequest(`/payments/${encodeURIComponent(paymentId)}`);
    if (payment.order_id !== gatewayOrderId || !["authorized", "captured"].includes(payment.status) || Number(payment.amount) !== Math.round(Number(order.totalAmt) * 100) || payment.currency !== "INR") return res.status(400).json({ success: false, message: "Payment amount, currency or status could not be verified" });
    if (payment.status === "captured") {
      if (order.payment_status === "expired" || order.inventoryReleased) { order.payment_status = "paid_review_required"; order.payment_id = paymentId; await order.save(); return res.status(200).json({ success: true, reviewRequired: true, message: "Payment received after stock reservation expired. Support will review this order." }); }
      order.payment_status = "paid"; order.payment_id = paymentId; await order.save();
    } else { if (order.payment_status === "expired" || order.inventoryReleased) return res.status(409).json({ success: false, message: "This payment reservation has expired. Please start a new checkout." }); order.payment_status = "authorized"; order.payment_id = paymentId; await order.save(); }
    return res.json({ success: true, paymentStatus: order.payment_status, message: order.payment_status === "paid" ? "Payment verified" : "Payment authorized; final confirmation is pending" });
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
      if (!refund?.payment_id) return res.json({ success: true, ignored: true });
      const refundOrder = await OrderModel.findOne({ payment_id: refund.payment_id, refund_status: { $in: ["initiating", "pending", "failed"] } });
      if (!refundOrder) return res.json({ success: true, ignored: true });
      await OrderModel.updateOne({ _id: refundOrder._id, refund_status: { $in: ["pending", "failed"] } }, { $set: { refund_status: event.event === "refund.processed" ? "processed" : "failed", refund_id: refund.id || refundOrder.refund_id } });
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
      const claimed = await OrderModel.findOneAndUpdate({ _id: order._id, payment_status: { $in: ["pending", "authorized"] }, inventoryReleased: false }, { $set: { payment_status: "failed", inventoryReleased: true } }, { new: true });
      if (claimed) await restoreOrderStock(claimed);
    } else {
      const paidEntity = payment || (gatewayOrder ? { amount: gatewayOrder.amount_paid, currency: gatewayOrder.currency, status: gatewayOrder.status, id: null } : null);
      const amountIsValid = isValidRazorpayAmount(paidEntity, Math.round(Number(order.totalAmt) * 100));
      const captured = event.event === "payment.captured" ? payment?.status === "captured" : gatewayOrder?.status === "paid" || payment?.status === "captured";
      if (!paidEntity || !amountIsValid || !captured) return res.status(400).json({ success: false, message: "Webhook payment amount, currency or capture state is invalid" });
      if (order.payment_status === "expired" || order.inventoryReleased) {
        await OrderModel.updateOne({ _id: order._id, payment_status: { $in: ["expired", "pending", "authorized"] } }, { $set: { payment_status: "paid_review_required", payment_id: payment?.id || order.payment_id } });
      } else {
        await OrderModel.updateOne({ _id: order._id, payment_status: { $in: ["pending", "authorized"] } }, { $set: { payment_status: "paid", payment_id: payment?.id || order.payment_id } });
      }
    }
    return res.json({ success: true });
  } catch (error) { return res.status(400).json({ success: false, message: error.message || "Webhook processing failed" }); }
}

export async function expireRazorpayReservations() {
  const expired = await OrderModel.find({ paymentMethod: "RAZORPAY", payment_status: { $in: ["pending", "authorized"] }, inventoryReleased: false, paymentReservationExpiresAt: { $lte: new Date() } }).limit(100);
  for (const order of expired) {
    const claimed = await OrderModel.findOneAndUpdate({ _id: order._id, payment_status: { $in: ["pending", "authorized"] }, inventoryReleased: false, paymentReservationExpiresAt: { $lte: new Date() } }, { $set: { payment_status: "expired", inventoryReleased: true } }, { new: true });
    if (claimed) await restoreOrderStock(claimed);
  }
}