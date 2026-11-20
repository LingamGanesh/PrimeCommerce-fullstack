import "dotenv/config";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import connectDB from "../config/connectDB.js";
import User from "../models/user.model.js";
import Category from "../models/category.model.js";
import SubCategory from "../models/subCategory.model.js";
import Product from "../models/product.model.js";
import Variant from "../models/variant.model.js";
import Store from "../models/store.model.js";
import Inventory from "../models/inventory.model.js";
import Banner from "../models/banner.model.js";
import HomeSection from "../models/homeSection.model.js";
import Coupon from "../models/coupon.model.js";
import AppConfig from "../models/appConfig.model.js";
import Rider from "../models/rider.model.js";

const slugify = value => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
const categories = [
  ["Fruits & Vegetables", ["Fresh Fruits", "Fresh Vegetables"]],
  ["Dairy & Breakfast", ["Milk", "Bread & Bakery"]],
  ["Atta, Rice & Dal", ["Atta", "Rice & Dal"]],
  ["Masala, Oil & More", ["Edible Oils", "Spices"]],
  ["Bakery & Biscuits", ["Cookies", "Cakes"]],
  ["Instant & Frozen Food", ["Instant Meals", "Frozen Snacks"]],
  ["Sweet Tooth", ["Chocolates", "Indian Sweets"]],
  ["Munchies", ["Chips", "Namkeen"]],
  ["Cold Drinks & Juices", ["Soft Drinks", "Juices"]],
  ["Tea, Coffee & Health Drink", ["Tea", "Coffee"]],
  ["Cleaning Essentials", ["Detergents", "Dishwash"]],
  ["Home & Office", ["Stationery", "Home Utility"]],
  ["Personal Care", ["Bath & Body", "Oral Care"]],
  ["Baby Care", ["Diapers", "Baby Food"]],
  ["Pet Care", ["Dog Food", "Cat Food"]]
];
const brands = ["Daily Fresh", "Farm Select", "Prime Choice", "Nature Basket", "Good Harvest"];
const names = [
  "Premium Bananas", "Fresh Apples", "Sweet Oranges", "Green Grapes",
  "Full Cream Milk", "Toned Milk", "Whole Wheat Bread", "Farm Eggs",
  "Whole Wheat Atta", "Basmati Rice", "Toor Dal", "Moong Dal",
  "Sunflower Oil", "Groundnut Oil", "Turmeric Powder", "Red Chilli Powder",
  "Butter Cookies", "Digestive Biscuits", "Chocolate Cake", "Rusk Toast",
  "Instant Noodles", "Frozen Peas", "French Fries", "Veg Nuggets",
  "Milk Chocolate", "Dark Chocolate", "Gulab Jamun", "Soan Papdi",
  "Potato Chips", "Masala Namkeen", "Roasted Peanuts", "Banana Chips",
  "Cola Drink", "Lemon Soda", "Orange Juice", "Mango Juice",
  "Assam Tea", "Green Tea", "Instant Coffee", "Filter Coffee",
  "Liquid Detergent", "Washing Powder", "Dishwash Liquid", "Scrub Pads",
  "Notebook", "Ball Pens", "Garbage Bags", "Kitchen Towels",
  "Body Wash", "Hand Wash", "Toothpaste", "Toothbrush",
  "Baby Diapers", "Baby Wipes", "Baby Cereal", "Toddler Snacks",
  "Dog Food", "Dog Treats", "Cat Food", "Cat Litter"
];
const prices = [48, 129, 69, 99, 32, 29, 45, 78, 265, 349, 145, 119, 159, 189, 42, 48, 35, 40, 120, 65];

async function upsertBy(Model, filter, values) {
  return Model.findOneAndUpdate(filter, { $setOnInsert: values }, { upsert: true, new: true, setDefaultsOnInsert: true });
}

async function seed() {
  if (process.env.NODE_ENV === "production" && (!process.env.SEED_ADMIN_PASSWORD || !process.env.SEED_CUSTOMER_PASSWORD)) {
    throw new Error("Set SEED_ADMIN_PASSWORD and SEED_CUSTOMER_PASSWORD before running seed in production.");
  }
  await connectDB();
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || "PrimeAdmin@123";
  const customerPassword = process.env.SEED_CUSTOMER_PASSWORD || "PrimeUser@123";
  const [adminHash, customerHash] = await Promise.all([bcrypt.hash(adminPassword, 12), bcrypt.hash(customerPassword, 12)]);
  const admin = await upsertBy(User, { email: "admin@primecommerce.in" }, {
    name: "PrimeCommerce Super Admin", email: "admin@primecommerce.in", password: adminHash,
    role: "admin", permissions: ["*"], verify_email: true, status: "active"
  });
  const customer = await upsertBy(User, { email: "customer@primecommerce.in" }, {
    name: "PrimeCommerce Test Customer", email: "customer@primecommerce.in", password: customerHash,
    role: "user", verify_email: true, status: "active"
  });
  const riderUser = await upsertBy(User, { email: "rider@primecommerce.in" }, {
    name: "PrimeCommerce Test Rider", email: "rider@primecommerce.in",
    password: await bcrypt.hash(process.env.SEED_RIDER_PASSWORD || "PrimeRider@123", 12),
    role: "rider", verify_email: true, status: "active"
  });

  const store = await upsertBy(Store, { slug: "prime-madhapur" }, {
    name: "PrimeCommerce Madhapur", slug: "prime-madhapur",
    address: "Madhapur, Hyderabad, Telangana, India",
    pincodes: ["500081", "500033", "500084", "500072"],
    openTime: "07:00", closeTime: "23:00", deliveryEtaMinutes: 10, isActive: true
  });
  await upsertBy(Rider, { userId: riderUser._id }, { userId: riderUser._id, storeId: store._id, kycStatus: "verified", isOnline: true });

  const categoryDocs = [];
  const subCategoryDocs = [];
  for (let i = 0; i < categories.length; i++) {
    const [name, subs] = categories[i];
    const category = await upsertBy(Category, { slug: slugify(name) }, {
      name, slug: slugify(name), image: "", sortOrder: i, isActive: true
    });
    categoryDocs.push(category);
    for (let j = 0; j < subs.length; j++) {
      const sub = await upsertBy(SubCategory, { slug: slugify(name + "-" + subs[j]) }, {
        name: subs[j], slug: slugify(name + "-" + subs[j]), image: "",
        categoryId: [category._id], sortOrder: j, isActive: true
      });
      subCategoryDocs.push({ doc: sub, categoryIndex: i });
    }
  }

  const productDocs = [];
  for (let i = 0; i < names.length; i++) {
    const categoryIndex = Math.floor(i / 4);
    const sub = subCategoryDocs.filter(x => x.categoryIndex === categoryIndex)[i % 4 < 2 ? 0 : 1].doc;
    const name = names[i];
    const slug = slugify(name);
    const mrp = prices[i % prices.length];
    const sellingPrice = Math.round(mrp * (i % 3 === 0 ? 0.9 : 0.95) * 100) / 100;
    const product = await upsertBy(Product, { slug }, {
      name, slug, brand: brands[i % brands.length], image: [], images: [],
      categoryId: [categoryDocs[categoryIndex]._id], sub_categoryId: [sub._id], subCategoryId: sub._id,
      unit: i % 4 === 0 ? "1 pack" : i % 4 === 1 ? "500 g" : i % 4 === 2 ? "1 kg" : "1 L",
      stock: 100, price: sellingPrice, discount: Math.round((1 - sellingPrice / mrp) * 100),
      description: name + " - quality checked and packed fresh.",
      highlights: ["Quality checked", "Fresh stock"], tags: [slugify(name), slugify(brands[i % brands.length])],
      publish: true, isActive: true
    });
    const sku = "PRIME-" + String(i + 1).padStart(4, "0");
    const variant = await upsertBy(Variant, { sku }, {
      productId: product._id, sku, unit: product.unit, mrp, sellingPrice, taxPercent: 5, isActive: true
    });
    await upsertBy(Inventory, { storeId: store._id, variantId: variant._id }, {
      storeId: store._id, variantId: variant._id, quantity: 100, reserved: 0, reorderLevel: 10, batches: []
    });
    productDocs.push(product);
  }

  await upsertBy(Banner, { title: "Fresh groceries, delivered fast" }, {
    title: "Fresh groceries, delivered fast", imageUrl: "", storeIds: [store._id], sortOrder: 0, isActive: true
  });
  await upsertBy(HomeSection, { title: "Bestsellers" }, {
    title: "Bestsellers", type: "bestsellers", productIds: productDocs.slice(0, 12).map(p => p._id),
    storeIds: [store._id], sortOrder: 0, isActive: true
  });
  await upsertBy(Coupon, { code: "WELCOME50" }, {
    code: "WELCOME50", type: "flat", value: 50, minOrder: 299, maxDiscount: 50,
    usageLimit: 1000, usagePerUser: 1, startsAt: new Date(), isActive: true
  });
  await upsertBy(AppConfig, { key: "delivery_fees" }, {
    key: "delivery_fees",
    value: { deliveryFee: 20, freeDeliveryAbove: 499, handlingFee: 4, smallCartFee: 15, smallCartThreshold: 149, platformFee: 3, rainSurgeEnabled: false, codEnabled: true }
  });
  await upsertBy(AppConfig, { key: "store_defaults" }, {
    key: "store_defaults", value: { defaultStoreId: store._id, currency: "INR", deliveryEtaMinutes: 10 }
  });

  console.log("PrimeCommerce seed completed.");
  console.log({ admin: String(admin._id), customer: String(customer._id), store: String(store._id), categories: categoryDocs.length, subcategories: subCategoryDocs.length, products: productDocs.length });
  console.log("Development accounts: admin@primecommerce.in / PrimeAdmin@123; customer@primecommerce.in / PrimeUser@123; rider@primecommerce.in / PrimeRider@123");
}

seed().catch(error => {
  console.error("Seed failed:", error);
  process.exitCode = 1;
}).finally(async () => {
  await mongoose.disconnect();
});
