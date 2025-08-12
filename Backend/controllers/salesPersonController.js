// Backend/controllers/salespersonController.js
import { z } from "zod";
import sanitize from "mongo-sanitize";
import xss from "xss";
import { v4 as uuidv4 } from "uuid";
import Salesperson from "../models/salesPerson.js";

const deepScrub = (v) => {
  if (typeof v === "string") return xss(v);
  if (!v || typeof v !== "object") return v;
  if (Array.isArray(v)) return v.map(deepScrub);
  const out = {};
  for (const k of Object.keys(v)) out[k] = deepScrub(v[k]);
  return out;
};
const getTenant = (req) => req.user?.tenantId || req.header("x-tenant-id") || null;

const SalespersonZ = z.object({
  name: z.string().trim().min(1, "Name is required"),
  email: z.string().trim().toLowerCase().email().optional().or(z.literal("")).default(""),
  phone: z.string().trim().optional().default(""),
  employeeCode: z.string().trim().optional().default(""),
  commissionRate: z.coerce.number().min(0).max(100).optional().default(0),
  active: z.coerce.boolean().optional().default(true),
  notes: z.string().optional().default(""),
}).strict();

const SalespersonUpdateZ = SalespersonZ.partial();

export const createSalesperson = async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    if (!tenantId) return res.status(400).json({ message: "Missing tenant" });

    const clean = sanitize(req.body);
    const data = SalespersonZ.parse(deepScrub(clean));

    const doc = await Salesperson.create({
      uid: uuidv4(),
      tenantId,
      ...data,
    });
    res.status(201).json(doc);
  } catch (e) {
    if (e?.name === "ZodError") {
      e.status = 400;
      e.publicMessage = e.errors.map((x) => x.message).join("; ");
    } else if (e?.code === 11000) {
      e.status = 409;
      e.publicMessage = "Salesperson with this email already exists.";
    }
    next(e);
  }
};

export const listSalespersons = async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const { q = "", active } = req.query;

    const filter = { ...(tenantId ? { tenantId } : {}) };
    if (active !== undefined) filter.active = active === "true";

    if (q) {
      const r = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: r }, { email: r }, { phone: r }, { employeeCode: r }];
    }

    const rows = await Salesperson.find(filter)
      .sort({ name: 1 })
      .select("_id name email phone employeeCode commissionRate active")
      .lean();

    res.json(rows);
  } catch (e) {
    next(e);
  }
};

export const getSalesperson = async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const filter = { _id: req.params.id, ...(tenantId ? { tenantId } : {}) };
    const doc = await Salesperson.findOne(filter).lean();
    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    next(e);
  }
};

export const updateSalesperson = async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const clean = sanitize(req.body);
    const patch = SalespersonUpdateZ.parse(deepScrub(clean));

    const doc = await Salesperson.findOneAndUpdate(
      { _id: req.params.id, ...(tenantId ? { tenantId } : {}) },
      patch,
      { new: true, runValidators: true }
    ).lean();

    if (!doc) return res.status(404).json({ message: "Not found" });
    res.json(doc);
  } catch (e) {
    if (e?.name === "ZodError") {
      e.status = 400;
      e.publicMessage = e.errors.map((x) => x.message).join("; ");
    }
    next(e);
  }
};

export const deleteSalesperson = async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const result = await Salesperson.deleteOne({ _id: req.params.id, ...(tenantId ? { tenantId } : {}) });
    if (result.deletedCount === 0) return res.status(404).json({ message: "Not found" });
    res.status(204).end();
  } catch (e) {
    next(e);
  }
};
