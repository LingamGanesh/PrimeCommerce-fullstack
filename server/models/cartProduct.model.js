import mongoose from "mongoose";

const cartProductSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product", // Reference to Product collection
      required: true,
    },
    quantity: {
      type: Number,
      required: [true, "Quantity is required"],
      default: 1,
      min: 1,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Reference to User collection
      required: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const CartProductModel = mongoose.model("CartProduct", cartProductSchema);

export default CartProductModel;
