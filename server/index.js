import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import helmet from "helmet";
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
const configuredOrigins = (process.env.FRONTEND_URL || "http://localhost:5173,http://localhost:5174")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  credentials: true,
  origin(origin, callback) {
    // Requests from tools such as curl/Postman may not send an Origin header.
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");
    const isConfiguredOrigin = configuredOrigins.includes(normalizedOrigin);
    const isLocalDevelopmentOrigin = /^https?:\/\/(localhost|127\.0\.0\.1):\d+$/.test(normalizedOrigin);

    if (isConfiguredOrigin || isLocalDevelopmentOrigin) {
      return callback(null, true);
    }

    return callback(new Error(`CORS blocked request from origin: ${origin}`));
  },
};

app.use(cors(corsOptions));
app.post("/api/v1/payments/razorpay/webhook", express.raw({ type: "application/json" }), handleRazorpayWebhook);
app.use(express.json());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(helmet({ crossOriginResourcePolicy: false }));
app.get("/", (req, res) => res.json({ message: "Server is running" }));
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

const PORT = process.env.PORT || 8080;
connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  const reservationSweep = setInterval(() => {
    expireRazorpayReservations().catch(error => console.error("Payment reservation cleanup failed:", error.message));
  }, 60 * 1000);
  reservationSweep.unref?.();
});