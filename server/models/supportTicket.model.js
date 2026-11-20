import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", default: null, index: true },
  subject: { type: String, required: true, trim: true, maxlength: 120 },
  message: { type: String, required: true, trim: true, maxlength: 3000 },
  status: { type: String, enum: ["open", "in_progress", "resolved", "closed"], default: "open", index: true },
  priority: { type: String, enum: ["normal", "high"], default: "normal" },
  adminReply: { type: String, default: "", maxlength: 3000 },
  repliedAt: { type: Date, default: null }
}, { timestamps: true });

supportTicketSchema.index({ status: 1, updatedAt: -1 });
export default mongoose.model("SupportTicket", supportTicketSchema);