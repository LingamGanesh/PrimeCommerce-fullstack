import { Router } from "express";
import auth from "../middleware/auth.js";
import { listMyOrders, getMyOrderTracking, issueMyDeliveryOtp } from "../controllers/orders.controller.js";
import { cancelMyOrder } from "../controllers/cancellation.controller.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();
const deliveryOtpLimiter = createRateLimiter({ name: "delivery-otp", windowMs: 30 * 60 * 1000, max: 5 });
router.use(auth);
router.get("/mine", listMyOrders);
router.get("/:id/tracking", getMyOrderTracking);
router.post("/:id/delivery-otp", deliveryOtpLimiter, issueMyDeliveryOtp);
router.post("/:id/cancel", cancelMyOrder);
export default router;
