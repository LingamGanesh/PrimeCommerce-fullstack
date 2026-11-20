import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
import mongoose from "mongoose";
import connectDB from "./config/connectDB.js";
import userRouter from "./routes/user.routes.js";
import catalogRouter from "./routes/catalog.routes.js";
import cartRouter from "./routes/cart.routes.js";
import addressRouter from "./routes/address.routes.js";
import checkoutRouter from "./routes/checkout.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import adminRouter from "./routes/admin.routes.js";
import fulfilmentRouter from "./routes/fulfilment.routes.js";
import paymentsRouter from "./routes/payments.routes.js";
import supportRouter from "./routes/support.routes.js";
import { handleRazorpayWebhook, expireRazorpayReservations } from "./controllers/payments.controller.js";

dotenv.config();

const app = express();

if (process.env.NODE_ENV === "production") {
  const requiredSecrets = ["SECRET_KEY_ACCESS_TOKEN", "SECRET_KEY_REFRESH_TOKEN"];
  for (const name of requiredSecrets) {
    if (!process.env[name] || process.env[name].length < 32) {
      throw new Error(`${name} must be configured with at least 32 characters in production`);
    }
  }
  if (process.env.SECRET_KEY_ACCESS_TOKEN === process.env.SECRET_KEY_REFRESH_TOKEN) {
    throw new Error("Access-token and refresh-token secrets must be different");
  }
}

const allowedOrigins = [process.env.FRONTEND_URL, process.env.FRONTEND_URLS]
  .filter(Boolean)
  .flatMap(value => value.split(","))
  .map(origin => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

if (process.env.NODE_ENV === "production" && allowedOrigins.length === 0) {
  throw new Error("FRONTEND_URL must contain the deployed frontend origin in production");
}

app.use(cors({
  credentials: true,
  origin(origin, callback) {
    if (!origin || (process.env.NODE_ENV !== "production" && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin))) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin.replace(/\/$/, ""))) return callback(null, true);
    return callback(new Error("Origin is not allowed by CORS"));
  }
}));

// Connect once per warm function instance; connectDB reuses an active Mongoose connection.
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection unavailable:", error.message);
    res.status(503).json({ success: false, message: "Database temporarily unavailable" });
  }
});

// Razorpay requires the exact raw request body for webhook signature verification.
app.post("/api/v1/payments/razorpay/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);

app.use(express.json());
app.use(cookieParser());
app.use(morgan("combined"));
app.use(helmet({ crossOriginResourcePolicy: false }));

app.get("/", (req, res) => res.json({ message: "Server is running" }));
app.get("/healthz", (req, res) => {
  const databaseReady = mongoose.connection.readyState === 1;
  return res.status(databaseReady ? 200 : 503).json({
    status: databaseReady ? "ok" : "unavailable",
    database: databaseReady ? "connected" : "disconnected"
  });
});

// Protect the reservation cleanup endpoint; Vercel Cron sends CRON_SECRET as a Bearer token.
app.get("/api/cron/expire-reservations", async (req, res) => {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return res.status(503).json({ success: false, message: "Reservation cleanup scheduler is not configured" });
  if (req.headers.authorization !== `Bearer ${cronSecret}`) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }
  try {
    await expireRazorpayReservations();
    return res.json({ success: true });
  } catch (error) {
    console.error("Payment reservation cleanup failed:", error.message);
    return res.status(500).json({ success: false, message: "Reservation cleanup failed" });
  }
});

app.use("/api/user", userRouter);
app.use("/api/v1", catalogRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/addresses", addressRouter);
app.use("/api/v1/checkout", checkoutRouter);
app.use("/api/v1/orders", ordersRouter);
app.use("/api/v1/admin", adminRouter);
app.use("/api/v1/fulfilment", fulfilmentRouter);
app.use("/api/v1/payments", paymentsRouter);
app.use("/api/v1/support", supportRouter);

export default app;
