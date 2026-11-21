import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  audience: { type: String, enum: ["customer", "admin", "rider", "all"], default: "customer" },
  title: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  type: { type: String, default: "general" },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  readAt: { type: Date, default: null },
  sentAt: { type: Date, default: null }
}, { timestamps: true });
export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
