// Backend/routes/customer.js
import { Router } from "express";
import { z } from "zod";
import sanitize from "mongo-sanitize";
import xss from "xss";
import { v4 as uuidv4 } from "uuid";
import Customer from "../models/customer.js";

const router = Router();

// zod schemas
const AddressZ = z.object({
  country: z.string().trim().max(100).optional().default(""),
  addressNo: z.string().trim().max(50).optional().default(""),
  street1: z.string().trim().max(120).optional().default(""),
  street2: z.string().trim().max(120).optional().default(""),
  city: z.string().trim().max(80).optional().default(""),
  district: z.string().trim().max(80).optional().default(""),
  zipCode: z.string().trim().max(20).optional().default(""),
  phone: z.string().trim().max(40).optional().default(""),
  fax: z.string().trim().max(40).optional().default(""),
}).strict();

const CustomerZ = z.object({
  type: z.enum(["Individual", "Business"]).default("Individual"),
  salutation: z.string().trim().max(10).optional().default(""),
  firstName: z.string().trim().min(1, "First Name is required").max(50),
  lastName: z.string().trim().max(50).optional().default(""),
  name: z.string().trim().max(140).optional().default(""),
  company_name: z.string().trim().max(140).optional().default(""),
  customerEmail: z.string().trim().toLowerCase().email("Invalid email"),
  workPhone: z.string().trim().max(40).optional().default(""),
  mobile: z.string().trim().min(7, "Mobile seems too short").max(40),
  receivables: z.number().optional().default(0),
  unused_credits: z.number().optional().default(0),
  billingAddress: AddressZ.optional().default({}),
  shippingAddress: AddressZ.optional().default({}),
}).strict();

// deep scrub strings with xss
const deepScrub = (obj) => {
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj)) return obj.map(deepScrub);
    const out = {};
    for (const k of Object.keys(obj)) out[k] = deepScrub(obj[k]);
    return out;
  }
  return typeof obj === "string" ? xss(obj) : obj;
};

// GET /api/customers
router.get("/", async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;
    const docs = await Customer.find({ tenantId }).lean();
    res.json(docs);
  } catch (e) {
    next(e);
  }
});

// POST /api/customers
router.post("/", async (req, res, next) => {
  try {
    const tenantId = req.user?.tenantId;

    const clean = sanitize(req.body);
    const data = CustomerZ.parse(deepScrub(clean));

    // sequential cus_id per tenant
    const last = await Customer.find({ tenantId }).sort({ createdAt: -1 }).limit(1);
    const lastNum = last.length
      ? parseInt(String(last[0].cus_id || "").replace(/^CUS/, ""), 10) || 0
      : 0;
    const nextCusId = "CUS" + String(lastNum + 1).padStart(7, "0");

    const doc = await Customer.create({
      uid: uuidv4(),
      tenantId,
      cus_id: nextCusId,
      ...data,
    });

    res.status(201).json(doc);
  } catch (e) {
    if (e.code === 11000) {
      e.status = 409;
      e.publicMessage = "Email already exists.";
    } else if (e.name === "ZodError") {
      e.status = 400;
      e.publicMessage = e.errors.map((er) => er.message).join("; ");
    }
    next(e);
  }
});

export default router;
