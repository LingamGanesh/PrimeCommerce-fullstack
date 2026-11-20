import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import SubCategoryModel from "../models/subCategory.model.js";
import { buildPublicProductFilter, buildPublicSubCategoryFilter } from "../utils/catalogVisibility.js";

async function getActiveCatalogRefs() {
  const activeCategories = await CategoryModel.find({ isActive: { $ne: false } }).select("_id").lean();
  const activeCategoryIds = activeCategories.map(category => category._id);
  const activeSubCategories = activeCategoryIds.length
    ? await SubCategoryModel.find({ isActive: { $ne: false }, categoryId: { $in: activeCategoryIds } }).select("_id").lean()
    : [];
  return { activeCategoryIds, activeSubCategoryIds: activeSubCategories.map(category => category._id) };
}

const normalizeImageUrl = (value, field = "image") => {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value !== "string" || value.length > 2048) throw new Error(`${field} must be a valid HTTPS image URL`);
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error(`${field} must be a valid HTTPS image URL`); }
  if (parsed.protocol !== "https:" || !parsed.hostname) throw new Error(`${field} must be a valid HTTPS image URL`);
  return value;
};

const normalizeProductImages = (value) => {
  if (!Array.isArray(value) || value.length > 8) throw new Error("Product images must be an array containing at most 8 image URLs");
  return value.map((url, index) => normalizeImageUrl(url, `Image ${index + 1}`));
};

const productPayload = (product) => {
  const item = product.toObject ? product.toObject() : product;
  const discount = Math.min(100, Math.max(0, Number(item.discount) || 0));
  const price = Number(item.price) || 0;
  return {
    ...item,
    id: String(item._id),
    mrp: discount > 0 && discount < 100 ? Math.round((price / (1 - discount / 100)) * 100) / 100 : price,
    discountPercent: discount,
    images: item.image || []
  };
};

export async function listProducts(req, res) {
  try {
    const { category, search, featured, page = 1, limit = 24 } = req.query;
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(60, Math.max(1, Number.parseInt(limit, 10) || 24));
    if (category && !mongoose.isValidObjectId(category)) return res.status(400).json({ success: false, error: true, message: "Invalid category id" });
    const activeRefs = await getActiveCatalogRefs();
    const filter = buildPublicProductFilter({ ...activeRefs, categoryId: category, search, featured });
    const [products, total] = await Promise.all([
      ProductModel.find(filter).populate("categoryId", "name image").populate("sub_categoryId", "name image")
        .sort({ createdAt: -1 }).skip((currentPage - 1) * pageSize).limit(pageSize).lean(),
      ProductModel.countDocuments(filter)
    ]);
    return res.json({
      success: true, error: false, data: products.map(productPayload),
      pagination: { page: currentPage, limit: pageSize, total, pages: Math.ceil(total / pageSize) }
    });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load products" });
  }
}

export async function getProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid product id" });
    const activeRefs = await getActiveCatalogRefs();
    const product = await ProductModel.findOne({ _id: req.params.id, publish: true, isActive: { $ne: false }, categoryId: { $in: activeRefs.activeCategoryIds }, sub_categoryId: { $in: activeRefs.activeSubCategoryIds } })
      .populate("categoryId", "name image").populate("sub_categoryId", "name image");
    if (!product) return res.status(404).json({ success: false, error: true, message: "Product not found" });
    return res.json({ success: true, error: false, data: productPayload(product) });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load product" });
  }
}

export async function listCategories(req, res) {
  try {
    const categories = await CategoryModel.find({ isActive: { $ne: false } }).sort({ sortOrder: 1, name: 1 }).lean();
    return res.json({ success: true, error: false, data: categories });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load categories" });
  }
}

export async function listSubCategories(req, res) {
  try {
    if (req.query.categoryId && !mongoose.isValidObjectId(req.query.categoryId)) {
      return res.status(400).json({ success: false, error: true, message: "Invalid category id" });
    }
    const activeRefs = await getActiveCatalogRefs();
    const filter = buildPublicSubCategoryFilter({ activeCategoryIds: activeRefs.activeCategoryIds, categoryId: req.query.categoryId });
    const categories = await SubCategoryModel.find(filter).sort({ sortOrder: 1, name: 1 }).lean();
    return res.json({ success: true, error: false, data: categories });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load subcategories" });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, categoryId, sub_categoryId, unit, price, discount = 0, stock = 0, description = "", image = [] } = req.body || {};
    if (!name?.trim() || !unit?.trim() || !Array.isArray(categoryId) || !categoryId.length || !Array.isArray(sub_categoryId) || !sub_categoryId.length || price === undefined) {
      return res.status(400).json({ success: false, error: true, message: "Name, category, subcategory, unit and price are required" });
    }
    const values = [Number(price), Number(discount), Number(stock)];
    if (
      !values.every(Number.isFinite) ||
      values[0] < 0 || values[0] > 10000000 ||
      values[1] < 0 || values[1] >= 100 ||
      !Number.isSafeInteger(values[2]) || values[2] < 0 || values[2] > 10000000
    ) {
      return res.status(400).json({ success: false, error: true, message: "Price must be between 0 and 1 crore, discount must be 0–99.99%, and stock must be a whole number between 0 and 1 crore" });
    }
    const [validCategories, validSubCategories] = await Promise.all([
      CategoryModel.countDocuments({ _id: { $in: categoryId }, isActive: { $ne: false } }),
      SubCategoryModel.find({ _id: { $in: sub_categoryId }, isActive: { $ne: false } }).select("categoryId").lean()
    ]);
    if (validCategories !== new Set(categoryId.map(String)).size || validSubCategories.length !== new Set(sub_categoryId.map(String)).size) {
      return res.status(400).json({ success: false, error: true, message: "Select valid categories and subcategories" });
    }
    const selectedCategoryIds = new Set(categoryId.map(String));
    if (validSubCategories.some(subcategory => !subcategory.categoryId.some(id => selectedCategoryIds.has(String(id))))) {
      return res.status(400).json({ success: false, error: true, message: "Each subcategory must belong to a selected category" });
    }
    if (typeof name !== "string" || typeof unit !== "string" || typeof description !== "string" || description.length > 5000) {
      return res.status(400).json({ success: false, error: true, message: "Product name, unit and description must be valid text" });
    }
    const images = normalizeProductImages(image);
    const product = await ProductModel.create({
      name: name.trim(), categoryId, sub_categoryId, unit: unit.trim(), price: values[0],
      discount: values[1], stock: values[2], description: description.trim(), image: images
    });
    return res.status(201).json({ success: true, error: false, message: "Product created", data: productPayload(product) });
  } catch (error) {
    return res.status(400).json({ success: false, error: true, message: error.message || "Unable to create product" });
  }
}

export async function updateProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid product id" });
    const allowed = ["name", "categoryId", "sub_categoryId", "unit", "price", "discount", "stock", "description", "image", "publish", "isActive"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    for (const key of ["price", "discount", "stock"]) if (updates[key] !== undefined) updates[key] = Number(updates[key]);
    for (const key of ["name", "unit", "description"]) {
      if (updates[key] !== undefined && typeof updates[key] !== "string") return res.status(400).json({ success: false, error: true, message: `${key} must be text` });
      if (updates[key] !== undefined) updates[key] = updates[key].trim();
    }
    if (updates.name !== undefined && (!updates.name || updates.name.length > 160)) return res.status(400).json({ success: false, error: true, message: "Product name must be between 1 and 160 characters" });
    if (updates.unit !== undefined && (!updates.unit || updates.unit.length > 60)) return res.status(400).json({ success: false, error: true, message: "Product unit must be between 1 and 60 characters" });
    if (updates.description !== undefined && updates.description.length > 5000) return res.status(400).json({ success: false, error: true, message: "Product description is too long" });
    if (updates.image !== undefined) updates.image = normalizeProductImages(updates.image);
    if (updates.publish !== undefined && typeof updates.publish !== "boolean") return res.status(400).json({ success: false, error: true, message: "Publish must be true or false" });
    if (updates.isActive !== undefined && typeof updates.isActive !== "boolean") return res.status(400).json({ success: false, error: true, message: "isActive must be true or false" });
    if (updates.publish !== undefined) updates.isActive = updates.publish;
    if (updates.isActive !== undefined) updates.publish = updates.isActive;
    for (const key of ["categoryId", "sub_categoryId"]) {
      if (updates[key] !== undefined && (!Array.isArray(updates[key]) || updates[key].length === 0 || updates[key].some(id => !mongoose.isValidObjectId(id)))) {
        return res.status(400).json({ success: false, error: true, message: `Invalid ${key} selection` });
      }
    }
    const currentProduct = await ProductModel.findById(req.params.id).select("categoryId sub_categoryId").lean();
    if (!currentProduct) return res.status(404).json({ success: false, error: true, message: "Product not found" });

    const categoryIds = updates.categoryId || currentProduct.categoryId;
    const subCategoryIds = updates.sub_categoryId || currentProduct.sub_categoryId;
    if (updates.categoryId) {
      const count = await CategoryModel.countDocuments({ _id: { $in: categoryIds }, isActive: { $ne: false } });
      if (count !== new Set(categoryIds.map(String)).size) return res.status(400).json({ success: false, error: true, message: "Select valid categories" });
    }
    if (updates.categoryId || updates.sub_categoryId) {
      const selectedSubcategories = await SubCategoryModel.find({ _id: { $in: subCategoryIds }, isActive: { $ne: false } }).select("categoryId").lean();
      if (selectedSubcategories.length !== new Set(subCategoryIds.map(String)).size) return res.status(400).json({ success: false, error: true, message: "Select valid subcategories" });
      const selectedCategoryIds = new Set(categoryIds.map(String));
      if (selectedSubcategories.some(subcategory => !subcategory.categoryId.some(id => selectedCategoryIds.has(String(id))))) {
        return res.status(400).json({ success: false, error: true, message: "Each subcategory must belong to a selected category" });
      }
    }
    if (
      (updates.price !== undefined && (!Number.isFinite(updates.price) || updates.price < 0 || updates.price > 10000000)) ||
      (updates.discount !== undefined && (!Number.isFinite(updates.discount) || updates.discount < 0 || updates.discount >= 100)) ||
      (updates.stock !== undefined && (!Number.isSafeInteger(updates.stock) || updates.stock < 0 || updates.stock > 10000000))
    ) {
      return res.status(400).json({ success: false, error: true, message: "Price, discount or stock value is invalid; stock must be a whole number" });
    }
    const product = await ProductModel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, error: true, message: "Product not found" });
    return res.json({ success: true, error: false, message: "Product updated", data: productPayload(product) });
  } catch {
    return res.status(400).json({ success: false, error: true, message: "Unable to update product" });
  }
}

export async function archiveProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid product id" });
    const product = await ProductModel.findByIdAndUpdate(req.params.id, { publish: false, isActive: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, error: true, message: "Product not found" });
    return res.json({ success: true, error: false, message: "Product unpublished" });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to unpublish product" });
  }
}


export async function createCategory(req, res) {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    if (!name || name.length > 100) return res.status(400).json({ success: false, error: true, message: "Category name must be between 1 and 100 characters" });
    const image = normalizeImageUrl(req.body?.image, "Category image");
    const category = await CategoryModel.create({ name, image });
    return res.status(201).json({ success: true, error: false, message: "Category created", data: category });
  } catch (error) {
    return res.status(400).json({ success: false, error: true, message: error.message || "Unable to create category" });
  }
}

export async function updateCategory(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid category id" });
    const updates = {};
    if (req.body?.name !== undefined) {
      if (typeof req.body.name !== "string" || !req.body.name.trim() || req.body.name.trim().length > 100) return res.status(400).json({ success: false, error: true, message: "Category name must be between 1 and 100 characters" });
      updates.name = req.body.name.trim();
    }
    if (req.body?.image !== undefined) updates.image = normalizeImageUrl(req.body.image, "Category image");
    if (req.body?.isActive !== undefined) {
      if (typeof req.body.isActive !== "boolean") return res.status(400).json({ success: false, error: true, message: "isActive must be true or false" });
      updates.isActive = req.body.isActive;
    }
    if (!Object.keys(updates).length) return res.status(400).json({ success: false, error: true, message: "No category changes were provided" });
    const category = await CategoryModel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, error: true, message: "Category not found" });
    return res.json({ success: true, error: false, message: "Category updated", data: category });
  } catch {
    return res.status(400).json({ success: false, error: true, message: "Unable to update category" });
  }
}

export async function createSubCategory(req, res) {
  try {
    const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
    const categoryId = req.body?.categoryId;
    if (!name || name.length > 100 || !Array.isArray(categoryId) || !categoryId.length || categoryId.some(id => !mongoose.isValidObjectId(id))) {
      return res.status(400).json({ success: false, error: true, message: "Subcategory name and at least one category are required" });
    }
    const validCount = await CategoryModel.countDocuments({ _id: { $in: categoryId } });
    if (validCount !== new Set(categoryId.map(String)).size) {
      return res.status(400).json({ success: false, error: true, message: "Select valid categories" });
    }
    const image = normalizeImageUrl(req.body?.image, "Subcategory image");
    const subcategory = await SubCategoryModel.create({ name, categoryId, image });
    return res.status(201).json({ success: true, error: false, message: "Subcategory created", data: subcategory });
  } catch (error) {
    return res.status(400).json({ success: false, error: true, message: error.message || "Unable to create subcategory" });
  }
}
