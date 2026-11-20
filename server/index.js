import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./config/connectDB.js";
import { expireRazorpayReservations } from "./controllers/payments.controller.js";

dotenv.config();

const PORT = process.env.PORT || 8080;

connectDB().then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

  // Local/long-running server cleanup. Vercel uses the protected cron endpoint in app.js.
  const reservationSweep = setInterval(() => {
    expireRazorpayReservations().catch(error => console.error("Payment reservation cleanup failed:", error.message));
  }, 60 * 1000);
  reservationSweep.unref?.();
}).catch(error => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
