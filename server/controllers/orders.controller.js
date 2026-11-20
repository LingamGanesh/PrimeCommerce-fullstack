import OrderModel from "../models/order.model.js";

export async function listMyOrders(req, res) {
  try {
    const orders = await OrderModel.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(50).lean();
    const data = orders.map((order) => {
      let items = [];
      try { items = JSON.parse(order.product_details || "[]"); } catch { items = []; }
      return {
        id: order._id.toString(),
        orderId: order.orderId,
        items,
        address: order.delivery_address,
        subtotal: order.subTotalAmt,
        total: order.totalAmt,
        paymentStatus: order.payment_status,
        deliveryStatus: order.delivery_status,
        createdAt: order.createdAt
      };
    });
    return res.json({ success: true, error: false, data });
  } catch {
    return res.status(500).json({ success: false, error: true, message: "Unable to load your orders" });
  }
}
