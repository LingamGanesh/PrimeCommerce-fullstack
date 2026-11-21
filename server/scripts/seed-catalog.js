import dotenv from "dotenv";
import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import CategoryModel from "../models/category.model.js";
import SubCategoryModel from "../models/subCategory.model.js";

dotenv.config();

const image = {
  fruits: "https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=700&auto=format&fit=crop",
  vegetables: "https://images.unsplash.com/photo-1546094096-0df4bcaaa337?w=700&auto=format&fit=crop",
  dairy: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=700&auto=format&fit=crop",
  bakery: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=700&auto=format&fit=crop",
  staples: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=700&auto=format&fit=crop",
  snacks: "https://images.unsplash.com/photo-1621939514649-280e2aa1f1ba?w=700&auto=format&fit=crop",
  personal: "https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=700&auto=format&fit=crop",
  household: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=700&auto=format&fit=crop"
};

const catalog = [
  ["Fruits", "fruits", ["Apples", "Bananas", "Citrus", "Seasonal Fruits"]],
  ["Vegetables", "vegetables", ["Leafy Greens", "Root Vegetables", "Fresh Vegetables"]],
  ["Dairy & Eggs", "dairy", ["Milk", "Curd & Paneer", "Butter & Cheese", "Eggs"]],
  ["Bakery", "bakery", ["Bread", "Buns & Pav", "Cakes & Rusk"]],
  ["Atta, Rice & Staples", "staples", ["Rice", "Atta & Flour", "Dals & Pulses", "Cooking Oils"]],
  ["Snacks & Drinks", "snacks", ["Chips & Namkeen", "Biscuits", "Chocolates", "Beverages"]],
  ["Personal Care", "personal", ["Bath & Body", "Hair Care", "Oral Care"]],
  ["Home Care", "household", ["Cleaning", "Laundry", "Kitchen Essentials"]]
];

const products = [
  ["Royal Gala Apples", "Fruits", "Apples", "4 pcs", 149, 10, "Crisp, juicy apples selected for everyday snacking."],
  ["Robusta Banana", "Fruits", "Bananas", "6 pcs", 42, 0, "Naturally sweet bananas, perfect for breakfast."],
  ["Fresh Pomegranate", "Fruits", "Seasonal Fruits", "2 pcs", 119, 5, "Juicy pomegranates with ruby-red arils."],
  ["Nagpur Oranges", "Fruits", "Citrus", "1 kg", 89, 0, "Refreshing sweet and tangy oranges."],
  ["Green Seedless Grapes", "Fruits", "Seasonal Fruits", "500 g", 79, 10, "Fresh, bite-sized seedless green grapes."],
  ["Sweet Lime Mosambi", "Fruits", "Citrus", "1 kg", 75, 0, "Fresh mosambi for juice and snacking."],
  ["Fresh Papaya", "Fruits", "Seasonal Fruits", "1 pc", 59, 0, "Naturally ripened papaya."],
  ["Premium Alphonso Mango", "Fruits", "Seasonal Fruits", "2 pcs", 199, 5, "A seasonal mango treat with rich flavour."],
  ["Fresh Strawberries", "Fruits", "Seasonal Fruits", "200 g", 99, 0, "Bright, fresh strawberries for desserts and snacks."],
  ["Tender Coconut", "Fruits", "Seasonal Fruits", "1 pc", 55, 0, "Naturally refreshing tender coconut."],

  ["Hybrid Tomatoes", "Vegetables", "Fresh Vegetables", "500 g", 28, 0, "Fresh red tomatoes for daily cooking."],
  ["Premium Onion", "Vegetables", "Root Vegetables", "1 kg", 39, 0, "Everyday onions, carefully sorted."],
  ["Potato", "Vegetables", "Root Vegetables", "1 kg", 34, 0, "Farm-fresh potatoes for versatile cooking."],
  ["Green Capsicum", "Vegetables", "Fresh Vegetables", "500 g", 42, 5, "Crunchy green capsicum."],
  ["Cucumber", "Vegetables", "Fresh Vegetables", "500 g", 25, 0, "Cool and crisp cucumbers for salads."],
  ["Carrot", "Vegetables", "Root Vegetables", "500 g", 36, 0, "Fresh orange carrots, rich in crunch."],
  ["Fresh Spinach", "Vegetables", "Leafy Greens", "1 bunch", 22, 0, "Washed and fresh leafy spinach."],
  ["Cauliflower", "Vegetables", "Fresh Vegetables", "1 pc", 39, 0, "Fresh cauliflower for curries and stir-fries."],
  ["Green Chilli", "Vegetables", "Fresh Vegetables", "100 g", 15, 0, "Fresh green chillies for everyday meals."],
  ["Coriander Leaves", "Vegetables", "Leafy Greens", "1 bunch", 12, 0, "Aromatic coriander leaves for garnish."],

  ["Amul Taaza Toned Milk", "Dairy & Eggs", "Milk", "500 ml", 29, 0, "Fresh toned milk for tea, coffee and breakfast."],
  ["Amul Gold Full Cream Milk", "Dairy & Eggs", "Milk", "500 ml", 34, 0, "Rich full cream milk."],
  ["Mother Dairy Classic Curd", "Dairy & Eggs", "Curd & Paneer", "400 g", 42, 0, "Creamy curd for everyday meals."],
  ["Fresh Paneer", "Dairy & Eggs", "Curd & Paneer", "200 g", 89, 5, "Soft paneer for curries and snacks."],
  ["Amul Butter", "Dairy & Eggs", "Butter & Cheese", "100 g", 60, 0, "Smooth and creamy table butter."],
  ["Processed Cheese Slices", "Dairy & Eggs", "Butter & Cheese", "200 g", 129, 0, "Melty cheese slices for sandwiches."],
  ["Farm Fresh Eggs", "Dairy & Eggs", "Eggs", "6 pcs", 48, 0, "Fresh table eggs for your daily protein."],

  ["Whole Wheat Bread", "Bakery", "Bread", "400 g", 45, 0, "Soft whole wheat bread for breakfast."],
  ["White Sandwich Bread", "Bakery", "Bread", "400 g", 40, 0, "Soft sliced bread for sandwiches and toast."],
  ["Milk Pav", "Bakery", "Buns & Pav", "6 pcs", 32, 0, "Soft pav buns, ideal with bhaji."],
  ["Burger Buns", "Bakery", "Buns & Pav", "4 pcs", 39, 0, "Fluffy buns for homemade burgers."],
  ["Elaichi Rusk", "Bakery", "Cakes & Rusk", "200 g", 55, 0, "Crunchy tea-time rusk with cardamom flavour."],

  ["India Gate Basmati Rice", "Atta, Rice & Staples", "Rice", "1 kg", 149, 5, "Long-grain basmati rice for fragrant meals."],
  ["Sona Masoori Rice", "Atta, Rice & Staples", "Rice", "5 kg", 299, 0, "Everyday lightweight rice."],
  ["Aashirvaad Whole Wheat Atta", "Atta, Rice & Staples", "Atta & Flour", "5 kg", 275, 0, "Whole wheat atta for soft rotis."],
  ["Toor Dal", "Atta, Rice & Staples", "Dals & Pulses", "1 kg", 169, 0, "Quality toor dal for everyday dal."],
  ["Moong Dal", "Atta, Rice & Staples", "Dals & Pulses", "1 kg", 139, 0, "Protein-rich yellow moong dal."],
  ["Fortune Sunflower Oil", "Atta, Rice & Staples", "Cooking Oils", "1 L", 145, 0, "Light sunflower oil for daily cooking."],

  ["Classic Salted Potato Chips", "Snacks & Drinks", "Chips & Namkeen", "50 g", 20, 0, "Crispy salted potato chips."],
  ["Haldiram Aloo Bhujia", "Snacks & Drinks", "Chips & Namkeen", "200 g", 58, 0, "Crunchy, spicy aloo bhujia."],
  ["Good Day Butter Cookies", "Snacks & Drinks", "Biscuits", "200 g", 35, 0, "Buttery cookies for tea-time."],
  ["Dark Chocolate Bar", "Snacks & Drinks", "Chocolates", "80 g", 99, 5, "Smooth dark chocolate for a little treat."],
  ["Coca-Cola", "Snacks & Drinks", "Beverages", "750 ml", 40, 0, "Chilled sparkling soft drink."],
  ["Tetra Pack Orange Juice", "Snacks & Drinks", "Beverages", "1 L", 110, 0, "Refreshing orange fruit drink."],

  ["Aloe Vera Bathing Soap", "Personal Care", "Bath & Body", "125 g", 38, 0, "Gentle daily cleansing soap."],
  ["Daily Care Shampoo", "Personal Care", "Hair Care", "180 ml", 119, 0, "Everyday shampoo for clean, fresh hair."],
  ["Mint Fresh Toothpaste", "Personal Care", "Oral Care", "150 g", 95, 0, "Fresh mint toothpaste for daily oral care."],

  ["Dishwash Liquid", "Home Care", "Cleaning", "500 ml", 99, 0, "Effective dish cleaning with a fresh fragrance."],
  ["Detergent Powder", "Home Care", "Laundry", "1 kg", 115, 0, "Everyday detergent for bright, clean clothes."],
  ["Kitchen Paper Towels", "Home Care", "Kitchen Essentials", "2 rolls", 89, 0, "Absorbent paper towels for kitchen cleanups."]
];

async function seed() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing from server/.env");
  await mongoose.connect(process.env.MONGODB_URI);
  const categoryByName = new Map();
  const subcategoryByName = new Map();

  for (const [name, key, subcategories] of catalog) {
    const category = await CategoryModel.findOneAndUpdate(
      { name },
      { $set: { name, image: image[key] } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    categoryByName.set(name, { ...category.toObject(), imageKey: key });
    for (const subName of subcategories) {
      const subcategory = await SubCategoryModel.findOneAndUpdate(
        { name: subName, categoryId: category._id },
        { $set: { name: subName, categoryId: [category._id], image: image[key] } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      subcategoryByName.set(`${name}::${subName}`, subcategory);
    }
  }

  let createdOrUpdated = 0;
  for (const [name, categoryName, subName, unit, price, discount, description] of products) {
    const category = categoryByName.get(categoryName);
    const subcategory = subcategoryByName.get(`${categoryName}::${subName}`);
    await ProductModel.findOneAndUpdate(
      { name },
      {
        $set: {
          name,
          categoryId: [category._id],
          sub_categoryId: [subcategory._id],
          unit,
          price,
          discount,
          stock: 30,
          description,
          image: [image[category.imageKey]],
          publish: true
        }
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );
    createdOrUpdated += 1;
  }

  console.log(`Catalog seed complete: ${createdOrUpdated} products processed across ${catalog.length} categories.`);
}

seed()
  .catch((error) => {
    console.error("Catalog seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.disconnect().catch(() => {});
  });
