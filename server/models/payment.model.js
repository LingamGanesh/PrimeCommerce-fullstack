import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: "Order", required: true, index: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  gateway: { type: String, enum: ["razorpay", "cod", "wallet"], default: "razorpay" },
  gatewayOrderId: { type: String, default: "", index: true },
  gatewayPaymentId: { type: String, default: "", unique: true, sparse: true, index: true },
  amount: { type: Number, required: true, min: 0 },
  currency: { type: String, default: "INR" },
  status: { type: String, enum: ["created", "pending", "paid", "failed", "refund_pending", "refunded", "partially_refunded"], default: "created", index: true },
  signatureVerified: { type: Boolean, default: false },
  refunds: { type: [mongoose.Schema.Types.Mixed], default: [] },
  raw: { type: mongoose.Schema.Types.Mixed, default: undefined }
}, { timestamps: true });
export default mongoose.models.Payment || mongoose.model("Payment", paymentSchema);
