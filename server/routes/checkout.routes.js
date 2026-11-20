import { Router } from "express";
import auth from "../middleware/auth.js";
import { createCashOnDeliveryOrder } from "../controllers/checkout.controller.js";

const router = Router();
router.use(auth);
router.post("/cod", createCashOnDeliveryOrder);
export default router;
