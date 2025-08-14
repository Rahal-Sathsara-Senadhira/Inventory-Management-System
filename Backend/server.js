//server.js

import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import path from "path";
import multer from "multer"; // <-- Add multer

// Import routes (your existing + new)
import { salesOrdersRouter } from "./routes/salesOrders.js";   // existing in your project
import { customersRouter } from "./routes/customer.js";        // existing
import { salespersonsRouter } from "./routes/salesPersons.js"; // existing
import itemsRouter from "./routes/items.js";
import priceListsRouter from "./routes/priceLists.js";
import taxesRouter from "./routes/taxes.js";

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });  // Specifies the folder where the files will be stored temporarily

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
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

// CORS (support list, comma-separated)
const allowedOrigins = (FRONTEND_ORIGIN || "")
  .split(",")
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
    return cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization"]
}));

// Rate limit example for search endpoints
const searchLimiter = rateLimit({ windowMs: 60_000, max: 120 });
app.use("/api/items/search", searchLimiter);

// Static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads"), {
  maxAge: "1d",
  etag: true
}));

// Routes (Adding multer middleware to the POST request)
app.use("/api/sales-orders", salesOrdersRouter);
app.use("/api/customers", customersRouter);
app.use("/api/salespersons", salespersonsRouter);
app.use("/api/items", upload.single("image"), itemsRouter);  // <-- Add multer here for handling image uploads
app.use("/api/price-lists", priceListsRouter);
app.use("/api/taxes", taxesRouter);

// Health
app.get("/health", (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1;
  res.json({ ok: true, db: dbOk ? "up" : "down" });
});

// 404 & error
app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, _req, res, _next) => {
  console.error("API Error:", err);
  const status = err.status || 500;
  const msg = err.publicMessage || (status === 500 ? "Internal Server Error" : "Bad Request");
  res.status(status).json({ error: msg });
});

// Start
let server;
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected");
    server = app.listen(PORT, () => console.log(`✅ API listening on http://localhost:${PORT}`));
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
["SIGINT","SIGTERM"].forEach((sig) => process.on(sig, () => shutdown(sig)));

process.on("unhandledRejection", (e) => console.error("Unhandled Rejection:", e));
process.on("uncaughtException", (e) => console.error("Uncaught Exception:", e));

export default app;
