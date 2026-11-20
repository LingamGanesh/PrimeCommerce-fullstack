import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { getAdminOverview, listAdminProducts, listAdminOrders, updateAdminOrderStatus, listAdminCustomers, getAdminSalesReport, assignFulfilmentRole, assignOrderPicker, assignOrderRider, listAdminStaff, listAdminRefunds } from "../controllers/admin.controller.js";

<<<<<<< HEAD
import { listAdminSupportTickets, updateAdminSupportTicket } from "../controllers/support.controller.js";

=======
>>>>>>> b8dec3f4ca3eceb2bc6a95953f5357cef830a7a0
const router = Router();
router.use(auth, admin);
router.get("/overview", getAdminOverview);
router.get("/customers", listAdminCustomers);
router.get("/reports/sales", getAdminSalesReport);
router.get("/refunds", listAdminRefunds);
<<<<<<< HEAD
router.get("/support", listAdminSupportTickets);
router.patch("/support/:id", updateAdminSupportTicket);
=======
>>>>>>> b8dec3f4ca3eceb2bc6a95953f5357cef830a7a0
router.post("/staff/role", assignFulfilmentRole);
router.get("/staff", listAdminStaff);
router.patch("/orders/:id/assign-picker", assignOrderPicker);
router.patch("/orders/:id/assign-rider", assignOrderRider);
router.get("/products", listAdminProducts);
router.get("/orders", listAdminOrders);
router.patch("/orders/:id/status", updateAdminOrderStatus);
export default router;