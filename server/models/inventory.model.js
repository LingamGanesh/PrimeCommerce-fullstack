import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", required: true, index: true },
  quantity: { type: Number, default: 0, min: 0 },
  reserved: { type: Number, default: 0, min: 0 },
  reorderLevel: { type: Number, default: 10, min: 0 },
  batches: { type: [mongoose.Schema.Types.Mixed], default: [] }
}, { timestamps: true });
inventorySchema.index({ storeId: 1, variantId: 1 }, { unique: true });
inventorySchema.index({ storeId: 1, quantity: 1, reorderLevel: 1 });
export default mongoose.models.Inventory || mongoose.model("Inventory", inventorySchema);
