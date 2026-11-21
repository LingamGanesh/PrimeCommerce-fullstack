import mongoose from "mongoose";

const couponSchema = new mongoose.Schema({
  code: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
  type: { type: String, enum: ["flat", "percent"], required: true },
  value: { type: Number, required: true, min: 0 },
  minOrder: { type: Number, default: 0, min: 0 },
  maxDiscount: { type: Number, default: null, min: 0 },
  usageLimit: { type: Number, default: null, min: 1 },
  usagePerUser: { type: Number, default: 1, min: 1 },
  usedCount: { type: Number, default: 0, min: 0 },
  startsAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: null },
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
export default mongoose.models.Coupon || mongoose.model("Coupon", couponSchema);
