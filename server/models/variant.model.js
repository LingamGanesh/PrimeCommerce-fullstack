import mongoose from "mongoose";

const variantSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true, index: true },
  sku: { type: String, required: true, trim: true, uppercase: true, unique: true, index: true },
  barcode: { type: String, trim: true, default: "", index: true },
  unit: { type: String, required: true, trim: true },
  mrp: { type: Number, required: true, min: 0 },
  sellingPrice: { type: Number, required: true, min: 0 },
  taxPercent: { type: Number, default: 0, min: 0, max: 100 },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });
variantSchema.index({ productId: 1, unit: 1 }, { unique: true });
export default mongoose.models.Variant || mongoose.model("Variant", variantSchema);
