import { Router } from "express";
import auth from "../middleware/auth.js";
import requireStaff from "../middleware/staff.js";
import { listPickerOrders, updatePickerOrder, listRiderOrders, updateRiderOrder } from "../controllers/fulfilment.controller.js";

const router = Router();
router.use(auth);
router.get("/picker/orders", requireStaff("picker"), listPickerOrders);
router.patch("/picker/orders/:id/status", requireStaff("picker"), updatePickerOrder);
router.get("/rider/orders", requireStaff("rider"), listRiderOrders);
router.patch("/rider/orders/:id/status", requireStaff("rider"), updateRiderOrder);
export default router;
