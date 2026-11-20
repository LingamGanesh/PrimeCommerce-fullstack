import { Router } from "express";
import auth from "../middleware/auth.js";
import { createRateLimiter } from "../middleware/rateLimit.js";
import { createMySupportTicket, listMySupportTickets } from "../controllers/support.controller.js";

const router = Router();
const supportTicketLimiter = createRateLimiter({ name: "support-ticket-create", windowMs: 30 * 60 * 1000, max: 5 });
router.use(auth);
router.get("/mine", listMySupportTickets);
router.post("/", supportTicketLimiter, createMySupportTicket);
export default router;
