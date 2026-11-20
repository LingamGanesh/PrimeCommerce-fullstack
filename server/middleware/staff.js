import UserModel from "../models/user.model.js";

export default function requireStaff(role) {
  return async (req, res, next) => {
    try {
      const user = await UserModel.findById(req.userId).select("role status");
      if (!user || user.status !== "active" || user.role !== role) {
        return res.status(403).json({ success: false, message: `${role} access required` });
      }
      req.staffRole = role;
      return next();
    } catch {
      return res.status(500).json({ success: false, message: "Unable to verify staff access" });
    }
  };
}
