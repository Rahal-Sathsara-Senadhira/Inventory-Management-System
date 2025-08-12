// Backend/server.js (ESM, Express 5)
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

// Import routes
import { salesOrdersRouter } from "./routes/salesOrders.js";
import { customersRouter } from "./routes/customer.js";
import { salespersonsRouter } from "./routes/salesPersons.js";

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGODB_URI (or MONGO_URI) in .env");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);

// Security & basics
app.use(helmet());
app.use(compression());
app.use(express.json({ limit: "200kb" }));
app.use(morgan("dev"));

// CORS (credentials + explicit origin). Handles preflight automatically.
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Routes
app.use("/api/sales-orders", salesOrdersRouter);  // Sales Orders Routes
app.use("/api/customers", customersRouter);
app.use("/api/salespersons", salespersonsRouter);

// Health Check
app.get("/health", async (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1; // 1 = connected
  res.json({ ok: true, db: dbOk ? "up" : "down" });
});

// 404 Handler
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error("API Error:", err);
  const status = err.status || 500;
  const msg = err.publicMessage || (status === 500 ? "Internal Server Error" : "Bad Request");
  res.status(status).json({ error: msg });
});

// Start server
let server;
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected");

    server = app.listen(PORT, () =>
      console.log(`✅ API listening on http://localhost:${PORT}`)
    );
  } catch (err) {
    console.error("❌ Failed to start server:", err?.message || err);
    process.exit(1);
  }
})();

// Graceful shutdown
const shutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down...`);
  try {
    if (server) await new Promise((r) => server.close(r));
    await mongoose.connection.close();
    console.log("✅ Clean shutdown");
    process.exit(0);
  } catch (e) {
    console.error("❌ Error during shutdown:", e);
    process.exit(1);
  }
};

["SIGINT", "SIGTERM"].forEach((sig) =>
  process.on(sig, () => shutdown(sig))
);

process.on("unhandledRejection", (e) => {
  console.error("Unhandled Rejection:", e);
});

process.on("uncaughtException", (e) => {
  console.error("Uncaught Exception:", e);
});
