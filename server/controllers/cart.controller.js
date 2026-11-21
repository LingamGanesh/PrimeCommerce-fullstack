import mongoose from "mongoose";
import CartProductModel from "../models/cartProduct.model.js";
import ProductModel from "../models/product.model.js";

function availablePackOptions(product) {
  const configured = Array.isArray(product.more_details?.packOptions) ? product.more_details.packOptions : [];
  if (configured.length) return configured.filter((option) => option?.label && Number.isFinite(Number(option.price))).map((option) => ({ label: option.label, price: Number(option.price) }));
  const unit = String(product.unit || "").trim();
  const match = unit.match(/^([\d.]+)\s*(kg|g|l|ml)$/i);
  if (!match) return [{ label: unit || "1 item", price: Number(product.price) || 0 }];
  const amount = Number(match[1]);
  const measure = match[2].toLowerCase();
  const baseAmount = measure === "kg" || measure === "l" ? amount * 1000 : amount;
  const weight = measure === "kg" || measure === "g";
  const amounts = weight ? [250, 500, 1000] : [1, 10, 100, 250, 500, 1000];
  const labels = weight ? ["250 g", "500 g", "1 kg"] : ["1 ml", "10 ml", "100 ml", "250 ml", "500 ml", "1 L"];
  const options = amounts.map((value, index) => ({ label: labels[index], price: Math.max(1, Math.round(((Number(product.price) || 0) * value / baseAmount) * 100) / 100) }));
  if (!options.some((option) => option.label.toLowerCase() === unit.toLowerCase())) options.push({ label: unit, price: Number(product.price) || 0 });
  return options;
}

const publicCartItem = (row) => {
  const product = row.productId;
  if (!product) return null;
  const discount = Math.max(0, Math.min(100, Number(product.discount) || 0));
  const price = Math.max(0, Number(product.price) || 0);
  const baseUnitPrice = Math.round(price * 100) / 100;
  const unitPrice = Number.isFinite(row.unitPrice) ? row.unitPrice : baseUnitPrice;
  return {
    cartItemId: row._id.toString(),
    product: {
      id: product._id.toString(), name: product.name, image: product.image || [],
      unit: row.variantLabel || product.unit, variantLabel: row.variantLabel || product.unit, price: unitPrice, mrp: price, discountPercent: discount,
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
    const requestedVariant = String(req.body.variantLabel || "").trim();
    const quantity = Number(req.body.quantity ?? 1);
    if (!mongoose.isValidObjectId(productId) || !Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      return res.status(400).json({ success: false, error: true, message: "Provide a valid product and quantity (1–50)" });
    }
    const product = await ProductModel.findOne({ _id: productId, publish: true }).select("stock price unit more_details");
    if (!product) return res.status(404).json({ success: false, error: true, message: "Product is unavailable" });
    const variants = availablePackOptions(product);
    const selected = variants.find((option) => option.label === requestedVariant) || (!requestedVariant ? variants.find((option) => option.label === product.unit) : null);
    if (requestedVariant && !selected) return res.status(400).json({ success: false, error: true, message: "Choose a valid pack size" });
    const chosen = selected || variants.find((option) => option.label === product.unit) || { label: product.unit, price: product.price };
    const variantLabel = chosen.label;
    const unitPrice = Number(chosen.price);
    const existing = await CartProductModel.findOne({ userId: req.userId, productId, variantLabel });
    const nextQuantity = (existing?.quantity || 0) + quantity;
    if (nextQuantity > product.stock) return res.status(409).json({ success: false, error: true, message: "Requested quantity is not available in stock" });
    const row = existing
      ? await CartProductModel.findByIdAndUpdate(existing._id, { quantity: nextQuantity }, { new: true })
      : await CartProductModel.create({ userId: req.userId, productId, quantity, variantLabel, unitPrice });
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
