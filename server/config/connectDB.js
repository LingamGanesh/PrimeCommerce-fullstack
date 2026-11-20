import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

let connectionPromise;

async function connectDB() {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (mongoose.connection.readyState !== 2) connectionPromise = null;
  const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Please provide MONGODB_URI in the deployment environment");
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000
    }).then(() => {
      console.log("MongoDB connected");
      return mongoose.connection;
    }).catch(error => {
      connectionPromise = null;
      throw error;
    });
  }

  return connectionPromise;
}

export default connectDB;
