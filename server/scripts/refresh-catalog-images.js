import dotenv from "dotenv";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";

dotenv.config();

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await ProductModel.find({}, { _id: 1, name: 1 }).lean();
  let productCount = 0;
  for (const product of products) {
    const seed = String(product.name || product._id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const image = `https://picsum.photos/seed/prime-${seed}/800/800`;
    await ProductModel.updateOne({ _id: product._id }, { $set: { image: [image] } });
    productCount += 1;
  }

  const categories = await CategoryModel.find({}, { _id: 1, name: 1 }).lean();
  for (const category of categories) {
    const seed = String(category.name || category._id).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    await CategoryModel.updateOne({ _id: category._id }, { $set: { image: `https://picsum.photos/seed/prime-category-${seed}/900/600` } });
  }

  console.log(`Image URLs refreshed for ${productCount} products and ${categories.length} categories. No products, categories, orders, or carts were deleted.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Image refresh failed:", error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
