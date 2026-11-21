import mongoose from "mongoose";
import { createHash, timingSafeEqual } from "node:crypto";
import OrderModel from "../models/order.model.js";

function serialize(order) {
  const value = order.toObject ? order.toObject() : order;
  let items = [];
  try { items = JSON.parse(value.product_details || "[]"); } catch { items = []; }
  return { ...value, items };
}

export async function listPickerOrders(req, res) {
  try {
    const orders = await OrderModel.find({ pickerId: req.userId, delivery_status: { $in: ["picking", "packed"] } })
      .populate("userId", "name mobile").sort({ updatedAt: -1 }).limit(50).lean();
    return res.json({ success: true, data: orders.map(serialize) });
  } catch { return res.status(500).json({ success: false, message: "Unable to load picker queue" }); }
}

export async function updatePickerOrder(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id) || req.body?.delivery_status !== "packed") {
      return res.status(400).json({ success: false, message: "Picker can only mark an assigned order as packed" });
    }
    const order = await OrderModel.findOneAndUpdate(
      { _id: req.params.id, pickerId: req.userId, delivery_status: "picking" },
      { $set: { delivery_status: "packed" } }, { new: true }
    );
    if (!order) return res.status(404).json({ success: false, message: "Assigned picking order not found" });
    return res.json({ success: true, message: "Order marked packed", data: serialize(order) });
  } catch { return res.status(500).json({ success: false, message: "Unable to update picking order" }); }
}

export async function listRiderOrders(req, res) {
  try {
    const orders = await OrderModel.find({ riderId: req.userId, delivery_status: { $in: ["rider_assigned", "picked_up", "out_for_delivery"] } })
      .populate("userId", "name mobile").sort({ updatedAt: -1 }).limit(50).lean();
    return res.json({ success: true, data: orders.map(serialize) });
  } catch { return res.status(500).json({ success: false, message: "Unable to load rider deliveries" }); }
}

export async function updateRiderOrder(req, res) {
  try {
    const transitions = {
      rider_assigned: { next: "picked_up", from: "rider_assigned" },
      picked_up: { next: "out_for_delivery", from: "picked_up" }
    };
    const transition = transitions[req.body?.delivery_status];
    if (!mongoose.isValidObjectId(req.params.id) || !transition) {
      return res.status(400).json({ success: false, message: "Unsupported delivery update. Delivery completion requires customer OTP." });
    }
    const update = { delivery_status: transition.next };
    if (transition.next === "picked_up") update.pickedAt = new Date();
    const order = await OrderModel.findOneAndUpdate(
      { _id: req.params.id, riderId: req.userId, delivery_status: transition.from },
      { $set: update }, { new: true }
    );
    if (!order) return res.status(409).json({ success: false, message: "Order is not assigned to you or its status has changed" });
    return res.json({ success: true, message: `Delivery updated: ${transition.next.replaceAll("_", " ")}`, data: serialize(order) });
  } catch { return res.status(500).json({ success: false, message: "Unable to update delivery" }); }
}

export async function updateRiderLocation(req, res) {
  try {
    const { lat, lng } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id) || !Number.isFinite(lat) || !Number.isFinite(lng) ||
        lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ success: false, message: "Provide valid latitude and longitude" });
    }
    const order = await OrderModel.findOneAndUpdate({
      _id: req.params.id, riderId: req.userId, delivery_status: { $in: ["picked_up", "out_for_delivery"] }
    }, { $set: { riderLocation: { lat, lng, updatedAt: new Date() } } }, {
      new: true, projection: { _id: 1, riderLocation: 1, delivery_status: 1 }
    });
    if (!order) return res.status(409).json({ success: false, message: "Location sharing is available only for your picked-up active deliveries" });
    return res.json({ success: true, message: "Delivery location updated", data: order.riderLocation });
  } catch { return res.status(500).json({ success: false, message: "Unable to update rider location" }); }
}

export async function verifyDeliveryOtp(req, res) {
  try {
    const { otp } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id) || !/^\\d{6}$/.test(String(otp || ""))) {
      return res.status(400).json({ success: false, message: "Enter the customer's 6-digit delivery OTP" });
    }

    const now = new Date();
    const submittedHash = createHash("sha256").update(String(otp)).digest("hex");
    const activeDelivery = {
      _id: req.params.id,
      riderId: req.userId,
      delivery_status: "out_for_delivery",
      deliveryOtpHash: { $exists: true, $nin: [null, ""] },
      deliveryOtpExpiresAt: { $gt: now },
      deliveryOtpAttempts: { $lt: 5 }
    };

    // Complete delivery and consume the OTP in one atomic write. Concurrent
    // requests cannot both complete the same order.
    const delivered = await OrderModel.findOneAndUpdate(
      { ...activeDelivery, deliveryOtpHash: submittedHash },
      {
        $set: {
          delivery_status: "delivered",
          deliveredAt: now,
          riderLocation: { lat: null, lng: null, updatedAt: null },
          deliveryOtpHash: null,
          deliveryOtpExpiresAt: null,
          deliveryOtpAttempts: 0
        }
      },
      { new: true }
    );

    if (delivered) {
      return res.json({
        success: true,
        message: "Delivery verified and marked delivered",
        data: { orderId: delivered.orderId, deliveryStatus: delivered.delivery_status, deliveredAt: delivered.deliveredAt }
      });
    }

    // Count an incorrect code atomically, only while the same delivery and
    // unexpired OTP are still active. This prevents parallel requests from
    // bypassing the five-attempt limit.
    const failedAttempt = await OrderModel.findOneAndUpdate(
      { ...activeDelivery, deliveryOtpHash: { $ne: submittedHash } },
      { $inc: { deliveryOtpAttempts: 1 } },
      { new: true, projection: { deliveryOtpAttempts: 1 } }
    );

    if (failedAttempt) {
      const remaining = Math.max(0, 5 - failedAttempt.deliveryOtpAttempts);
      return res.status(400).json({
        success: false,
        message: remaining
          ? `Incorrect OTP. ${remaining} attempts remaining.`
          : "Too many incorrect attempts. Ask the customer to generate a new OTP."
      });
    }

    const currentOrder = await OrderModel.findOne({
      _id: req.params.id,
      riderId: req.userId,
      delivery_status: "out_for_delivery"
    }).select("+deliveryOtpHash +deliveryOtpExpiresAt +deliveryOtpAttempts").lean();

    if (!currentOrder) {
      return res.status(409).json({ success: false, message: "Active delivery assigned to you was not found or has already been completed" });
    }
    if (currentOrder.deliveryOtpAttempts >= 5) {
      return res.status(429).json({ success: false, message: "Too many incorrect attempts. Ask the customer to generate a new OTP." });
    }
    return res.status(409).json({ success: false, message: "Customer OTP is missing or expired. Ask the customer to generate a new code." });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to verify delivery OTP" });
  }
}
