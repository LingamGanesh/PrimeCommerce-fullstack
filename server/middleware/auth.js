import jwt from "jsonwebtoken";
import UserModel from "../models/user.model.js";

const auth = async (req, res, next) => {
  try {
    const authorization = req.headers?.authorization || "";
    const bearerToken = /^Bearer\s+(.+)$/i.exec(authorization)?.[1];
    const token = req.cookies?.accessToken || bearerToken;

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
