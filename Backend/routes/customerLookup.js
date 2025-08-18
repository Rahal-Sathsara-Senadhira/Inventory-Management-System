// Backend/routes/customerLookup.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import sanitize from "mongo-sanitize";
import Customer from "../models/customer.js";

const router = Router();

/* ------------------------------ helpers ------------------------------ */
const getTenant = (req) =>
  req.user?.tenantId ||
  req.header("x-tenant-id") ||
  process.env.DEFAULT_TENANT_ID ||
  "default";

/* ------------------------------ rate limit ------------------------------ */
const rl = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/customer-lookup/:cus_id
 * Look up a customer by business code (cus_id), scoped by tenant header.
 * Returns the full customer document as JSON or 404 if not found.
 *
 * Example:
 *   GET /api/customer-lookup/CUS0000001
 *   headers: { "x-tenant-id": "default" }
 */
router.get("/:cus_id", rl, async (req, res, next) => {
  try {
    // sanitize user-controlled param
    const cus_id = String(sanitize(req.params.cus_id || "")).trim();
    if (!cus_id) return res.status(400).json({ error: "Missing cus_id" });

    const tenantId = getTenant(req);
    const filter = { cus_id, ...(tenantId ? { tenantId } : {}) };

    const doc = await Customer.findOne(filter).lean().exec();
    if (!doc) return res.status(404).json({ error: "Customer not found" });

    res.json(doc);
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/customer-lookup/:cus_id/forward
 * Resolves cus_id → Mongo _id and issues a 307 redirect to your existing route:
 *   /api/customers/:_id
 * This is handy if some clients still expect the old endpoint shape.
 */
router.get("/:cus_id/forward", rl, async (req, res, next) => {
  try {
    const cus_id = String(sanitize(req.params.cus_id || "")).trim();
    if (!cus_id) return res.status(400).json({ error: "Missing cus_id" });

    const tenantId = getTenant(req);
    const filter = { cus_id, ...(tenantId ? { tenantId } : {}) };

    const doc = await Customer.findOne(filter).select("_id").lean().exec();
    if (!doc) return res.status(404).json({ error: "Customer not found" });

    // Preserve tenant header consumers, but just forward to `_id` endpoint
    res.redirect(307, `/api/customers/${doc._id}`);
  } catch (e) {
    next(e);
  }
});

export default router;
export const customerLookupRouter = router;
