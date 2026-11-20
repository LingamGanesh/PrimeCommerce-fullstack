import mongoose from "mongoose";
import CartProductModel from "../models/cartProduct.model.js";
import ProductModel from "../models/product.model.js";

const publicCartItem = (row) => {
  const product = row.productId;
  if (!product) return null;
  const discount = Math.max(0, Math.min(100, Number(product.discount) || 0));
  const price = Math.max(0, Number(product.price) || 0);
  const unitPrice = Math.round(price * 100) / 100;
  return {
    cartItemId: row._id.toString(),
    product: {
      id: product._id.toString(), name: product.name, image: product.image || [],
      unit: product.unit, price: unitPrice, mrp: price, discountPercent: discount,
      stock: Number(product.stock) || 0, publish: product.publish
    },
    quantity: row.quantity,
    lineTotal: Math.round(unitPrice * row.quantity * 100) / 100
  };
};

export async function getCart(req, res) {
  try {
    const rows = await CartProductModel.find({ userId: req.userId })
      .populate({ path: "productId", select: "name image unit price discount stock publish" })
      .sort({ createdAt: -1 });
    const items = rows.map(publicCartItem).filter(Boolean);
    const subtotal = Math.round(items.reduce((sum, item) => sum + item.lineTotal, 0) * 100) / 100;
    return res.json({ success: true, error: false, data: { items, itemCount: items.reduce((sum, item) => sum + item.quantity, 0), subtotal } });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load cart" });
  }
}

export async function addCartItem(req, res) {
  try {
    const { productId } = req.body;
    const quantity = Number(req.body.quantity ?? 1);
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return res.status(400).json({ success: false, error: true, message: "Provide a valid product and quantity (1–50)" });
    }

    const product = await ProductModel.findOne({ _id: productId, publish: true }).select("stock");
    if (!product) return res.status(404).json({ success: false, error: true, message: "Product is unavailable" });
    if (quantity > product.stock) {
      return res.status(409).json({ success: false, error: true, message: "Requested quantity is not available in stock" });
    }

    // Atomic increment + unique compound index prevent concurrent requests from
    // creating duplicate rows or overwriting each other's quantity updates.
    const filter = { userId: req.userId, productId, quantity: { $lte: 50 - quantity } };
    let row;
    try {
      row = await CartProductModel.findOneAndUpdate(
        filter,
        { $inc: { quantity }, $setOnInsert: { userId: req.userId, productId } },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } catch (error) {
      // Another request may win the first insert. Retry as an update against
      // the unique row; never fall back to creating a second cart item.
      if (error?.code !== 11000) throw error;
      row = await CartProductModel.findOneAndUpdate(
        filter,
        { $inc: { quantity } },
        { new: true, runValidators: true }
      );
    }

    if (!row) {
      return res.status(409).json({ success: false, error: true, message: "Cart quantity cannot exceed 50" });
    }
    await row.populate({ path: "productId", select: "name image unit price discount stock publish" });
    return res.status(200).json({ success: true, error: false, message: "Cart updated", data: publicCartItem(row) });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to update cart" });
  }
}

export async function updateCartItem(req, res) {
  try {
    const quantity = Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 0 || quantity > 50) {
      return res.status(400).json({ success: false, error: true, message: "Quantity must be between 0 and 50" });
    }
    const row = await CartProductModel.findOne({ _id: req.params.id, userId: req.userId });
    if (!row) return res.status(404).json({ success: false, error: true, message: "Cart item not found" });
    if (quantity === 0) {
      await row.deleteOne();
      return res.json({ success: true, error: false, message: "Item removed from cart" });
    }
    const product = await ProductModel.findOne({ _id: row.productId, publish: true }).select("stock");
    if (!product) return res.status(409).json({ success: false, error: true, message: "Product is unavailable" });
    if (quantity > product.stock) return res.status(409).json({ success: false, error: true, message: "Requested quantity is not available in stock" });
    row.quantity = quantity;
    await row.save();
    await row.populate({ path: "productId", select: "name image unit price discount stock publish" });
    return res.json({ success: true, error: false, message: "Cart quantity updated", data: publicCartItem(row) });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to update cart item" });
  }
}

export async function removeCartItem(req, res) {
  try {
    const result = await CartProductModel.deleteOne({ _id: req.params.id, userId: req.userId });
    if (!result.deletedCount) return res.status(404).json({ success: false, error: true, message: "Cart item not found" });
    return res.json({ success: true, error: false, message: "Item removed from cart" });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to remove cart item" });
  }
}
