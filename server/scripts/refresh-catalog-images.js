import dotenv from "dotenv";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";

dotenv.config();

const API = "https://api.openverse.org/v1/images/";
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const STOP_WORDS = new Set([
  "fresh", "premium", "classic", "daily", "selected", "farm", "everyday",
  "product", "food", "the", "and", "with", "for", "a", "an", "of",
  "hybrid", "baby", "english", "ooty", "nagpur", "thai", "alphonso",
  "royal", "gala", "ruby", "green", "seedless", "tender", "whole",
  "wheat", "stoneground", "multigrain", "cold", "pressed", "split",
  "kabuli", "country", "farm", "toned", "a2", "greek", "malai",
  "salted", "cheddar", "slices", "probiotic", "brioche", "jeera",
  "garlic", "cinnamon", "organic", "peri", "roasted", "baked",
  "kara", "sparkling", "masala", "filter", "nourishing", "herbal",
  "neem", "vitamin", "soft", "bristle", "rose", "liquid",
  "bathroom", "microfiber", "kitchen", "paper", "garbage",
  "fabric", "steel", "frozen", "sweet", "veggie", "french",
  "mixed", "mini", "hara", "bhara", "ready", "cook"
]);

const CATEGORY_QUERIES = {
  "Fresh Fruits": ["fresh fruit produce market", "apples mango bananas grapes fruit"],
  "Farm Vegetables": ["fresh vegetables produce market", "tomatoes onions potatoes carrots"],
  "Dairy & Eggs": ["milk cheese butter eggs dairy products"],
  "Bakery & Breads": ["bread bakery loaf croissant buns"],
  "Rice, Atta & Pulses": ["rice grains lentils pulses flour sacks"],
  "Snacks & Munchies": ["potato chips namkeen snack food"],
  "Beverages & Juices": ["fruit juice drinks beverages bottles"],
  "Personal Care": ["personal care shampoo soap toothpaste products"],
  "Home & Cleaning": ["household cleaning detergent dishwashing products"],
  "Frozen & Ready to Cook": ["frozen vegetables fries samosa ready meals"]
};

function tokens(value = "") {
  return String(value).toLowerCase().replace(/[^a-z0-9 ]/g, " ")
    .split(/\s+/).filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

function candidateScore(item, searchTerms) {
  const titleTokens = new Set(tokens(item.title || ""));
  const tagTokens = new Set((item.tags || []).flatMap((tag) => tokens(tag.name || "")));
  const titleMatches = searchTerms.filter((term) => titleTokens.has(term));
  const tagMatches = searchTerms.filter((term) => tagTokens.has(term));
  const matched = new Set([...titleMatches, ...tagMatches]);
  return {
    score: titleMatches.length * 2 + tagMatches.length,
    matchedCount: matched.size,
    titleMatches: titleMatches.length
  };
}

function searchPhrases(name, category) {
  const core = tokens(name);
  const phrases = [name];
  if (core.length) phrases.push(core.join(" "));
  if (core.length > 1) phrases.push(core.slice(-2).join(" "));
  if (category) phrases.push(category);
  return [...new Set(phrases)];
}

async function findSuitableImage(name, category = "") {
  const searchTerms = tokens(name);
  if (!searchTerms.length) return null;

  for (const query of searchPhrases(name, category)) {
    const url = new URL(API);
    url.searchParams.set("q", query);
    url.searchParams.set("page_size", "30");
    url.searchParams.set("license_type", "commercial");
    url.searchParams.set("extension", "jpg,png");
    url.searchParams.set("filter_dead", "true");

    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": "PrimeCommerceCatalog/1.0 (product image matching)"
      },
      signal: AbortSignal.timeout(25000)
    });
    if (!response.ok) throw new Error(`Openverse search failed (${response.status}) for "${query}"`);

    const data = await response.json();
    const candidates = (data.results || [])
      .filter((item) => item.url && /^https:\/\//i.test(item.url) && !item.mature)
      .map((item) => ({ item, ...candidateScore(item, searchTerms) }))
      .filter((candidate) => candidate.matchedCount > 0 && candidate.score >= 2)
      .sort((a, b) => b.score - a.score || b.titleMatches - a.titleMatches);

    if (candidates.length) return candidates[0].item;
    await sleep(150);
  }
  return null;
}

function attribution(match, fallbackName) {
  return {
    title: match.title || fallbackName,
    creator: match.creator || "Unknown",
    creatorUrl: match.creator_url || "",
    sourceUrl: match.foreign_landing_url || "",
    license: match.license || "",
    licenseUrl: match.license_url || "",
    provider: match.provider || ""
  };
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);

  const products = await ProductModel.find({}, { _id: 1, name: 1, categoryId: 1, more_details: 1 }).lean();
  const categories = await CategoryModel.find({}, { _id: 1, name: 1 }).lean();
  const report = [];
  let updatedProducts = 0;
  let updatedCategories = 0;
  let unchangedProducts = 0;
  let unchangedCategories = 0;

  try {
    for (const product of products) {
      try {
        const match = await findSuitableImage(product.name, "grocery");
        if (!match) {
          unchangedProducts += 1;
          report.push({ type: "product", name: product.name, status: "NO CONFIDENT MATCH - existing image preserved" });
          console.warn(`No confident matching photo found; preserved current image: ${product.name}`);
        } else {
          const metadata = attribution(match, product.name);
          await ProductModel.updateOne(
            { _id: product._id },
            { $set: { image: [match.url], "more_details.imageAttribution": metadata } }
          );
          updatedProducts += 1;
          report.push({
            type: "product",
            name: product.name,
            status: "UPDATED",
            imageTitle: metadata.title,
            creator: metadata.creator,
            license: metadata.license,
            source: metadata.sourceUrl
          });
          console.log(`Matched: ${product.name} -> ${metadata.title}`);
        }
      } catch (error) {
        unchangedProducts += 1;
        report.push({ type: "product", name: product.name, status: `ERROR - existing image preserved: ${error.message}` });
        console.error(`Image search failed for ${product.name}: ${error.message}`);
      }
      await sleep(300);
    }

    for (const category of categories) {
      try {
        const queries = CATEGORY_QUERIES[category.name] || [category.name];
        let match = null;
        for (const query of queries) {
          match = await findSuitableImage(category.name, query);
          if (match) break;
        }
        if (!match) {
          unchangedCategories += 1;
          report.push({ type: "category", name: category.name, status: "NO CONFIDENT MATCH - existing image preserved" });
          console.warn(`No confident category photo found; preserved current image: ${category.name}`);
        } else {
          const metadata = attribution(match, category.name);
          await CategoryModel.updateOne(
            { _id: category._id },
            { $set: { image: match.url } }
          );
          updatedCategories += 1;
          report.push({
            type: "category",
            name: category.name,
            status: "UPDATED",
            imageTitle: metadata.title,
            creator: metadata.creator,
            license: metadata.license,
            source: metadata.sourceUrl
          });
          console.log(`Category matched: ${category.name} -> ${metadata.title}`);
        }
      } catch (error) {
        unchangedCategories += 1;
        report.push({ type: "category", name: category.name, status: `ERROR - existing image preserved: ${error.message}` });
        console.error(`Category image search failed for ${category.name}: ${error.message}`);
      }
      await sleep(300);
    }
  } finally {
    await mongoose.disconnect();
  }

  const fs = await import("node:fs/promises");
  await fs.writeFile("catalog-image-report.json", JSON.stringify(report, null, 2));
  console.log(
    `Image matching complete: ${updatedProducts}/${products.length} products and ${updatedCategories}/${categories.length} categories updated. ` +
    `Unmatched/failed entries preserved: ${unchangedProducts} products, ${unchangedCategories} categories.`
  );
  console.log("Review catalog-image-report.json for image titles, creators, sources and licenses.");
  console.log("No products, prices, pack sizes, orders, carts, or existing unmatched images were deleted.");
}

main().catch(async (error) => {
  console.error("Catalog image matching failed:", error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
