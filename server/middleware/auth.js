import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";

const auth = async (req, res, next) => {
  try {
    const authorization = req.headers?.authorization || "";
    const bearerToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
    const cookieToken = req.cookies?.accessToken;
    const token = cookieToken || bearerToken;

    // SameSite=None is required when frontend and API use separate hosting
    // domains. Protect cookie-authenticated state changes against CSRF.
    if (cookieToken && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const origin = String(req.headers?.origin || "").replace(/\/$/, "");
      const allowedOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
        .filter(Boolean)
        .flatMap(value => value.split(","))
        .map(value => value.trim().replace(/\/$/, ""))
        .filter(Boolean);
      const isLocalDevelopmentOrigin = process.env.NODE_ENV !== "production"
        && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
      if (!origin || (!allowedOrigins.includes(origin) && !isLocalDevelopmentOrigin)) {
        return res.status(403).json({ message: "Request origin is not allowed", error: true, success: false });
      }
    }

    if (!token) {
      return res.status(401).json({ message: "Token not provided", error: true, success: false });
    }

    const secret = process.env.SECRET_KEY_ACCESS_TOKEN || process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ message: "Authentication secret is not configured", error: true, success: false });
    }

    const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] });
    if (!decoded.id || !Number.isInteger(decoded.tokenVersion)) {
      return res.status(401).json({ message: "Session is invalid. Please log in again.", error: true, success: false });
    }

    const user = await UserModel.findById(decoded.id).select("+tokenVersion status");
    if (!user || user.status !== "active" || user.tokenVersion !== decoded.tokenVersion) {
      return res.status(401).json({ message: "Session expired or revoked. Please log in again.", error: true, success: false });
    }

    req.userId = user._id.toString();
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized access", error: true, success: false });
  }
};

export default auth;
