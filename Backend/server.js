// Backend/server.js (ESM, Express 5 safe)
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";

import customersRouter from "./routes/customer.js";

const PORT = process.env.PORT || 5000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";
const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (!MONGO_URI) {
  console.error("❌ Missing MONGODB_URI (or MONGO_URI) in .env");
  process.exit(1);
}

const app = express();

/** Express 5–safe in-place sanitizer (blocks $/.) */
const sanitizeInPlace = (obj) => {
  if (!obj || typeof obj !== "object") return;
  for (const key of Object.keys(obj)) {
    if (key.startsWith("$") || key.includes(".")) { delete obj[key]; continue; }
    const v = obj[key];
    if (v && typeof v === "object") sanitizeInPlace(v);
  }
};

// security & basics
app.use(
  helmet({
    contentSecurityPolicy: false, // keep off in dev (Vite HMR)
    referrerPolicy: { policy: "no-referrer" },
  })
);
app.use(compression());
app.use(express.json({ limit: "100kb" }));
app.use((req, _res, next) => { // sanitize req body/params/query
  try { sanitizeInPlace(req.body); sanitizeInPlace(req.params); sanitizeInPlace(req.query); } catch {}
  next();
});
app.use(morgan("dev"));

// CORS (credentials + explicit origin). This alone handles preflight.
app.use(
  cors({
    origin: FRONTEND_ORIGIN,
    credentials: true,
    methods: ["GET","POST","PUT","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization"],
  })
);
// 🚫 Removed: app.options("*", ...) — breaks on Express 5
// If you want an explicit preflight handler, use one of these instead:
// app.options("/(.*)", cors({ origin: FRONTEND_ORIGIN, credentials: true }));
// app.options(/.*/, cors({ origin: FRONTEND_ORIGIN, credentials: true }));

// rate limit (writes)
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// health
app.get("/health", (_req, res) => res.json({ ok: true }));

// auth/tenant stub
app.use((req, _res, next) => { req.user = { tenantId: "demo-tenant" }; next(); });

// routes (path must start with "/")
app.use("/api/customers", writeLimiter, customersRouter);

// 404
app.use((req, res) => res.status(404).json({ error: "Not found" }));

// centralized error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const msg = err.publicMessage || (status === 500 ? "Internal Server Error" : "Bad Request");
  res.status(status).json({ error: msg });
});

// start
(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Mongo connected");
    app.listen(PORT, () => console.log(`✅ API listening on http://localhost:${PORT}`));
  } catch (err) {
    console.error("❌ Failed to start server:", err?.message || err);
    process.exit(1);
  }
})();
