import mongoose from "mongoose";
import SupportTicketModel from "../models/supportTicket.model.js";
import OrderModel from "../models/order.model.js";

export async function createMySupportTicket(req, res) {
  try {
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();
    const orderId = req.body?.orderId || null;
    if (subject.length < 4 || subject.length > 120 || message.length < 10 || message.length > 3000) return res.status(400).json({ success: false, message: "Subject must be 4–120 characters and message 10–3000 characters" });
    let linkedOrder = null;
    if (orderId) {
      if (!mongoose.isValidObjectId(orderId)) return res.status(400).json({ success: false, message: "Invalid order reference" });
      linkedOrder = await OrderModel.findOne({ _id: orderId, userId: req.userId }).select("_id");
      if (!linkedOrder) return res.status(404).json({ success: false, message: "Order not found" });
    }
    const ticket = await SupportTicketModel.create({ userId: req.userId, orderId: linkedOrder?._id || null, subject, message });
    return res.status(201).json({ success: true, data: ticket });
  } catch { return res.status(500).json({ success: false, message: "Unable to create support ticket" }); }
}

export async function listMySupportTickets(req, res) {
  try { const tickets = await SupportTicketModel.find({ userId: req.userId }).populate("orderId", "orderId").sort({ updatedAt: -1 }).limit(50).lean(); return res.json({ success: true, data: tickets }); }
  catch { return res.status(500).json({ success: false, message: "Unable to load support tickets" }); }
}

export async function listAdminSupportTickets(req, res) {
  try { const tickets = await SupportTicketModel.find({}).populate("userId", "name email mobile").populate("orderId", "orderId").sort({ status: 1, updatedAt: -1 }).limit(100).lean(); return res.json({ success: true, data: tickets }); }
  catch { return res.status(500).json({ success: false, message: "Unable to load support queue" }); }
}

export async function updateAdminSupportTicket(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid ticket id" });
    const status = req.body?.status;
    const adminReply = String(req.body?.adminReply || "").trim();
    if (!["open", "in_progress", "resolved", "closed"].includes(status) || adminReply.length > 3000) return res.status(400).json({ success: false, message: "Choose a valid ticket status and reply" });
    const update = { status, adminReply, repliedAt: adminReply ? new Date() : null };
    const ticket = await SupportTicketModel.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true }).populate("userId", "name email mobile").populate("orderId", "orderId");
    if (!ticket) return res.status(404).json({ success: false, message: "Support ticket not found" });
    return res.json({ success: true, data: ticket });
  } catch { return res.status(500).json({ success: false, message: "Unable to update support ticket" }); }
}