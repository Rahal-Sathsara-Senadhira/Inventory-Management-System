// Backend/server.js (ESM, Express 5)
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

// ⬇️ Use a NAMED import to match your routes/customer.js export
// (routes/customer.js should export: export const customersRouter = Router();)
import { customersRouter } from "./routes/customer.js";

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("❌ Missing MONGODB_URI (or MONGO_URI) in .env");
  process.exit(1);
}

const app = express();
app.set("trust proxy", 1);

/** Express 5–safe in-place sanitizer (blocks keys with $ or .), array-aware */
const sanitizeInPlace = (val) => {
  if (!val || typeof val !== "object") return;
  if (Array.isArray(val)) {
    for (const v of val) sanitizeInPlace(v);
    return;
  }
  for (const key of Object.keys(val)) {
    if (key.startsWith("$") || key.includes(".")) {
      delete val[key];
      continue;
    }
    const v = val[key];
    if (v && typeof v === "object") sanitizeInPlace(v);
  }
};

// Security & basics
app.use(
  helmet({
    // Vite HMR + local dev often needs relaxed CSP; keep off in dev
    contentSecurityPolicy: false,
    referrerPolicy: { policy: "no-referrer" },
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(compression());
app.use(express.json({ limit: "200kb" }));
app.use((req, _res, next) => {
  try {
    sanitizeInPlace(req.body);
    sanitizeInPlace(req.params);
    sanitizeInPlace(req.query);
  } catch {}
  next();
});
app.use(morgan("dev"));

// CORS (credentials + explicit origin). Handles preflight automatically.
const corsOptions = {
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
};
app.use(cors(corsOptions));

// Rate limit (writes)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// Health
app.get("/health", async (_req, res) => {
  const dbOk = mongoose.connection.readyState === 1; // 1 = connected
  res.json({ ok: true, db: dbOk ? "up" : "down" });
});

// Auth/tenant stub
app.use((req, _res, next) => {
  // In prod, replace with real auth and set req.user.tenantId accordingly.
  req.user = { tenantId: "demo-tenant" };
  next();
});

// Routes
app.use("/api/customers", writeLimiter, customersRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// Centralized error handler
app.use((err, _req, res, _next) => {
  console.error("API Error:", err);
  const status = err.status || 500;
  const msg =
    err.publicMessage || (status === 500 ? "Internal Server Error" : "Bad Request");
  res.status(status).json({ error: msg });
});

// Start
let server;
(async () => {
  try {
    // Optional: mongoose.set("strictQuery", true);
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
