// Backend/routes/customer.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import sanitize from "mongo-sanitize";
import xss from "xss";
import { v4 as uuidv4 } from "uuid";
import Customer from "../models/customer.js";

const router = Router();

/* --------------------------------- Schemas -------------------------------- */
const AddressZ = z
  .object({
    country: z.string().trim().max(100).optional().default(""),
    addressNo: z.string().trim().max(50).optional().default(""),
    street1: z.string().trim().max(120).optional().default(""),
    street2: z.string().trim().max(120).optional().default(""),
    city: z.string().trim().max(80).optional().default(""),
    district: z.string().trim().max(80).optional().default(""),
    zipCode: z.string().trim().max(20).optional().default(""),
    phone: z.string().trim().max(40).optional().default(""),
    fax: z.string().trim().max(40).optional().default(""),
  })
  .strict();

const CustomerZ = z
  .object({
    type: z.enum(["Individual", "Business"]).default("Individual"),
    salutation: z.string().trim().max(10).optional().default(""),
    firstName: z.string().trim().min(1, "First Name is required").max(50),
    lastName: z.string().trim().max(50).optional().default(""),
    name: z.string().trim().max(140).optional().default(""),
    company_name: z.string().trim().max(140).optional().default(""),
    customerEmail: z.string().trim().toLowerCase().email("Invalid email"),
    workPhone: z.string().trim().max(40).optional().default(""),
    mobile: z.string().trim().min(7, "Mobile seems too short").max(40),
    receivables: z.coerce.number().optional().default(0),
    unused_credits: z.coerce.number().optional().default(0),
    billingAddress: AddressZ.optional().default({}),
    shippingAddress: AddressZ.optional().default({}),
  })
  .strict();

const CustomerUpdateZ = CustomerZ.partial();

/* ------------------------------ Util helpers ------------------------------ */
const deepScrub = (val) => {
  if (typeof val === "string") return xss(val);
  if (!val || typeof val !== "object") return val;
  if (Array.isArray(val)) return val.map(deepScrub);
  const out = {};
  for (const k of Object.keys(val)) out[k] = deepScrub(val[k]);
  return out;
};

const escapeRegExp = (s = "") => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const getTenant = (req) =>
  req.user?.tenantId ||
  req.header("x-tenant-id") ||
  process.env.DEFAULT_TENANT_ID ||
  "default";

const nextCusIdForTenant = async (tenantId) => {
  const filter = tenantId ? { tenantId } : {};
  const [last] = await Customer.find(filter)
    .sort({ createdAt: -1, _id: -1 })
    .limit(1)
    .lean()
    .exec();

  const lastNum = last
    ? parseInt(String(last.cus_id || "").replace(/^CUS/, ""), 10) || 0
    : 0;

  return "CUS" + String(lastNum + 1).padStart(7, "0");
};

const zodMessages = (err) => {
  const list = err?.issues || err?.errors;
  if (Array.isArray(list) && list.length) return list.map((e) => e.message).join("; ");
  return err?.message || "Validation error";
};

/* ----------------------------- Search endpoint ---------------------------- */
const SearchQ = z.object({
  q: z.string().trim().min(1, "Enter at least 1 character").max(64, "Too long"),
});

const searchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

// IMPORTANT: place before "/:id"
router.get("/search", searchLimiter, async (req, res, next) => {
  try {
    const { q } = SearchQ.parse(req.query);
    const tenantId = getTenant(req);
    const baseFilter = tenantId ? { tenantId } : {};

    const tokens = q.split(/\s+/).filter(Boolean).slice(0, 5);
    const regexes = tokens.map((t) => new RegExp(escapeRegExp(t), "i"));

    const filter =
      regexes.length === 0
        ? baseFilter
        : {
            ...baseFilter,
            $and: regexes.map((r) => ({
              $or: [
                { displayName: r },
                { name: r },
                { customerEmail: r },
                { email: r },
                { phone: r },
                { mobile: r },
              ],
            })),
          };

    const docs = await Customer.find(filter)
      .select("_id displayName name customerEmail email phone mobile")
      .sort({ updatedAt: -1, createdAt: -1 })
      .limit(8)
      .maxTimeMS(200)
      .lean()
      .exec();

    res.json(docs);
  } catch (e) {
    if (e?.name === "ZodError") {
      e.status = 400;
      e.publicMessage = zodMessages(e);
    }
    next(e);
  }
});

/* ---------------------------------- CRUD ---------------------------------- */

// GET /api/customers
router.get("/", async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const filter = tenantId ? { tenantId } : {};
    const docs = await Customer.find(filter).lean().exec();
    res.json(docs);
  } catch (e) {
    next(e);
  }
});

// GET /api/customers/:id
router.get("/:id", async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const filter = { _id: req.params.id, ...(tenantId ? { tenantId } : {}) };
    const doc = await Customer.findOne(filter).lean().exec();
    if (!doc) return res.status(404).json({ error: "Customer not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
});

// POST /api/customers
router.post("/", async (req, res, next) => {
  try {
    const tenantId = getTenant(req); // never null now

    // sanitize and STRIP server-managed keys before validating
    const clean = sanitize(req.body);
    const {
      tenantId: _tenantBody,
      uid: _uidBody,
      cus_id: _cusBody,
      _id: _ignoredId,
      createdAt: _cA,
      updatedAt: _uA,
      ...bodyOnly
    } = clean;

    const data = CustomerZ.parse(deepScrub(bodyOnly));

    const cus_id = await nextCusIdForTenant(tenantId);

    const doc = await Customer.create({
      uid: uuidv4(),
      tenantId,
      cus_id,
      ...data,
    });

    res.status(201).json(doc);
  } catch (e) {
    if (e?.code === 11000) {
      e.status = 409;
      e.publicMessage = "A customer with that unique field already exists.";
    } else if (e?.name === "ZodError") {
      e.status = 400;
      e.publicMessage = zodMessages(e);
    }
    next(e);
  }
});

// PATCH /api/customers/:id
router.patch("/:id", async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const filter = { _id: req.params.id, ...(tenantId ? { tenantId } : {}) };

    // sanitize and STRIP server-managed keys before validating
    const clean = sanitize(req.body);
    const {
      tenantId: _tenantBody,
      uid: _uidBody,
      cus_id: _cusBody,
      _id: _ignoredId,
      createdAt: _cA,
      updatedAt: _uA,
      ...bodyOnly
    } = clean;

    const patch = CustomerUpdateZ.parse(deepScrub(bodyOnly));

    const doc = await Customer.findOneAndUpdate(filter, patch, {
      new: true,
      runValidators: true,
    }).lean();

    if (!doc) return res.status(404).json({ error: "Customer not found" });
    res.json(doc);
  } catch (e) {
    if (e?.name === "ZodError") {
      e.status = 400;
      e.publicMessage = zodMessages(e);
    }
    next(e);
  }
});

// DELETE /api/customers/:id
router.delete("/:id", async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const filter = { _id: req.params.id, ...(tenantId ? { tenantId } : {}) };
    const result = await Customer.deleteOne(filter).exec();
    if (result.deletedCount === 0)
      return res.status(404).json({ error: "Customer not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
});

export default router;
// optional named export if you ever want it
export const customersRouter = router;
