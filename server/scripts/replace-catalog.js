import dotenv from "dotenv";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import SubCategoryModel from "../models/subCategory.model.js";
import CartProductModel from "../models/cartProduct.model.js";

dotenv.config();

const catalog = [
  ["Fresh Fruits", "fresh-fruits", "fruit", ["Royal Gala Apples","Alphonso Mango","Robusta Bananas","Ruby Pomegranate","Green Seedless Grapes","Nagpur Oranges","Thai Guava","Premium Papaya","Fresh Strawberries","Tender Coconut"]],
  ["Farm Vegetables", "farm-vegetables", "vegetable", ["Hybrid Tomatoes","Red Onions","Baby Potatoes","Green Capsicum","English Cucumber","Ooty Carrots","Baby Spinach","Cauliflower","Green Chillies","Fresh Coriander"]],
  ["Dairy & Eggs", "dairy-eggs", "dairy", ["Farm Toned Milk","A2 Cow Milk","Greek Yogurt","Malai Paneer","Salted Butter","Cheddar Cheese Slices","Country Eggs","Fresh Cream","Probiotic Curd","Mozzarella Cheese"]],
  ["Bakery & Breads", "bakery-breads", "bakery", ["Whole Wheat Bread","Multigrain Loaf","Milk Pav","Brioche Burger Buns","Butter Croissant","Chocolate Muffin","Jeera Rusk","Garlic Breadsticks","Cinnamon Roll","Fruit Cake"]],
  ["Rice, Atta & Pulses", "rice-atta-pulses", "staples", ["Classic Basmati Rice","Sona Masoori Rice","Organic Brown Rice","Stoneground Wheat Atta","Multigrain Atta","Premium Toor Dal","Split Moong Dal","Kabuli Chana","Masoor Dal","Cold Pressed Groundnut Oil"]],
  ["Snacks & Munchies", "snacks-munchies", "snack", ["Classic Salted Chips","Peri Peri Potato Wafers","Masala Banana Chips","Roasted Makhana","Baked Millet Puffs","Kara Boondi","Peanut Chikki","Cheese Nachos","Masala Peanuts","Wholegrain Crackers"]],
  ["Beverages & Juices", "beverages-juices", "drink", ["Fresh Orange Juice","Tender Coconut Water","Mango Nectar","Sparkling Lime Water","Cold Coffee","Masala Buttermilk","Pomegranate Juice","Green Tea","Filter Coffee Decoction","Almond Drink"]],
  ["Personal Care", "personal-care", "care", ["Aloe Vera Body Wash","Nourishing Shampoo","Herbal Conditioner","Neem Face Wash","Vitamin C Face Serum","Daily Moisturizer","Cocoa Body Lotion","Mint Toothpaste","Soft Bristle Toothbrush","Rose Hand Cream"]],
  ["Home & Cleaning", "home-cleaning", "home", ["Lemon Dishwash Gel","Liquid Laundry Detergent","Floor Cleaner","Bathroom Cleaning Spray","Microfiber Cleaning Cloth","Kitchen Paper Towels","Garbage Bags","Fabric Conditioner","Steel Scrub Pads","Handwash Refill"]],
  ["Frozen & Ready to Cook", "frozen-ready", "frozen", ["Frozen Green Peas","Sweet Corn Kernels","Veggie Burger Patties","Paneer Tikka Bites","Classic French Fries","Mixed Vegetable Nuggets","Whole Wheat Paratha","Mini Samosas","Hara Bhara Kebab","Cheese Garlic Bread"]]
];

const categoryImages = [
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600",
  "https://picsum.photos/seed/prime-category-image/900/600"
];

const basePrices = [
  [149,199,42,119,89,75,69,59,99,55],
  [28,39,34,42,25,36,22,39,15,12],
  [29,42,75,89,60,129,48,55,45,149],
  [45,55,32,49,89,65,55,59,69,99],
  [149,299,179,275,299,169,139,119,125,189],
  [20,35,45,99,65,40,55,79,49,69],
  [99,45,89,55,75,35,119,149,125,99],
  [119,189,179,99,299,199,229,55,35,149],
  [99,189,129,159,79,89,99,149,35,119],
  [89,99,149,179,99,129,79,99,119,129]
];

const packOptions = (price, unit) => {
  const units = unit.includes("ml") || unit.includes("L") ? ["250 ml","500 ml","1 L"] : unit.includes("pcs") ? ["2 pcs","4 pcs","6 pcs"] : ["250 g","500 g","1 kg"];
  return [
    { label: units[0], price: Math.max(10, Math.round(price * 0.58)) },
    { label: units[1], price },
    { label: units[2], price: Math.round(price * 1.85) }
  ];
};

async function main() {
  if (process.env.REPLACE_CATALOG !== "true") {
    throw new Error("Safety stop: set REPLACE_CATALOG=true only after confirming server/.env points to the intended database. This replaces products, categories, subcategories and active carts.");
  }
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);

  await CartProductModel.deleteMany({});
  await ProductModel.deleteMany({});
  await SubCategoryModel.deleteMany({});
  await CategoryModel.deleteMany({});

  let productCount = 0;
  for (let c = 0; c < catalog.length; c += 1) {
    const [categoryName, slug, imageTerm, names] = catalog[c];
    const category = await CategoryModel.create({
      name: categoryName,
      image: categoryImages[c]
    });
    const subcategory = await SubCategoryModel.create({
      name: categoryName + " Essentials",
      image: categoryImages[c],
      categoryId: [category._id]
    });

    for (let p = 0; p < names.length; p += 1) {
      const index = c * 10 + p + 1;
      const price = basePrices[c][p];
      const unit = c === 2 || c === 6 || c === 7 || c === 8 ? "500 ml" : c === 0 || c === 1 ? "500 g" : "500 g";
      const options = packOptions(price, unit);
      await ProductModel.create({
        name: names[p],
        image: [`https://picsum.photos/seed/prime-product-${index}/800/800`],
        categoryId: [category._id],
        sub_categoryId: [subcategory._id],
        unit: options[1].label,
        stock: 40,
        price: options[1].price,
        discount: index % 5 === 0 ? 10 : 0,
        description: `${names[p]} selected for your everyday shopping.`,
        more_details: { packOptions: options, imageKey: `prime-${slug}-${index}` },
        publish: true
      });
      productCount += 1;
    }
  }

  console.log(`Catalog replaced successfully: ${productCount} unique products, ${catalog.length} categories, ${productCount} distinct product image URLs.`);
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Catalog replacement failed:", error.message);
  try { await mongoose.disconnect(); } catch {}
  process.exitCode = 1;
});
