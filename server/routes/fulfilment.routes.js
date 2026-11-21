import { Router } from "express";
import auth from "../middleware/auth.js";
import requireStaff from "../middleware/staff.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import {
  listPickerOrders, updatePickerOrder, listRiderOrders, updateRiderOrder,
  updateRiderLocation, verifyDeliveryOtp
} from "../controllers/fulfilment.controller.js";

const router = Router();
const deliveryOtpVerifyLimiter = createRateLimiter({ name: "delivery-otp-verify", windowMs: 15 * 60 * 1000, max: 30 });
const riderLocationLimiter = createRateLimiter({ name: "rider-location", windowMs: 15 * 60 * 1000, max: 240 });
router.use(auth);
router.get("/picker/orders", requireStaff("picker"), listPickerOrders);
router.patch("/picker/orders/:id/status", requireStaff("picker"), updatePickerOrder);
router.get("/rider/orders", requireStaff("rider"), listRiderOrders);
router.patch("/rider/orders/:id/status", requireStaff("rider"), updateRiderOrder);
router.patch("/rider/orders/:id/location", requireStaff("rider"), riderLocationLimiter, updateRiderLocation);
router.post("/rider/orders/:id/verify-otp", requireStaff("rider"), deliveryOtpVerifyLimiter, verifyDeliveryOtp);
export default router;
