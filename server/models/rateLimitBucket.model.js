import mongoose from "mongoose";

const rateLimitBucketSchema = new mongoose.Schema({
  bucketKey: { type: String, required: true, unique: true },
  count: { type: Number, required: true, default: 0 },
  expiresAt: { type: Date, required: true }
}, { timestamps: true });

rateLimitBucketSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model("RateLimitBucket", rateLimitBucketSchema);
