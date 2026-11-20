import crypto from "node:crypto";
import RateLimitBucketModel from "../models/rateLimitBucket.model.js";

export function createRateLimiter({ name, windowMs, max }) {
  if (!name || !Number.isSafeInteger(windowMs) || windowMs < 1000 || !Number.isSafeInteger(max) || max < 1) {
    throw new Error("Invalid rate limiter configuration");
  }

  return async function rateLimit(req, res, next) {
    try {
      const now = Date.now();
      const windowId = Math.floor(now / windowMs);
      const expiresAt = new Date((windowId + 1) * windowMs);
      const identity = [
        String(req.ip || req.socket?.remoteAddress || "unknown"),
        String(req.body?.email || "").trim().toLowerCase()
      ].join("|");
      const identityHash = crypto.createHash("sha256").update(identity).digest("hex");
      const bucketKey = `${name}:${windowId}:${identityHash}`;

      let bucket;
      try {
        bucket = await RateLimitBucketModel.findOneAndUpdate(
          { bucketKey },
          { $inc: { count: 1 }, $setOnInsert: { expiresAt } },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        ).lean();
      } catch (error) {
        if (error?.code !== 11000) throw error;
        bucket = await RateLimitBucketModel.findOneAndUpdate(
          { bucketKey },
          { $inc: { count: 1 } },
          { new: true }
        ).lean();
      }

      const remaining = Math.max(0, max - bucket.count);
      res.set("RateLimit-Limit", String(max));
      res.set("RateLimit-Remaining", String(remaining));
      res.set("RateLimit-Reset", String(Math.ceil(expiresAt.getTime() / 1000)));
      if (bucket.count > max) {
        res.set("Retry-After", String(Math.max(1, Math.ceil((expiresAt.getTime() - now) / 1000))));
        return res.status(429).json({
          success: false,
          error: true,
          message: "Too many requests. Please try again later."
        });
      }
      return next();
    } catch (error) {
      console.error("Rate limiter unavailable:", error.message);
      return res.status(503).json({
        success: false,
        error: true,
        message: "Authentication service temporarily unavailable"
      });
    }
  };
}
