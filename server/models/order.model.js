import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: [true, "Order ID is required"], unique: true },
    product_details: { type: String, required: [true, "Product details are required"] },
    payment_id: { type: String, default: "" },
    payment_status: { type: String, default: "pending" },
    paymentMethod: { type: String, enum: ["COD", "RAZORPAY"], default: "COD" },
    razorpayOrderId: { type: String, default: null, index: true },
    paymentReservationExpiresAt: { type: Date, default: null, index: true },
    inventoryReleased: { type: Boolean, default: false },
    delivery_address: { type: Object, required: true },
    pickerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    riderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    pickedAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    riderLocation: { lat: { type: Number, default: null }, lng: { type: Number, default: null }, updatedAt: { type: Date, default: null } },
    deliveryOtpHash: { type: String, default: null, select: false },
    deliveryOtpExpiresAt: { type: Date, default: null, select: false },
    deliveryOtpAttempts: { type: Number, default: 0, select: false },
    delivery_status: { type: String, default: "processing" },
    subTotalAmt: { type: Number, required: true },
    totalAmt: { type: Number, required: true },
    invoice_receipt: { type: String, default: "" }
  },
  { timestamps: true }
);

const OrderModel = mongoose.model("Order", orderSchema);
export default OrderModel;