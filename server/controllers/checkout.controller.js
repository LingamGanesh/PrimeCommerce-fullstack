import mongoose from "mongoose";
import CartProductModel from "../models/cartProduct.model.js";
import ProductModel from "../models/product.model.js";
import AddressModel from "../models/address.model.js";
import OrderModel from "../models/order.model.js";
import UserModel from "../models/user.model.js";

const discountedPrice = (product) => Math.round(Number(product.price) * 100) / 100;

export async function createCashOnDeliveryOrder(req, res) {
  const session = await mongoose.startSession();
  try {
    const { addressId } = req.body;
    if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ success: false, error: true, message: "Select a valid delivery address" });
    const address = await AddressModel.findOne({ _id: addressId, userId: req.userId }).lean();
    if (!address) return res.status(404).json({ success: false, error: true, message: "Delivery address not found" });

    let responseData;
    await session.withTransaction(async () => {
      const cartRows = await CartProductModel.find({ userId: req.userId }).session(session).populate({ path: "productId", select: "name image unit price discount stock publish" });
      if (!cartRows.length) throw new Error("Your cart is empty");

      const orderItems = [];
      let subtotal = 0;
      for (const row of cartRows) {
        const product = row.productId;
        if (!product || !product.publish) throw new Error("A product in your cart is no longer available");
        const unitPrice = discountedPrice(product);
        const lineTotal = Math.round(unitPrice * row.quantity * 100) / 100;
        subtotal = Math.round((subtotal + lineTotal) * 100) / 100;
        orderItems.push({
          productId: product._id, name: product.name, image: product.image || [],
          unit: product.unit, unitPrice, quantity: row.quantity, lineTotal
        });
      }

      for (const item of orderItems) {
        const updated = await ProductModel.findOneAndUpdate(
          { _id: item.productId, publish: true, stock: { $gte: item.quantity } },
          { $inc: { stock: -item.quantity } },
          { new: true, session }
        );
        if (!updated) throw new Error("Insufficient stock for " + item.name + ". Please update your cart.");
      }

      const orderId = "PC" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase();
      const [order] = await OrderModel.create([{
        userId: req.userId,
        orderId,
        product_details: JSON.stringify(orderItems),
        payment_id: "",
        payment_status: "pending",
        delivery_address: {
          address_line: address.address_line, city: address.city, state: address.state,
          pincode: address.pincode, country: address.country, mobile: address.mobile
        },
        delivery_status: "processing",
        subTotalAmt: subtotal,
        totalAmt: subtotal
      }], { session });

      await UserModel.updateOne({ _id: req.userId }, { $addToSet: { orderHistory: order._id } }, { session });

      // Conditional deletes make the cart the single-use checkout claim. If another
      // request already consumed or changed any row, abort the whole transaction.
      const deleted = await CartProductModel.deleteMany({ _id: { $in: cartRows.map(row => row._id) }, userId: req.userId }, { session });
      if (deleted.deletedCount !== cartRows.length) throw new Error("Your cart changed during checkout. Please review it and try again.");

      responseData = {
        orderId: order.orderId, orderDbId: order._id, subtotal, total: subtotal,
        paymentMethod: "COD", paymentStatus: "pending", deliveryStatus: order.delivery_status
      };
    });

    if (!responseData) throw new Error("Unable to place order");
    return res.status(201).json({ success: true, error: false, message: "Cash on Delivery order placed", data: responseData });
  } catch (error) {
    const conflict = /cart changed|cart is empty/i.test(error.message);
    return res.status(conflict ? 409 : 400).json({ success: false, error: true, message: error.message || "Unable to place order" });
  } finally {
    await session.endSession();
  }
}
