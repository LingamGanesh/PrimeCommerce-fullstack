import { Router } from "express";
import auth from "../middleware/auth.js";
import admin from "../middleware/admin.js";
import { archiveProduct, createCategory, createProduct, createSubCategory, getProduct, listCategories, listProducts, listSubCategories, updateCategory, updateProduct } from "../controllers/catalog.controller.js";

const catalogRouter = Router();

catalogRouter.get("/products", listProducts);
catalogRouter.get("/products/:id", getProduct);
catalogRouter.get("/categories", listCategories);
catalogRouter.get("/subcategories", listSubCategories);
catalogRouter.post("/admin/categories", auth, admin, createCategory);
catalogRouter.patch("/admin/categories/:id", auth, admin, updateCategory);
catalogRouter.post("/admin/subcategories", auth, admin, createSubCategory);
catalogRouter.post("/admin/products", auth, admin, createProduct);
catalogRouter.patch("/admin/products/:id", auth, admin, updateProduct);
catalogRouter.delete("/admin/products/:id", auth, admin, archiveProduct);

export default catalogRouter;
