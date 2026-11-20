import mongoose from "mongoose";

const bannerSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  imageUrl: { type: String, default: "", trim: true },
  mobileImageUrl: { type: String, default: "" },
  linkType: { type: String, enum: ["none", "product", "category", "url"], default: "none" },
  linkId: { type: mongoose.Schema.Types.ObjectId, default: null },
  linkUrl: { type: String, default: "" },
  storeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
  sortOrder: { type: Number, default: 0 },
  startsAt: { type: Date, default: null },
  endsAt: { type: Date, default: null },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
export default mongoose.models.Banner || mongoose.model("Banner", bannerSchema);
