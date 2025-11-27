import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "", // URL of category image
    },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;
