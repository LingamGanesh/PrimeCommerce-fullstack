import "dotenv/config";

const [{ default: app }, { default: connectDB }, { expireRazorpayReservations }] = await Promise.all([
  import("./app.js"),
  import("./config/connectDB.js"),
  import("./controllers/payments.controller.js")
]);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  const server = app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));

  const reservationSweep = setInterval(() => {
    expireRazorpayReservations().catch(error => console.error("Payment reservation cleanup failed:", error.message));
  }, 60 * 1000);
  reservationSweep.unref?.();

  const shutdown = (signal) => {
    console.log(\`\${signal} received; shutting down gracefully\`);
    clearInterval(reservationSweep);
    server.close(async () => {
      const mongoose = (await import("mongoose")).default;
      await mongoose.disconnect();
      process.exit(0);
    });
  };
  process.once("SIGINT", () => shutdown("SIGINT"));
  process.once("SIGTERM", () => shutdown("SIGTERM"));
}).catch(error => {
  console.error("Unable to start server:", error);
  process.exitCode = 1;
});
