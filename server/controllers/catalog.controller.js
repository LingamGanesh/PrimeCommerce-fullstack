import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import SubCategoryModel from "../models/subCategory.model.js";

const productPayload = (product) => {
  const item = product.toObject ? product.toObject() : product;
  const discount = Math.min(100, Math.max(0, Number(item.discount) || 0));
  const price = Number(item.price) || 0;
  return {
    ...item,
    id: String(item._id),
    mrp: discount > 0 && discount < 100 ? Math.round(price / (1 - discount / 100)) : price,
    discountPercent: discount,
    images: item.image || []
  };
};

export async function listProducts(req, res) {
  try {
    const { category, search, featured, page = 1, limit = 24 } = req.query;
    const currentPage = Math.max(1, Number.parseInt(page, 10) || 1);
    const pageSize = Math.min(60, Math.max(1, Number.parseInt(limit, 10) || 24));
    const filter = { publish: true };
    if (category && mongoose.isValidObjectId(category)) filter.categoryId = category;
    if (featured === "true") filter.discount = { $gt: 0 };
    if (search?.trim()) filter.name = { $regex: search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

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
    const product = await ProductModel.findOne({ _id: req.params.id, publish: true })
      .populate("categoryId", "name image").populate("sub_categoryId", "name image");
    if (!product) return res.status(404).json({ success: false, error: true, message: "Product not found" });
    return res.json({ success: true, error: false, data: productPayload(product) });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load product" });
  }
}

export async function listCategories(req, res) {
  try {
    const categories = await CategoryModel.find().sort({ name: 1 }).lean();
    return res.json({ success: true, error: false, data: categories });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load categories" });
  }
}

export async function listSubCategories(req, res) {
  try {
    const filter = mongoose.isValidObjectId(req.query.categoryId) ? { categoryId: req.query.categoryId } : {};
    const categories = await SubCategoryModel.find(filter).sort({ name: 1 }).lean();
    return res.json({ success: true, error: false, data: categories });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load subcategories" });
  }
}

export async function createProduct(req, res) {
  try {
    const { name, categoryId, sub_categoryId, unit, price, discount = 0, stock = 0, description = "", image = [] } = req.body;
    if (!name?.trim() || !unit?.trim() || !Array.isArray(categoryId) || !categoryId.length || !Array.isArray(sub_categoryId) || !sub_categoryId.length || price === undefined) {
      return res.status(400).json({ success: false, error: true, message: "Name, category, subcategory, unit and price are required" });
    }
    const values = [Number(price), Number(discount), Number(stock)];
    if (!values.every(Number.isFinite) || values[0] < 0 || values[1] < 0 || values[1] > 100 || values[2] < 0) {
      return res.status(400).json({ success: false, error: true, message: "Price, discount or stock value is invalid" });
    }
    const [validCategories, validSubCategories] = await Promise.all([
      CategoryModel.countDocuments({ _id: { $in: categoryId } }),
      SubCategoryModel.find({ _id: { $in: sub_categoryId } }).select("categoryId").lean()
    ]);
    if (validCategories !== new Set(categoryId.map(String)).size || validSubCategories.length !== new Set(sub_categoryId.map(String)).size) {
      return res.status(400).json({ success: false, error: true, message: "Select valid categories and subcategories" });
    }
    const selectedCategoryIds = new Set(categoryId.map(String));
    if (validSubCategories.some(subcategory => !subcategory.categoryId.some(id => selectedCategoryIds.has(String(id))))) {
      return res.status(400).json({ success: false, error: true, message: "Each subcategory must belong to a selected category" });
    }
    const product = await ProductModel.create({
      name: name.trim(), categoryId, sub_categoryId, unit: unit.trim(), price: values[0],
      discount: values[1], stock: values[2], description, image: Array.isArray(image) ? image : []
    });
    return res.status(201).json({ success: true, error: false, message: "Product created", data: productPayload(product) });
  } catch (error) {
    return res.status(400).json({ success: false, error: true, message: error.message || "Unable to create product" });
  }
}

export async function updateProduct(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid product id" });
    const allowed = ["name", "categoryId", "sub_categoryId", "unit", "price", "discount", "stock", "description", "image", "publish"];
    const updates = {};
    for (const key of allowed) if (req.body[key] !== undefined) updates[key] = req.body[key];
    for (const key of ["price", "discount", "stock"]) if (updates[key] !== undefined) updates[key] = Number(updates[key]);
    for (const key of ["categoryId", "sub_categoryId"]) {
      if (updates[key] !== undefined && (!Array.isArray(updates[key]) || updates[key].length === 0 || updates[key].some(id => !mongoose.isValidObjectId(id)))) {
        return res.status(400).json({ success: false, error: true, message: `Invalid ${key} selection` });
      }
    }
    if (updates.categoryId) {
      const count = await CategoryModel.countDocuments({ _id: { $in: updates.categoryId } });
      if (count !== new Set(updates.categoryId.map(String)).size) return res.status(400).json({ success: false, error: true, message: "Select valid categories" });
    }
    if (updates.sub_categoryId) {
      const selectedSubcategories = await SubCategoryModel.find({ _id: { $in: updates.sub_categoryId } }).select("categoryId").lean();
      if (selectedSubcategories.length !== new Set(updates.sub_categoryId.map(String)).size) return res.status(400).json({ success: false, error: true, message: "Select valid subcategories" });
      const categoryIds = updates.categoryId || (await ProductModel.findById(req.params.id).select("categoryId").lean())?.categoryId || [];
      const selectedCategoryIds = new Set(categoryIds.map(String));
      if (selectedSubcategories.some(subcategory => !subcategory.categoryId.some(id => selectedCategoryIds.has(String(id))))) return res.status(400).json({ success: false, error: true, message: "Each subcategory must belong to a selected category" });
    }
    if (["price", "discount", "stock"].some(key => updates[key] !== undefined && (!Number.isFinite(updates[key]) || updates[key] < 0)) || (updates.discount !== undefined && updates.discount > 100)) {
      return res.status(400).json({ success: false, error: true, message: "Price, discount or stock value is invalid" });
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
    const product = await ProductModel.findByIdAndUpdate(req.params.id, { publish: false }, { new: true });
    if (!product) return res.status(404).json({ success: false, error: true, message: "Product not found" });
    return res.json({ success: true, error: false, message: "Product unpublished" });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to unpublish product" });
  }
}


export async function createCategory(req, res) {
  try {
    const name = req.body.name?.trim();
    if (!name) return res.status(400).json({ success: false, error: true, message: "Category name is required" });
    const category = await CategoryModel.create({ name, image: req.body.image || "" });
    return res.status(201).json({ success: true, error: false, message: "Category created", data: category });
  } catch (error) {
    return res.status(400).json({ success: false, error: true, message: error.message || "Unable to create category" });
  }
}

export async function updateCategory(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, error: true, message: "Invalid category id" });
    const updates = {};
    if (req.body.name !== undefined) updates.name = String(req.body.name).trim();
    if (req.body.image !== undefined) updates.image = String(req.body.image);
    if (updates.name === "") return res.status(400).json({ success: false, error: true, message: "Category name cannot be empty" });
    const category = await CategoryModel.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!category) return res.status(404).json({ success: false, error: true, message: "Category not found" });
    return res.json({ success: true, error: false, message: "Category updated", data: category });
  } catch {
    return res.status(400).json({ success: false, error: true, message: "Unable to update category" });
  }
}

export async function createSubCategory(req, res) {
  try {
    const name = req.body.name?.trim();
    const categoryId = req.body.categoryId;
    if (!name || !Array.isArray(categoryId) || !categoryId.length) {
      return res.status(400).json({ success: false, error: true, message: "Subcategory name and at least one category are required" });
    }
    const validCount = await CategoryModel.countDocuments({ _id: { $in: categoryId } });
    if (validCount !== new Set(categoryId.map(String)).size) {
      return res.status(400).json({ success: false, error: true, message: "Select valid categories" });
    }
    const subcategory = await SubCategoryModel.create({ name, categoryId, image: req.body.image || "" });
    return res.status(201).json({ success: true, error: false, message: "Subcategory created", data: subcategory });
  } catch (error) {
    return res.status(400).json({ success: false, error: true, message: error.message || "Unable to create subcategory" });
  }
}
