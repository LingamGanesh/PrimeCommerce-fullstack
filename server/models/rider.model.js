import mongoose from "mongoose";

const riderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
  storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null, index: true },
  vehicleType: { type: String, enum: ["bike", "scooter", "bicycle", "other"], default: "bike" },
  vehicleNumber: { type: String, trim: true, default: "" },
  kycStatus: { type: String, enum: ["pending", "verified", "rejected"], default: "pending", index: true },
  isOnline: { type: Boolean, default: false, index: true },
  currentLocation: {
    type: { type: String, enum: ["Point"] },
    coordinates: { type: [Number], default: undefined }
  },
  totalDeliveries: { type: Number, default: 0, min: 0 },
  earnings: { type: Number, default: 0, min: 0 }
}, { timestamps: true });
riderSchema.index({ currentLocation: "2dsphere" });
export default mongoose.models.Rider || mongoose.model("Rider", riderSchema);
