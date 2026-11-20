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
    const products = await ProductModel.find().populate("categoryId", "name").populate("sub_categoryId", "name").sort({ updatedAt: -1 }).limit(100).lean();
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
    const transitions = { processing: ["shipped"], shipped: ["delivered"] };
    if (!transitions[order.delivery_status]?.includes(status)) return res.status(409).json({ success: false, message: `Cannot move an order from ${order.delivery_status} to ${status}` });
    order.delivery_status = status;
    await order.save();
    return res.json({ success: true, message: "Order status updated", data: order });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to update order status" });
  }
}

export async function listAdminCustomers(req, res) {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const search = String(req.query.search || "").trim().slice(0, 100);
    const filter = { role: "user" };
    if (search) {
      const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { name: { $regex: escaped, $options: "i" } },
        { email: { $regex: escaped, $options: "i" } }
      ];
      if (/^\d+$/.test(search)) filter.$or.push({ mobile: Number(search) });
    }
    const [customers, total] = await Promise.all([
      UserModel.find(filter)
        .select("name email mobile avatar status verify_email last_login_date createdAt")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      UserModel.countDocuments(filter)
    ]);
    const customerIds = customers.map((customer) => customer._id);
    const orderCounts = customerIds.length
      ? await OrderModel.aggregate([
          { $match: { userId: { $in: customerIds } } },
          { $group: { _id: "$userId", orders: { $sum: 1 }, spend: { $sum: { $cond: [{ $in: ["$payment_status", ["paid", "completed"]] }, "$totalAmt", 0] } } } }
        ])
      : [];
    const stats = new Map(orderCounts.map((entry) => [String(entry._id), entry]));
    const data = customers.map((customer) => ({
      ...customer,
      orderCount: stats.get(String(customer._id))?.orders || 0,
      paidSpend: stats.get(String(customer._id))?.spend || 0
    }));
    return res.json({ success: true, data, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load customers" });
  }
}

export async function getAdminSalesReport(req, res) {
  try {
    const periods = { "7d": 7, "30d": 30, "90d": 90 };
    const period = periods[String(req.query.period || "7d")] ? String(req.query.period || "7d") : "7d";
    const days = periods[period];
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    start.setUTCDate(start.getUTCDate() - (days - 1));
    const [daily, statuses, totals] = await Promise.all([
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: start }, payment_status: { $in: ["paid", "completed"] } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, revenue: { $sum: "$totalAmt" }, orders: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: { $ifNull: ["$delivery_status", "processing"] }, count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      OrderModel.aggregate([
        { $match: { createdAt: { $gte: start } } },
        { $group: { _id: null, orderCount: { $sum: 1 }, paidRevenue: { $sum: { $cond: [{ $in: ["$payment_status", ["paid", "completed"]] }, "$totalAmt", 0] } }, paidOrders: { $sum: { $cond: [{ $in: ["$payment_status", ["paid", "completed"]] }, 1, 0] } } } }
      ])
    ]);
    const byDate = new Map(daily.map((entry) => [entry._id, entry]));
    const series = Array.from({ length: days }, (_, index) => {
      const date = new Date(start);
      date.setUTCDate(start.getUTCDate() + index);
      const key = date.toISOString().slice(0, 10);
      return { date: key, revenue: byDate.get(key)?.revenue || 0, paidOrders: byDate.get(key)?.orders || 0 };
    });
    return res.json({
      success: true,
      data: {
        period,
        startDate: start,
        endDate: new Date(),
        totals: totals[0] || { orderCount: 0, paidRevenue: 0, paidOrders: 0 },
        daily: series,
        statuses: statuses.map((item) => ({ status: item._id, count: item.count }))
      }
    });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load sales report" });
  }
}


export async function assignFulfilmentRole(req, res) {
  try {
    const { userId, role } = req.body || {};
    if (!mongoose.isValidObjectId(userId) || !["user", "picker", "rider"].includes(role)) {
      return res.status(400).json({ success: false, message: "Choose a valid customer and staff role" });
    }
    const user = await UserModel.findOneAndUpdate(
      { _id: userId, status: "active", role: { $in: ["user", "picker", "rider"] } },
      { $set: { role } },
      { new: true, runValidators: true }
    ).select("name email mobile role status");
    if (!user) return res.status(404).json({ success: false, message: "Active customer account not found" });
    return res.json({ success: true, message: `Account role updated to ${role}`, data: user });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to update staff role" });
  }
}

export async function assignOrderPicker(req, res) {
  try {
    const { pickerId } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(pickerId)) {
      return res.status(400).json({ success: false, message: "Invalid order or picker id" });
    }
    const picker = await UserModel.findOne({ _id: pickerId, role: "picker", status: "active" }).select("_id");
    if (!picker) return res.status(404).json({ success: false, message: "Active picker account not found" });
    const order = await OrderModel.findOneAndUpdate(
      { _id: req.params.id, delivery_status: "processing" },
      { $set: { pickerId: picker._id, delivery_status: "picking" } },
      { new: true }
    );
    if (!order) return res.status(409).json({ success: false, message: "Only processing orders can be assigned to a picker" });
    return res.json({ success: true, message: "Picker assigned; order is ready for picking", data: order });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to assign picker" });
  }
}

export async function assignOrderRider(req, res) {
  try {
    const { riderId } = req.body || {};
    if (!mongoose.isValidObjectId(req.params.id) || !mongoose.isValidObjectId(riderId)) {
      return res.status(400).json({ success: false, message: "Invalid order or rider id" });
    }
    const rider = await UserModel.findOne({ _id: riderId, role: "rider", status: "active" }).select("_id");
    if (!rider) return res.status(404).json({ success: false, message: "Active rider account not found" });
    const order = await OrderModel.findOneAndUpdate(
      { _id: req.params.id, delivery_status: "packed" },
      { $set: { riderId: rider._id, delivery_status: "rider_assigned" } },
      { new: true }
    );
    if (!order) return res.status(409).json({ success: false, message: "Only packed orders can be assigned to a rider" });
    return res.json({ success: true, message: "Rider assigned; delivery is ready", data: order });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to assign rider" });
  }
}


export async function listAdminStaff(req, res) {
  try {
    const staff = await UserModel.find({ role: { $in: ["picker", "rider"] }, status: "active" })
      .select("name email mobile role status").sort({ role: 1, name: 1 }).lean();
    return res.json({ success: true, data: staff });
  } catch {
    return res.status(500).json({ success: false, message: "Unable to load fulfilment staff" });
  }
}
