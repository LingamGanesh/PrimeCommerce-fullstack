import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) throw new Error("Set MONGODB_URI or MONGO_URI before running this migration.");

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const collection = mongoose.connection.db.collection("addresses");
  let invalidGeoRemoved = 0;
  const cursor = collection.find({ geo: { $exists: true } });
  for await (const address of cursor) {
    const coordinates = address.geo?.coordinates;
    const valid = address.geo?.type === "Point"
      && Array.isArray(coordinates)
      && coordinates.length === 2
      && coordinates.every(Number.isFinite)
      && coordinates[0] >= -180 && coordinates[0] <= 180
      && coordinates[1] >= -90 && coordinates[1] <= 90;
    if (!valid) {
      await collection.updateOne({ _id: address._id }, { $unset: { geo: "" } });
      invalidGeoRemoved += 1;
    }
  }

  const defaults = await collection.find({ isDefault: true }).sort({ createdAt: -1, _id: -1 }).toArray();
  const seenUsers = new Set();
  let duplicateDefaultsCleared = 0;
  for (const address of defaults) {
    const userId = address.userId ? String(address.userId) : "";
    if (!userId || seenUsers.has(userId)) {
      await collection.updateOne({ _id: address._id }, { $set: { isDefault: false } });
      duplicateDefaultsCleared += 1;
    } else {
      seenUsers.add(userId);
    }
  }

  await collection.createIndex({ userId: 1 }, { name: "address_user_id_idx" });
  await collection.createIndex({ geo: "2dsphere" }, { name: "address_geo_2dsphere_idx" });
  await collection.createIndex({ userId: 1 }, { unique: true, partialFilterExpression: { isDefault: true }, name: "one_default_address_per_user" });
  console.log("Address index migration complete:", { invalidGeoRemoved, duplicateDefaultsCleared });
} catch (error) {
  console.error("Address index migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}