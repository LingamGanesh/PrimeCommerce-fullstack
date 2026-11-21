import { Router } from "express";
import auth from "../middleware/auth.js";
import { createRazorpayOrder, retryRazorpayPayment, verifyRazorpayPayment } from "../controllers/payments.controller.js";
import { createRateLimiter } from "../middleware/rateLimit.js";

const router = Router();
const paymentOrderLimiter = createRateLimiter({ name: "razorpay-order", windowMs: 15 * 60 * 1000, max: 5 });
const paymentVerifyLimiter = createRateLimiter({ name: "razorpay-verify", windowMs: 15 * 60 * 1000, max: 10 });
const paymentRetryLimiter = createRateLimiter({ name: "razorpay-retry", windowMs: 15 * 60 * 1000, max: 10 });
router.use(auth);
router.post("/razorpay/order", paymentOrderLimiter, createRazorpayOrder);
router.post("/razorpay/:id/retry", paymentRetryLimiter, retryRazorpayPayment);
router.post("/razorpay/verify", paymentVerifyLimiter, verifyRazorpayPayment);
export default router;
