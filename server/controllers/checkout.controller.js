import mongoose from "mongoose";
import CartProductModel from "../models/cartProduct.model.js";
import ProductModel from "../models/product.model.js";
import AddressModel from "../models/address.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";

const discountedPrice = (product) => Math.round(Number(product.price) * 100) / 100;

export async function createCashOnDeliveryOrder(req, res) {
  const reserved = [];
  let createdOrder = null;
  try {
    const { addressId } = req.body;
    if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ success: false, error: true, message: "Select a valid delivery address" });
    const address = await AddressModel.findOne({ _id: addressId, userId: req.userId }).lean();
    if (!address) return res.status(404).json({ success: false, error: true, message: "Delivery address not found" });

    const cartRows = await CartProductModel.find({ userId: req.userId }).populate({ path: "productId", select: "name image unit price discount stock publish" });
    if (!cartRows.length) return res.status(400).json({ success: false, error: true, message: "Your cart is empty" });

    const orderItems = [];
    let subtotal = 0;
    for (const row of cartRows) {
      const product = row.productId;
      if (!product || !product.publish) throw new Error("A product in your cart is no longer available");
      const unitPrice = Number.isFinite(row.unitPrice) ? row.unitPrice : discountedPrice(product);
      const lineTotal = Math.round(unitPrice * row.quantity * 100) / 100;
      subtotal = Math.round((subtotal + lineTotal) * 100) / 100;
      orderItems.push({
        productId: product._id, name: product.name, image: product.image || [],
        unit: row.variantLabel || product.unit, unitPrice, quantity: row.quantity, lineTotal
      });
    }

    // Atomic per-product stock reservations prevent two checkouts overselling the same units.
    for (const item of orderItems) {
      const updated = await ProductModel.findOneAndUpdate(
        { _id: item.productId, publish: true, stock: { $gte: item.quantity } },
        { $inc: { stock: -item.quantity } },
        { new: true }
      );
      if (!updated) throw new Error("Insufficient stock for " + item.name + ". Please update your cart.");
      reserved.push(item);
    }

    const orderId = "PC" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
    const order = await OrderModel.create({
      userId: req.userId,
      orderId,
      product_details: JSON.stringify(orderItems),
      payment_id: "",
      payment_status: "pending",
      paymentMethod: "COD",
      delivery_address: {
        address_line: address.address_line, city: address.city, state: address.state,
        pincode: address.pincode, country: address.country, mobile: address.mobile
      },
      delivery_status: "processing",
      subTotalAmt: subtotal,
      totalAmt: subtotal
    });

    createdOrder = order;
    await UserModel.findByIdAndUpdate(req.userId, { $addToSet: { orderHistory: order._id } });
    await CartProductModel.deleteMany({ userId: req.userId });
    return res.status(201).json({
      success: true, error: false, message: "Cash on Delivery order placed",
      data: { orderId: order.orderId, orderDbId: order._id, subtotal, total: subtotal, paymentMethod: "COD", paymentStatus: "pending", deliveryStatus: order.delivery_status }
    });
  } catch (error) {
    if (createdOrder?._id) {
      await OrderModel.deleteOne({ _id: createdOrder._id, userId: req.userId });
      await UserModel.findByIdAndUpdate(req.userId, { $pull: { orderHistory: createdOrder._id } });
    }
    if (reserved.length) {
      await Promise.all(reserved.map((item) => ProductModel.updateOne({ _id: item.productId }, { $inc: { stock: item.quantity } })));
    }
    return res.status(400).json({ success: false, error: true, message: error.message || "Unable to place order" });
  }
}
