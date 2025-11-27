import mongoose from "mongoose";

const subCategorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Subcategory name is required"],
      trim: true,
    },
    image: {
      type: String,
      default: "",
    },
    categoryId: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", // reference to Category collection
        required: true,
      },
    ],
  },
  {
    timestamps: true, // adds createdAt and updatedAt automatically
  }
);

const SubCategoryModel = mongoose.model("SubCategory", subCategorySchema);

export default SubCategoryModel;
