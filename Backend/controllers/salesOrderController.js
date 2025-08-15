// controllers/salesOrderController.js
import SalesOrder from "../models/salesOrder.js";
import Item from "../models/Item.js";
import { uploadBuffer } from "../config/cloudinary.js";

/* ------------------------------- helpers ------------------------------- */

const parseJSON = (v, fallback) => {
  if (typeof v !== "string") return v ?? fallback;
  try { return JSON.parse(v); } catch { return fallback; }
};

const toIdOrUndef = (v) => (v && String(v).trim() ? v : undefined);
const num = (x, d = 0) =>
  x === "" || x === null || x === undefined ? d : Number(x);

const sanitizeOrder = (raw) => {
  const b = { ...raw };
  delete b.filesMeta; // never trust from client

  b.customerId    = toIdOrUndef(b.customerId);
  b.shippingTaxId = toIdOrUndef(b.shippingTaxId);

  b.items  = parseJSON(b.items,  []);
  b.totals = parseJSON(b.totals, {});

  b.shippingCharge = num(b.shippingCharge, 0);
  b.adjustment     = num(b.adjustment, 0);
  b.roundOff       = num(b.roundOff, 0);

  if (Array.isArray(b.items)) {
    b.items = b.items.map((it) => ({
      ...it,
      itemId:  toIdOrUndef(it.itemId),
      taxId:   toIdOrUndef(it.taxId),
      quantity: num(it.quantity, 1),
      rate:     num(it.rate, 0),
      discount: num(it.discount, 0),
    }));
  } else {
    b.items = [];
  }

  if (b.totals && typeof b.totals === "object") {
    const t = b.totals;
    b.totals = {
      subTotal:       num(t.subTotal, 0),
      taxTotal:       num(t.taxTotal, 0),
      shippingCharge: num(t.shippingCharge, 0),
      adjustment:     num(t.adjustment, 0),
      roundOff:       num(t.roundOff, 0),
      grandTotal:     num(t.grandTotal, 0),
      currency:       t.currency || "USD",
    };
  }

  return b;
};

const uploadFilesToCloudinary = async (files, folder) => {
  const upFolder = `${process.env.CLOUDINARY_FOLDER || "ims"}/${folder}`;
  const results = await Promise.all(
    (files || []).map(async (f) => {
      const r = await uploadBuffer(f.buffer, f.originalname, upFolder);
      return {
        name: f.originalname,
        size: f.size,
        type: f.mimetype,
        url: r.secure_url,
        publicId: r.public_id,
      };
    })
  );
  return results;
};

// OPTIONAL: annotate for UI table
const addCustomerName = (doc) => {
  const c = doc?.customerId;
  const name = c?.displayName || c?.name || c?.firstName || c?.lastName || "";
  return { ...doc, customerName: name };
};

/* ----------------------------- stock helpers ---------------------------- */

const makeQtyMap = (items = []) => {
  const m = new Map();
  for (const it of items) {
    if (!it || !it.itemId) continue;
    const key = String(it.itemId);
    const q = Number(it.quantity || 0);
    if (!Number.isFinite(q) || q <= 0) continue;
    m.set(key, (m.get(key) || 0) + q);
  }
  return m;
};

// diff = newQtyMap - oldQtyMap (positive => need extra decrease, negative => need to increase back)
const diffQtyMaps = (oldMap, newMap) => {
  const keys = new Set([...oldMap.keys(), ...newMap.keys()]);
  const out = new Map();
  for (const k of keys) {
    const d = (newMap.get(k) || 0) - (oldMap.get(k) || 0);
    if (d !== 0) out.set(k, d);
  }
  return out;
};

// direction: "decrease" (subtract stock) or "increase" (add back)
const applyStockChange = async (session, qtyMap, direction = "decrease") => {
  for (const [itemId, qty] of qtyMap.entries()) {
    const n = Number(qty || 0);
    if (!Number.isFinite(n) || n <= 0) continue;

    const it = await Item.findById(itemId).session(session).select("name stock");
    if (!it) throw new Error(`Item not found: ${itemId}`);

    const delta = direction === "decrease" ? -n : n;

    if (direction === "decrease" && (it.stock ?? 0) < n) {
      throw new Error(
        `Insufficient stock for "${it.name || itemId}" (have ${it.stock ?? 0}, need ${n})`
      );
    }

    it.stock = Number(it.stock || 0) + delta;
    await it.save({ session });
  }
};

/* -------------------------------- CRUD --------------------------------- */

export const createSalesOrder = async (req, res) => {
  const session = await SalesOrder.startSession();
  session.startTransaction();
  try {
    const clean = sanitizeOrder(req.body);
    const meta = await uploadFilesToCloudinary(req.files, "sales_orders");
    if (meta.length) clean.filesMeta = meta;

    const newSalesOrder = new SalesOrder(clean);
    await newSalesOrder.save({ session });

    // Reduce stock only if created as confirmed
    if ((clean.status || "draft") === "confirmed") {
      const qmap = makeQtyMap(clean.items);
      await applyStockChange(session, qmap, "decrease");
    }

    await session.commitTransaction();
    session.endSession();
    res.status(201).json(newSalesOrder);
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    if (error?.code === 11000) {
      return res
        .status(400)
        .json({ error: "Duplicate key: " + JSON.stringify(error.keyValue) });
    }
    res.status(500).json({ error: error.message || "Failed to create sales order" });
  }
};

export const getSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const salesOrder = await SalesOrder.findById(id)
      .populate("customerId", "displayName name");
    if (!salesOrder) return res.status(404).json({ error: "Sales order not found" });
    const json = salesOrder.toObject();
    res.status(200).json(addCustomerName(json));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get sales order" });
  }
};

export const listSalesOrders = async (_req, res) => {
  try {
    const salesOrders = await SalesOrder.find()
      .populate("customerId", "displayName name")
      .sort({ createdAt: -1 })
      .lean();
    res.status(200).json(salesOrders.map(addCustomerName));
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to list sales orders" });
  }
};

export const updateSalesOrder = async (req, res) => {
  const { id } = req.params;
  const session = await SalesOrder.startSession();
  session.startTransaction();
  try {
    const clean = sanitizeOrder(req.body);
    const meta = await uploadFilesToCloudinary(req.files, "sales_orders");

    const current = await SalesOrder.findById(id).session(session);
    if (!current) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Sales order not found" });
    }

    // If files uploaded now, append them
    if (meta.length) {
      clean.filesMeta = [...(current.filesMeta || []), ...meta];
    }

    const wasConfirmed = (current.status || "draft") === "confirmed";
    const willBeConfirmed = (clean.status || current.status || "draft") === "confirmed";

    if (wasConfirmed || willBeConfirmed) {
      const oldMap = makeQtyMap(current.items || []);
      const newMap = makeQtyMap(clean.items || []);
      const diff = diffQtyMaps(oldMap, newMap);

      const decMap = new Map();
      const incMap = new Map();
      for (const [k, d] of diff.entries()) {
        if (d > 0) decMap.set(k, d);      // need more stock decrease
        else if (d < 0) incMap.set(k, -d); // give back
      }

      if (decMap.size > 0) await applyStockChange(session, decMap, "decrease");
      if (incMap.size > 0) await applyStockChange(session, incMap, "increase");
    }

    const updated = await SalesOrder.findByIdAndUpdate(id, clean, {
      new: true,
      runValidators: true,
      session,
    }).populate("customerId", "displayName name");

    await session.commitTransaction();
    session.endSession();

    res.status(200).json(addCustomerName(updated.toObject()));
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    if (error?.code === 11000) {
      return res
        .status(400)
        .json({ error: "Duplicate key: " + JSON.stringify(error.keyValue) });
    }
    res.status(500).json({ error: error.message || "Failed to update sales order" });
  }
};

export const deleteSalesOrder = async (req, res) => {
  const { id } = req.params;
  const session = await SalesOrder.startSession();
  session.startTransaction();
  try {
    const order = await SalesOrder.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Sales order not found" });
    }

    // If it was confirmed, we add stock back on delete
    if ((order.status || "draft") === "confirmed") {
      const qmap = makeQtyMap(order.items || []);
      await applyStockChange(session, qmap, "increase");
    }

    await SalesOrder.deleteOne({ _id: id }).session(session);
    await session.commitTransaction();
    session.endSession();

    res.status(200).json({ message: "Sales order deleted successfully" });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ error: "Failed to delete sales order" });
  }
};

export const getNextOrderNumber = async (_req, res) => {
  try {
    const last = await SalesOrder.findOne().sort({ createdAt: -1 }).limit(1);
    if (!last) return res.status(200).json({ nextOrderNumber: "SO-0001" });

    const lastOrderNumber = String(last.salesOrderNo || "");
    const [, numPartRaw] = lastOrderNumber.split("-");
    const n = parseInt(numPartRaw, 10);
    if (!Number.isFinite(n)) {
      return res.status(400).json({ error: "Invalid order number format" });
    }
    const next = `SO-${String(n + 1).padStart(4, "0")}`;
    res.status(200).json({ nextOrderNumber: next });
  } catch (error) {
    console.error("Error fetching next order number:", error);
    res.status(500).json({ error: "Failed to get next sales order number" });
  }
};

const VALID_STATUSES = ['draft', 'confirmed', 'delivered', 'cancelled'];

export const setSalesOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const next = String(status || '').trim().toLowerCase();

  if (!VALID_STATUSES.includes(next)) {
    return res.status(400).json({ error: `Invalid status: ${status}` });
  }

  const session = await SalesOrder.startSession();
  session.startTransaction();

  try {
    const order = await SalesOrder.findById(id).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ error: "Sales order not found" });
    }

    const prev = order.status || 'draft';

    // Stock transitions
    if (prev !== 'confirmed' && next === 'confirmed') {
      // just got confirmed -> decrease
      const qmap = makeQtyMap(order.items || []);
      await applyStockChange(session, qmap, "decrease");
    } else if (prev === 'confirmed' && next === 'cancelled') {
      // was confirmed, now cancelled -> increase back
      const qmap = makeQtyMap(order.items || []);
      await applyStockChange(session, qmap, "increase");
    }
    // confirmed -> delivered : no stock change
    // delivered -> cancelled : typically not allowed—decide policy if you need to handle

    const now = new Date();
    const patch = { status: next };
    if (next === 'confirmed') patch.confirmedAt = order.confirmedAt ?? now;
    if (next === 'delivered') patch.deliveredAt = order.deliveredAt ?? now;
    if (next === 'cancelled') patch.cancelledAt = order.cancelledAt ?? now;

    const updated = await SalesOrder.findByIdAndUpdate(id, patch, { new: true, session });
    await session.commitTransaction();
    session.endSession();

    res.json(updated);
  } catch (e) {
    await session.abortTransaction();
    session.endSession();
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to update status" });
  }
};
