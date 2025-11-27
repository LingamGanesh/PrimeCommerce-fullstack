import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
    },
    image: {
      type: [String], // Array of image URLs
      default: [],
    },
    categoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // Reference to Category collection
        required: true,
      },
    ],
    sub_categoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "SubCategory", // Reference to SubCategory collection
        required: true,
      },
    ],
    unit: {
      type: String,
      required: [true, "Unit is required (e.g., pcs, kg)"],
      trim: true,
    },
    stock: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
    },
    discount: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      trim: true,
    },
    more_details: {
      type: Object,
      default: {}, // Can store any additional product info
    },
    publish: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const ProductModel = mongoose.model("Product", productSchema);

export default ProductModel;
