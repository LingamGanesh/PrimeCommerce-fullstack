import { Router } from "express";
import auth from "../middleware/auth.js";
import { addCartItem, getCart, removeCartItem, updateCartItem } from "../controllers/cart.controller.js";

const router = Router();
router.use(auth);
router.get("/", getCart);
router.post("/items", addCartItem);
router.patch("/items/:id", updateCartItem);
router.delete("/items/:id", removeCartItem);
export default router;
