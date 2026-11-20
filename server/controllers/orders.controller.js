import mongoose from "mongoose";
import { createHash, randomInt } from "node:crypto";
import OrderModel from "../models/order.model.js";

export async function listMyOrders(req, res) {
  try {
    const orders = await OrderModel.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50).lean();
    const data = orders.map((order) => {
      let items = [];
      try { items = JSON.parse(order.product_details || "[]"); } catch { items = []; }
      return {
        id: order._id.toString(), orderId: order.orderId, items,
        address: order.delivery_address, subtotal: order.subTotalAmt, total: order.totalAmt,
        paymentStatus: order.payment_status, deliveryStatus: order.delivery_status, createdAt: order.createdAt
      };
    });
    return res.json({ success: true, error: false, data });
  } catch { return res.status(500).json({ success: false, error: true, message: "Unable to load your orders" }); }
}

export async function getMyOrderTracking(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid order id" });
    const order = await OrderModel.findOne({ _id: req.params.id, userId: req.userId })
      .select("orderId delivery_status riderId riderLocation pickedAt deliveredAt updatedAt")
      .populate("riderId", "name mobile").lean();
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    return res.json({
      success: true,
      data: {
        orderId: order.orderId, deliveryStatus: order.delivery_status,
        rider: order.riderId ? { name: order.riderId.name, mobile: order.riderId.mobile } : null,
        location: order.delivery_status === "delivered" ? null : order.riderLocation,
        pickedAt: order.pickedAt, deliveredAt: order.deliveredAt, updatedAt: order.updatedAt
      }
    });
  } catch { return res.status(500).json({ success: false, message: "Unable to load delivery tracking" }); }
}

export async function issueMyDeliveryOtp(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid order id" });
    const order = await OrderModel.findOne({ _id: req.params.id, userId: req.userId, delivery_status: "out_for_delivery" })
      .select("+deliveryOtpHash +deliveryOtpExpiresAt +deliveryOtpAttempts");
    if (!order) return res.status(409).json({ success: false, message: "Delivery OTP is available when your order is out for delivery" });
    const now = new Date();
    const otp = String(randomInt(0, 1000000)).padStart(6, "0");
    order.deliveryOtpHash = createHash("sha256").update(otp).digest("hex");
    order.deliveryOtpExpiresAt = new Date(now.getTime() + 30 * 60 * 1000);
    order.deliveryOtpAttempts = 0;
    await order.save();
    return res.json({ success: true, message: "Share this one-time code with your delivery rider only when they arrive. It expires in 30 minutes; generating another code invalidates this one.", data: { otp, expiresAt: order.deliveryOtpExpiresAt } });
  } catch { return res.status(500).json({ success: false, message: "Unable to generate delivery OTP" }); }
}
