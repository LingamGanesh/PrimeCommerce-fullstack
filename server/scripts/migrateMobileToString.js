import "dotenv/config";
import mongoose from "mongoose";

const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!uri) throw new Error("Set MONGODB_URI or MONGO_URI before running this migration.");

try {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  const database = mongoose.connection.db;
  const [users, addresses] = await Promise.all([
    database.collection("users").updateMany({ mobile: { $type: "number" } }, [{ $set: { mobile: { $toString: "$mobile" } } }]),
    database.collection("addresses").updateMany({ mobile: { $type: "number" } }, [{ $set: { mobile: { $toString: "$mobile" } } }])
  ]);
  console.log("Mobile-number migration complete:", { usersConverted: users.modifiedCount, addressesConverted: addresses.modifiedCount });
} catch (error) {
  console.error("Mobile-number migration failed:", error.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}