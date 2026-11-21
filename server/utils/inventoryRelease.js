import mongoose from "mongoose";
import ProductModel from "../models/product.model.js";
import OrderModel from "../models/order.model.js";

/**
 * Idempotently release stock for an order without requiring MongoDB
 * transactions. Each product increment and its order marker are one atomic
 * document update. A retry after a crash skips products already restored.
 */
export async function releaseOrderInventory(order) {
  let items;
  try {
    items = JSON.parse(order.product_details || "[]");
  } catch {
    throw new Error("Order inventory snapshot is invalid; manual reconciliation is required");
  }
  if (!Array.isArray(items) || !items.length) {
    throw new Error("Order inventory snapshot is empty; manual reconciliation is required");
  }

  const quantities = new Map();
  for (const item of items) {
    const productId = String(item.productId || "");
    const quantity = Number(item.quantity);
    if (!mongoose.isValidObjectId(productId) || !Number.isSafeInteger(quantity) || quantity <= 0) {
      throw new Error("Order inventory item is invalid; manual reconciliation is required");
    }
    quantities.set(productId, (quantities.get(productId) || 0) + quantity);
  }

  const releaseKey = String(order._id);
  // Persist the release claim before touching product stock. Payment confirmation
  // must treat this state as a reconciliation case, never as a normal paid order.
  await OrderModel.updateOne(
    { _id: order._id, inventoryReleased: { $ne: true } },
    { $set: { inventoryReleaseInProgress: true } }
  );
  for (const [productId, quantity] of quantities) {
    const result = await ProductModel.updateOne(
      { _id: productId, inventoryReleaseKeys: { $ne: releaseKey } },
      { $inc: { stock: quantity }, $addToSet: { inventoryReleaseKeys: releaseKey } }
    );
    if (result.matchedCount === 0) {
      const exists = await ProductModel.exists({ _id: productId });
      if (!exists) throw new Error(`Product ${productId} is missing; inventory reconciliation is required`);
      // A marker already exists, so this product was restored by an earlier attempt.
    }
  }

  await OrderModel.updateOne(
    { _id: order._id, inventoryReleased: { $ne: true } },
    { $set: { inventoryReleased: true, inventoryReleaseInProgress: false } }
  );
  // Keep the per-product marker: it makes later duplicate/recovery calls safe.
  return true;
}

/** Retry interrupted releases left by process termination or database errors. */
export async function recoverPendingInventoryReleases() {
  const pending = await OrderModel.find({
    inventoryReleased: { $ne: true },
    $or: [
      { delivery_status: "cancelled" },
      { payment_status: { $in: ["failed", "expired"] } },
      { payment_status: "paid_review_required", inventoryReleaseInProgress: true }
    ]
  }).limit(100).lean();

  for (const order of pending) {
    try {
      await releaseOrderInventory(order);
    } catch (error) {
      console.error(`Inventory release recovery failed for order ${order._id}:`, error.message);
    }
  }
}
