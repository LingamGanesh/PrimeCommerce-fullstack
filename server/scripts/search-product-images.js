import dotenv from "dotenv";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";

dotenv.config();

const COMMONS_API = "https://commons.wikimedia.org/w/api.php";
const STOP = new Set(["fresh", "premium", "classic", "daily", "selected", "farm", "everyday", "whole", "organic", "natural", "product", "food", "the", "and", "with", "for", "from", "a", "an", "of", "best", "new", "pack", "pcs"]);
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function words(value = "") {
  return String(value).toLowerCase().normalize("NFKD")
    .replace(/[^a-z0-9 ]/g, " ").split(/\s+/)
    .filter((word) => word.length > 2 && !STOP.has(word))
    .map((word) => word.endsWith("ies") ? word.slice(0, -3) + "y" : word.endsWith("s") ? word.slice(0, -1) : word);
}

function scoreTitle(title, productName) {
  const wanted = [...new Set(words(productName))];
  const actual = new Set(words(title));
  const matches = wanted.filter((word) => actual.has(word));
  const required = wanted.length <= 1 ? 1 : 2;
  return { score: matches.length / Math.max(wanted.length, 1), matches, acceptable: matches.length >= required };
}

async function searchProductImage(productName) {
  const url = new URL(COMMONS_API);
  url.searchParams.set("action", "query");
  url.searchParams.set("format", "json");
  url.searchParams.set("formatversion", "2");
  url.searchParams.set("generator", "search");
  url.searchParams.set("gsrnamespace", "6");
  url.searchParams.set("gsrlimit", "20");
  url.searchParams.set("gsrsearch", `filetype:bitmap "${productName}"`);
  url.searchParams.set("prop", "imageinfo");
  url.searchParams.set("iiprop", "url|extmetadata|mime");
  url.searchParams.set("iiurlwidth", "900");

  const response = await fetch(url, {
    headers: { "User-Agent": "PrimeCommerceCatalog/1.0 (catalog image matching; contact: project maintainer)" },
    signal: AbortSignal.timeout(25000)
  });
  if (!response.ok) throw new Error(`Wikimedia Commons search failed: HTTP ${response.status}`);
  const data = await response.json();
  const pages = data.query?.pages || [];
  const candidates = pages.map((page) => {
    const info = page.imageinfo?.[0];
    const match = scoreTitle(page.title || "", productName);
    return { page, info, match };
  }).filter(({ info, match }) =>
    info?.thumburl && /^https:\/\//i.test(info.thumburl) &&
    ["image/jpeg", "image/png", "image/webp"].includes(info.mime) &&
    match.acceptable
  ).sort((a, b) => b.match.score - a.match.score || b.match.matches.length - a.match.matches.length);

  return candidates[0] || null;
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);
  const products = await ProductModel.find({}, { _id: 1, name: 1 }).lean();
  const report = [];
  let updated = 0;
  let unmatched = 0;

  try {
    for (const product of products) {
      try {
        const result = await searchProductImage(product.name);
        if (!result) {
          await ProductModel.updateOne(
            { _id: product._id },
            { $set: { image: [], publish: false } }
          );
          unmatched += 1;
          report.push({ product: product.name, status: "UNPUBLISHED_NO_CONFIDENT_IMAGE_MATCH", removedFromStorefront: true });
          console.log("Unpublished product without a confident matching image: " + product.name);
        } else {
          const info = result.info;
          const metadata = info.extmetadata || {};
          const attribution = {
            source: "Wikimedia Commons",
            fileTitle: result.page.title,
            filePage: info.descriptionurl || "",
            creator: metadata.Artist?.value || "",
            license: metadata.LicenseShortName?.value || "",
            licenseUrl: metadata.LicenseUrl?.value || ""
          };
          await ProductModel.updateOne(
            { _id: product._id },
            { $set: { image: [info.thumburl], publish: true, "more_details.imageAttribution": attribution } }
          );
          updated += 1;
          report.push({ product: product.name, status: "MATCHED", image: info.thumburl, ...attribution });
          console.log(`Matched ${product.name} -> ${result.page.title}`);
        }
      } catch (error) {
        unmatched += 1;
        report.push({ product: product.name, status: "SEARCH_ERROR", error: error.message, productVisibilityUnchanged: true });
        console.error(`Image search failed for ${product.name}: ${error.message}`);
      }
      await sleep(250);
    }
  } finally {
    await mongoose.disconnect();
  }

  const fs = await import("node:fs/promises");
  await fs.writeFile("catalog-product-image-report.json", JSON.stringify(report, null, 2));
  console.log(`Finished product image search: ${updated}/${products.length} matched; ${unmatched} unmatched/failed.`);
  console.log("Matched products are published with the selected image. Products with no confident title match are unpublished and have their image cleared. Search errors leave product visibility unchanged.");
  console.log("Review catalog-product-image-report.json and visually verify image relevance and license.");
}

main().catch(async (error) => {
  console.error("Product image search failed:", error);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
