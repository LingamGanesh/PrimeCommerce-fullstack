import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { archiveProduct, createProduct, getProduct, listCategories, listProducts, listSubCategories, updateProduct } from "../controllers/catalog.controller.js";

const catalogRouter = Router();

catalogRouter.get("/products", listProducts);
catalogRouter.get("/products/:id", getProduct);
catalogRouter.get("/categories", listCategories);
catalogRouter.get("/subcategories", listSubCategories);
catalogRouter.post("/admin/products", auth, admin, createProduct);
catalogRouter.patch("/admin/products/:id", auth, admin, updateProduct);
catalogRouter.delete("/admin/products/:id", auth, admin, archiveProduct);

export default catalogRouter;
