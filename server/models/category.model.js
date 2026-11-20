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
      default: "",
    },
    slug: { type: String, trim: true, lowercase: true, unique: true, sparse: true, index: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null, index: true },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
  }
);

const CategoryModel = mongoose.model("Category", categorySchema);

export default CategoryModel;
