import mongoose from "mongoose";

const appConfigSchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, index: true },
  value: { type: mongoose.Schema.Types.Mixed, required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }
}, { timestamps: true });
export default mongoose.models.AppConfig || mongoose.model("AppConfig", appConfigSchema);
