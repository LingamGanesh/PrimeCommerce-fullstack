import { Router } from "express";
import auth from "../middleware/auth.js";
import { listMyOrders, getMyOrderTracking, issueMyDeliveryOtp } from "../controllers/orders.controller.js";

const router = Router();
router.use(auth);
router.get("/mine", listMyOrders);
router.get("/:id/tracking", getMyOrderTracking);
router.post("/:id/delivery-otp", issueMyDeliveryOtp);
export default router;
