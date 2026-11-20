import mongoose from "mongoose";
import UserModel from "../models/user.model.js";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import OrderModel from "../models/order.model.js";

export async function getAdminOverview(req, res) {
  try {
    const [customers, products, categories, orders, revenue, recentOrders, lowStock] = await Promise.all([
      UserModel.countDocuments({ role: "user" }),
      ProductModel.countDocuments({ publish: true }),
      CategoryModel.countDocuments(),
      OrderModel.countDocuments(),
      OrderModel.aggregate([{ $match: { delivery_status: { $ne: "cancelled" }, payment_status: { $in: ["completed", "paid"] } } }, { $group: { _id: null, total: { $sum: "$totalAmt" } } }]),
      OrderModel.find().sort({ createdAt: -1 }).limit(8).populate("userId", "name email").lean(),
      ProductModel.countDocuments({ publish: true, stock: { $lte: 5 } })
    ]);
    return res.json({ success: true, data: { customers, products, categories, orders, revenue: revenue[0]?.total || 0, lowStock, recentOrders } });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load admin overview" });
  }
}

export async function listAdminProducts(req, res) {
  try {
    const products = await ProductModel.find().populate("categoryId", "name").sort({ updatedAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: products });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load product inventory" });
  }
}

export async function listAdminOrders(req, res) {
  try {
    const orders = await OrderModel.find().populate("userId", "name email mobile").sort({ createdAt: -1 }).limit(100).lean();
    return res.json({ success: true, data: orders });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load orders" });
  }
}

export async function updateAdminOrderStatus(req, res) {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ success: false, message: "Invalid order id" });
    const allowed = ["processing", "shipped", "delivered"];
    const status = String(req.body.delivery_status || "");
    if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Unsupported order status" });
    const order = await OrderModel.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    if (order.delivery_status === "delivered" || order.delivery_status === "cancelled") return res.status(409).json({ success: false, message: "A completed or cancelled order cannot be changed" });
    order.delivery_status = status;
    await order.save();
    return res.json({ success: true, message: "Order status updated", data: order });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
}