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
      ref: "User",
      required: true,
    },
    variantId: { type: mongoose.Schema.Types.ObjectId, ref: "Variant", default: null },
    storeId: { type: mongoose.Schema.Types.ObjectId, ref: "Store", default: null },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

// A user can have only one cart row for a given product. This also makes
// concurrent add-to-cart upserts safe across multiple application instances.
cartProductSchema.index({ userId: 1, productId: 1, variantId: 1 }, { unique: true, name: "user_product_variant_unique" });

const CartProductModel = mongoose.model("CartProduct", cartProductSchema);

export default CartProductModel;
