import dotenv from "dotenv";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";

dotenv.config();

const API = "https://api.openverse.org/v1/images/";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const STOP_WORDS = new Set(["fresh", "premium", "classic", "daily", "selected", "farm", "everyday", "product", "food", "the", "and", "with", "for"]);

function tokens(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9 ]/g, " ").split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function relevance(result, searchTerms) {
  const title = tokens(result.title || "");
  const tags = (result.tags || []).flatMap((tag) => tokens(tag.name || ""));
  const haystack = new Set([...title, ...tags]);
  const matches = searchTerms.filter((term) => haystack.has(term));
  const titleMatches = searchTerms.filter((term) => title.includes(term)).length;
  return { score: matches.length + titleMatches * 0.75, matches };
}

async function findSuitableImage(name, context = "") {
  const query = [name, context].filter(Boolean).join(" ");
  const url = new URL(API);
  url.searchParams.set("q", query);
  url.searchParams.set("page_size", "20");
  url.searchParams.set("license_type", "commercial");
  url.searchParams.set("extension", "jpg,png");
  url.searchParams.set("filter_dead", "true");

  const response = await fetch(url, {
    headers: { Accept: "application/json", "User-Agent": "PrimeCommerceCatalog/1.0 (product image matching)" },
    signal: AbortSignal.timeout(25000),
  });
  if (!response.ok) throw new Error(`Openverse search failed (${response.status}) for "${name}"`);
  const data = await response.json();
  const searchTerms = tokens(name);
  const candidates = (data.results || [])
    .filter((item) => item.url && /^https:\/\//i.test(item.url) && !item.mature)
    .map((item) => ({ item, ...relevance(item, searchTerms) }))
    .sort((a, b) => b.score - a.score);

  // Do not assign an unrelated image just to fill an empty slot.
  const best = candidates.find((candidate) => candidate.matches.length >= Math.min(1, searchTerms.length) && candidate.score >= 1.75);
  return best ? best.item : null;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await ProductModel.find({}, { _id: 1, name: 1, more_details: 1 }).lean();
  const categories = await CategoryModel.find({}, { _id: 1, name: 1 }).lean();
  const report = [];
  let updatedProducts = 0;
  let updatedCategories = 0;

  try {
    for (const product of products) {
      try {
        const match = await findSuitableImage(product.name, "food grocery product");
        if (!match) {
          await ProductModel.updateOne({ _id: product._id }, { $set: { image: [] } });
          report.push({ type: "product", name: product.name, status: "NO CONFIDENT MATCH - image cleared" });
          console.warn(`No confident matching photo found: ${product.name}`);
        } else {
          const metadata = {
            title: match.title || product.name,
            creator: match.creator || "Unknown",
            creatorUrl: match.creator_url || "",
            sourceUrl: match.foreign_landing_url || "",
            license: match.license || "",
            licenseUrl: match.license_url || "",
            provider: match.provider || "",
          };
          await ProductModel.updateOne(
            { _id: product._id },
            { $set: { image: [match.url], "more_details.imageAttribution": metadata } }
          );
          updatedProducts += 1;
          report.push({ type: "product", name: product.name, status: "UPDATED", imageTitle: metadata.title, license: metadata.license, source: metadata.sourceUrl });
          console.log(`Matched: ${product.name} -> ${metadata.title}`);
        }
      } catch (error) {
        report.push({ type: "product", name: product.name, status: `ERROR: ${error.message}` });
        console.error(`Image search failed for ${product.name}: ${error.message}`);
      }
      await sleep(350);
    }

    for (const category of categories) {
      try {
        const match = await findSuitableImage(category.name, "grocery category food");
        if (!match) {
          await CategoryModel.updateOne({ _id: category._id }, { $set: { image: "" } });
          report.push({ type: "category", name: category.name, status: "NO CONFIDENT MATCH - image cleared" });
          console.warn(`No confident category photo found: ${category.name}`);
        } else {
          await CategoryModel.updateOne({ _id: category._id }, { $set: { image: match.url } });
          updatedCategories += 1;
          report.push({ type: "category", name: category.name, status: "UPDATED", imageTitle: match.title, license: match.license, source: match.foreign_landing_url });
          console.log(`Category matched: ${category.name} -> ${match.title}`);
        }
      } catch (error) {
        report.push({ type: "category", name: category.name, status: `ERROR: ${error.message}` });
        console.error(`Category image search failed for ${category.name}: ${error.message}`);
      }
      await sleep(350);
    }
  } finally {
    await mongoose.disconnect();
  }

  const fs = await import("node:fs/promises");
  await fs.writeFile("catalog-image-report.json", JSON.stringify(report, null, 2));
  console.log(`Image matching complete: ${updatedProducts}/${products.length} products and ${updatedCategories}/${categories.length} categories updated.`);
  console.log("Unmatched items are left unchanged; review catalog-image-report.json for image titles, creators, sources and licenses.");
  console.log("No products, prices, pack sizes, orders, or carts were deleted or modified.");
}

main().catch(async (error) => {
  console.error("Catalog image matching failed:", error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
