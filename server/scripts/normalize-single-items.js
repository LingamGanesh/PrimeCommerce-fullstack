import dotenv from "dotenv";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";

dotenv.config();

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const result = await ProductModel.updateMany(
      { "more_details.packOptions": { $exists: true } },
      { $unset: { "more_details.packOptions": "", "more_details.imageKey": "" } }
    );
    const products = await ProductModel.countDocuments({});
    console.log(`Single-item catalog normalization complete. Removed pack-size variants from ${result.modifiedCount} products; ${products} products remain.`);
    console.log("Product names, prices, units, stock, images, orders and carts were not deleted or recreated.");
  } finally {
    await mongoose.disconnect();
  }
}

main().catch(async (error) => {
  console.error("Single-item normalization failed:", error);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
