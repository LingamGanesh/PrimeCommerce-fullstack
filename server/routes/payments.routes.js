import { Router } from "express";
import auth from "../middleware/auth.js";
import { createRazorpayOrder, verifyRazorpayPayment } from "../controllers/payments.controller.js";

const router = Router();
router.use(auth);
router.post("/razorpay/order", createRazorpayOrder);
router.post("/razorpay/verify", verifyRazorpayPayment);
export default router;