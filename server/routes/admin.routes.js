import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { getAdminOverview, listAdminProducts, listAdminOrders, updateAdminOrderStatus, listAdminCustomers, getAdminSalesReport, assignFulfilmentRole, assignOrderPicker, assignOrderRider } from "../controllers/admin.controller.js";

const router = Router();
router.use(auth, admin);
router.get("/overview", getAdminOverview);
router.get("/customers", listAdminCustomers);
router.get("/reports/sales", getAdminSalesReport);
router.post("/staff/role", assignFulfilmentRole);
router.patch("/orders/:id/assign-picker", assignOrderPicker);
router.patch("/orders/:id/assign-rider", assignOrderRider);
router.get("/products", listAdminProducts);
router.get("/orders", listAdminOrders);
router.patch("/orders/:id/status", updateAdminOrderStatus);
export default router;