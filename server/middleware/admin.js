import UserModel from "../models/user.model.js";

const admin = async (req, res, next) => {
  try {
    const user = await UserModel.findById(req.userId).select("role status");
    if (!user || user.status !== "active" || user.role !== "admin") {
      return res.status(403).json({ success: false, error: true, message: "Admin access required" });
    }
    next();
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to verify admin access" });
  }
};

export default admin;
