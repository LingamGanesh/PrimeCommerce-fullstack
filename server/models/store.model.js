import mongoose from "mongoose";

const storeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  slug: { type: String, required: true, trim: true, lowercase: true, unique: true },
  address: { type: String, required: true, trim: true },
  pincodes: { type: [String], default: [], index: true },
  location: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number], default: undefined }
  },
  openTime: { type: String, default: "07:00" },
  closeTime: { type: String, default: "23:00" },
  isActive: { type: Boolean, default: true, index: true },
  deliveryEtaMinutes: { type: Number, default: 10, min: 1, max: 180 }
}, { timestamps: true });
storeSchema.index({ location: "2dsphere" });
export default mongoose.models.Store || mongoose.model("Store", storeSchema);
