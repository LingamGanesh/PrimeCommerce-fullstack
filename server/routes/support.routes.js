import { Router } from "express";
import auth from "../middleware/auth.js";
import { createMySupportTicket, listMySupportTickets } from "../controllers/support.controller.js";

const router = Router();
router.use(auth);
router.get("/mine", listMySupportTickets);
router.post("/", createMySupportTicket);
export default router;
