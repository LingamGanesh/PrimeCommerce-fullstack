import mongoose from "mongoose";

const homeSectionSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  type: { type: String, enum: ["products", "category", "bestsellers", "offers"], default: "products" },
  productIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category" }],
  storeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store" }],
  sortOrder: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
export default mongoose.models.HomeSection || mongoose.model("HomeSection", homeSectionSchema);
