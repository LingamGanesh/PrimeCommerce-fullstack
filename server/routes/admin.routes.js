import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { getAdminOverview, listAdminProducts, listAdminOrders, updateAdminOrderStatus, listAdminCustomers, getAdminSalesReport } from "../controllers/admin.controller.js";

const router = Router();
router.use(auth, admin);
router.get("/overview", getAdminOverview);
router.get("/customers", listAdminCustomers);
router.get("/reports/sales", getAdminSalesReport);
router.get("/products", listAdminProducts);
router.get("/orders", listAdminOrders);
router.patch("/orders/:id/status", updateAdminOrderStatus);
export default router;