import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User collection
      required: true,
    },
    orderId: {
      type: String,
      required: [true, "Order ID is required"],
      unique: true,
    },
    product_details: {
      type: String, // You can also make this an array of product objects if needed
      required: [true, "Product details are required"],
    },
    payment_id: {
      type: String,
      default: "",
    },
    payment_status: {
      type: String,
      default: "pending", // e.g., pending, completed, failed
    },
    delivery_address: {
      type: Object, // Can store structured address info
      required: true,
    },
    delivery_status: {
      type: String,
      default: "processing", // e.g., processing, shipped, delivered
    },
    subTotalAmt: {
      type: Number,
      required: true,
    },
    totalAmt: {
      type: Number,
      required: true,
    },
    invoice_receipt: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const OrderModel = mongoose.model("Order", orderSchema);

export default OrderModel;
