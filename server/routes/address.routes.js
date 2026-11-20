import { Router } from "express";
import auth from "../middleware/auth.js";
import { createAddress, deleteAddress, listAddresses } from "../controllers/address.controller.js";

const router = Router();
router.use(auth);
router.get("/", listAddresses);
router.post("/", createAddress);
router.delete("/:id", deleteAddress);
export default router;
