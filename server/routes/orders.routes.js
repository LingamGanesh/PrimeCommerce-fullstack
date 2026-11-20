import { Router } from "express";
import auth from "../middleware/auth.js";
import { listMyOrders } from "../controllers/orders.controller.js";

const router = Router();
router.use(auth);
router.get("/mine", listMyOrders);
export default router;
