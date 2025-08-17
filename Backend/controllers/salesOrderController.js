// Backend/controllers/salesOrderController.js
import mongoose from "mongoose";
import SalesOrder from "../models/salesOrder.js";
import Item from "../models/Item.js";
import { uploadBuffer } from "../config/cloudinary.js";

/* ------------------------------- helpers ------------------------------- */

const parseJSON = (v, fallback) => {
  if (typeof v !== "string") return v ?? fallback;
  try {
    return JSON.parse(v);
  } catch {
    return fallback;
  }
};

const toIdOrUndef = (v) => (v && String(v).trim() ? v : undefined);
const num = (x, d = 0) =>
  x === "" || x === null || x === undefined ? d : Number(x);

const sanitizeOrder = (raw) => {
  const b = { ...raw };
  delete b.filesMeta; // never trust from client

  b.customerId = toIdOrUndef(b.customerId);
  b.shippingTaxId = toIdOrUndef(b.shippingTaxId);

  b.items = parseJSON(b.items, []);
  b.totals = parseJSON(b.totals, {});

  b.shippingCharge = num(b.shippingCharge, 0);
  b.adjustment = num(b.adjustment, 0);
  b.roundOff = num(b.roundOff, 0);

  if (Array.isArray(b.items)) {
    b.items = b.items.map((it) => ({
      ...it,
      itemId: toIdOrUndef(it.itemId),
      taxId: toIdOrUndef(it.taxId),
      quantity: num(it.quantity, 1),
      rate: num(it.rate, 0),
      discount: num(it.discount, 0),
    }));
  } else {
    b.items = [];
  }

  if (b.totals && typeof b.totals === "object") {
    const t = b.totals;
    b.totals = {
      subTotal: num(t.subTotal, 0),
      taxTotal: num(t.taxTotal, 0),
      shippingCharge: num(t.shippingCharge, 0),
      adjustment: num(t.adjustment, 0),
      roundOff: num(t.roundOff, 0),
      grandTotal: num(t.grandTotal, 0),
      currency: t.currency || "USD",
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

// annotate for UI list
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

// diff = newQtyMap - oldQtyMap
const diffQtyMaps = (oldMap, newMap) => {
  const keys = new Set([...oldMap.keys(), ...newMap.keys()]);
  const out = new Map();
  for (const k of keys) {
    const d = (newMap.get(k) || 0) - (oldMap.get(k) || 0);
    if (d !== 0) out.set(k, d);
  }
  return out;
};

// direction: "decrease" | "increase"
const applyStockChange = async (session, qtyMap, direction = "decrease") => {
  for (const [itemId, qty] of qtyMap.entries()) {
    const n = Number(qty || 0);
    if (!Number.isFinite(n) || n <= 0) continue;

    const it = await Item.findById(itemId)
      .session(session)
      .select("name stock");
    if (!it) throw new Error(`Item not found: ${itemId}`);

    const delta = direction === "decrease" ? -n : n;

    if (direction === "decrease" && (it.stock ?? 0) < n) {
      throw new Error(
        `Insufficient stock for "${it.name || itemId}" (have ${
          it.stock ?? 0
        }, need ${n})`
      );
    }

    it.stock = Number(it.stock || 0) + delta;
    await it.save({ session });
  }
};

// quick uid helper for controller-level safety (matches model format)
const genUid = () => `so_${new mongoose.Types.ObjectId().toString()}`;

/* ----------------------- atomic order number helper --------------------- */
/**
 * We allocate SO numbers from a counters collection atomically.
 * Document shape in "counters": { _id: "so", seq: <Number> }
 */
const formatSo = (n) => `SO-${String(n).padStart(4, "0")}`;

async function ensureSoCounterInitialized(session) {
  const counters = mongoose.connection.collection("counters");
  const existing = await counters.findOne({ _id: "so" }, { session });
  if (existing) return;

  // Initialize from current max found (based on createdAt latest)
  let max = 0;
  const last = await SalesOrder.findOne()
    .sort({ createdAt: -1 })
    .limit(1)
    .session(session)
    .select("salesOrderNo");
  if (last?.salesOrderNo) {
    const parts = String(last.salesOrderNo).split("-");
    const n = parseInt(parts[1], 10);
    if (Number.isFinite(n) && n > 0) max = n;
  }
  await counters.updateOne(
    { _id: "so" },
    { $setOnInsert: { seq: max } },
    { upsert: true, session }
  );
}

async function nextSalesOrderNo(session) {
  const counters = mongoose.connection.collection("counters");
  await ensureSoCounterInitialized(session);
  const { value } = await counters.findOneAndUpdate(
    { _id: "so" },
    { $inc: { seq: 1 } },
    { returnDocument: "after", upsert: true, session }
  );
  return formatSo(value.seq);
}

/* -------------------------------- CRUD --------------------------------- */

export const createSalesOrder = async (req, res) => {
  const session = await SalesOrder.startSession();
  session.startTransaction();
  try {
    const clean = sanitizeOrder(req.body);
    const meta = await uploadFilesToCloudinary(req.files, "sales_orders");
    if (meta.length) clean.filesMeta = meta;

    // Ensure a non-null business uid (prevents dup key on uid: null)
    if (!clean.uid) clean.uid = genUid();

    // Prefer atomic server-side number if client did not supply
    if (!clean.salesOrderNo) {
      clean.salesOrderNo = await nextSalesOrderNo(session);
    }

    const trySave = async () => {
      const doc = new SalesOrder(clean);
      await doc.save({ session });
      return doc;
    };

    let newSalesOrder;
    try {
      newSalesOrder = await trySave();
    } catch (e) {
      // In case client provided duplicate number OR a rare race:
      if (e?.code === 11000 && !req.body?.salesOrderNo) {
        clean.salesOrderNo = await nextSalesOrderNo(session);
        // also regenerate uid if that was the conflicting key
        clean.uid = genUid();
        newSalesOrder = await trySave();
      } else {
        throw e;
      }
    }

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
    console.error("[createSalesOrder] error:", error);

    if (error?.code === 11000) {
      return res.status(400).json({
        error: "Duplicate key",
        details: error.keyValue || null,
        message: `Duplicate: ${JSON.stringify(error.keyValue)}`,
      });
    }

    if (error?.name === "ValidationError") {
      const details = Object.entries(error.errors || {})
        .map(([k, v]) => `${k}: ${v.message}`)
        .join("; ");
      return res
        .status(400)
        .json({ error: "ValidationError", message: details });
    }

    return res
      .status(400)
      .json({
        error: "BadRequest",
        message: error.message || "Failed to create sales order",
      });
  }
};

export const getSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const salesOrder = await SalesOrder.findById(id).populate(
      "customerId",
      "displayName name"
    );
    if (!salesOrder)
      return res.status(404).json({ error: "Sales order not found" });
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
    const willBeConfirmed =
      (clean.status || current.status || "draft") === "confirmed";

    if (wasConfirmed || willBeConfirmed) {
      const oldMap = makeQtyMap(current.items || []);
      const newMap = makeQtyMap(clean.items || []);
      const diff = diffQtyMaps(oldMap, newMap);

      const decMap = new Map();
      const incMap = new Map();
      for (const [k, d] of diff.entries()) {
        if (d > 0) decMap.set(k, d);
        else if (d < 0) incMap.set(k, -d);
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
    res
      .status(500)
      .json({ error: error.message || "Failed to update sales order" });
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
    // Return a preview from the atomic counter (does not persist).
    const session = await SalesOrder.startSession();
    session.startTransaction();
    try {
      await ensureSoCounterInitialized(session);
      // Peek current seq without increment (best-effort: read then +1)
      const counters = mongoose.connection.collection("counters");
      const doc = await counters.findOne({ _id: "so" }, { session });
      const next = formatSo((doc?.seq || 0) + 1);
      await session.abortTransaction(); // just peeking
      session.endSession();
      return res.status(200).json({ nextOrderNumber: next });
    } catch {
      await session.abortTransaction();
      session.endSession();
      // Fallback to legacy last-created lookup (non-atomic, preview only)
      const last = await SalesOrder.findOne().sort({ createdAt: -1 }).limit(1);
      if (!last) return res.status(200).json({ nextOrderNumber: "SO-0001" });
      const lastOrderNumber = String(last.salesOrderNo || "");
      const [, numPartRaw] = lastOrderNumber.split("-");
      const n = parseInt(numPartRaw, 10);
      const next = `SO-${String((Number.isFinite(n) ? n : 0) + 1).padStart(
        4,
        "0"
      )}`;
      return res.status(200).json({ nextOrderNumber: next });
    }
  } catch (error) {
    console.error("Error fetching next order number:", error);
    res.status(500).json({ error: "Failed to get next sales order number" });
  }
};

/* ----------------------------- Status APIs ------------------------------ */

const VALID_STATUSES = ["draft", "confirmed", "delivered", "cancelled", "paid"];

export const setSalesOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body || {};
  const next = String(status || "")
    .trim()
    .toLowerCase();

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

    const prev = order.status || "draft";

    // Stock transitions
    if (prev !== "confirmed" && next === "confirmed") {
      const qmap = makeQtyMap(order.items || []);
      await applyStockChange(session, qmap, "decrease");
    } else if (prev === "confirmed" && next === "cancelled") {
      const qmap = makeQtyMap(order.items || []);
      await applyStockChange(session, qmap, "increase");
    }

    const now = new Date();
    const patch = { status: next };
    if (next === "confirmed") patch.confirmedAt = order.confirmedAt ?? now;
    if (next === "delivered") patch.deliveredAt = order.deliveredAt ?? now;
    if (next === "cancelled") patch.cancelledAt = order.cancelledAt ?? now;
    if (next === "paid") patch.paidAt = order.paidAt ?? now;

    const updated = await SalesOrder.findByIdAndUpdate(id, patch, {
      new: true,
      session,
    });
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

/* ---------------------- Payment convenience (legacy) -------------------- */
// still exposed if your UI calls it directly
export const setPaymentStatus = async (req, res) => {
  const { id } = req.params;
  const { paymentStatus, amountPaid, paymentDate } = req.body || {};

  const ALLOWED = ["unpaid", "partially_paid", "paid", "overdue"];
  if (paymentStatus && !ALLOWED.includes(String(paymentStatus))) {
    return res
      .status(400)
      .json({ error: `Invalid paymentStatus: ${paymentStatus}` });
  }

  try {
    const so = await SalesOrder.findById(id);
    if (!so) return res.status(404).json({ error: "Sales order not found" });

    if (amountPaid !== undefined) {
      const nextPaid = Number(amountPaid);
      if (!Number.isFinite(nextPaid) || nextPaid < 0) {
        return res
          .status(400)
          .json({ error: "amountPaid must be a non-negative number" });
      }
      so.amountPaid = nextPaid;
    }

    let next = paymentStatus || so.paymentStatus || "unpaid";
    const grand = Number(so?.totals?.grandTotal ?? 0);
    const paid = Number(so?.amountPaid ?? 0);

    if (!paymentStatus) {
      if (paid <= 0) next = "unpaid";
      else if (paid > 0 && paid < grand) next = "partially_paid";
      else if (paid >= grand) next = "paid";
    }

    if (
      next !== "paid" &&
      so.paymentDueDate &&
      new Date() > new Date(so.paymentDueDate)
    ) {
      next = "overdue";
    }

    so.paymentStatus = next;

    if (paymentDate) {
      const d = new Date(paymentDate);
      if (!isNaN(d.getTime())) so.paymentDate = d;
    } else if (next === "paid" && !so.paymentDate) {
      so.paymentDate = new Date();
    }

    if (so.paymentStatus === "paid") {
      so.status = "paid";
      so.paidAt = so.paidAt || new Date();
    }

    await so.save();
    res.json(so);
  } catch (e) {
    console.error(e);
    res
      .status(500)
      .json({ error: e.message || "Failed to update payment status" });
  }
};

/* --------------------------- Payments CRUD ------------------------------ */

// POST /api/sales-orders/:id/payments
export const addPayment = async (req, res) => {
  const { id } = req.params;
  const {
    amount,
    method = "cash",
    reference = "",
    date,
    note = "",
  } = req.body || {};
  const n = Number(amount);

  if (!Number.isFinite(n) || n <= 0) {
    return res.status(400).json({ error: "amount must be a positive number" });
  }

  try {
    const so = await SalesOrder.findById(id);
    if (!so) return res.status(404).json({ error: "Sales order not found" });
    if ((so.status || "draft") === "cancelled") {
      return res
        .status(400)
        .json({ error: "Cannot add payment to a cancelled order" });
    }

    so.payments.push({
      amount: n,
      method,
      reference,
      date: date ? new Date(date) : new Date(),
      note,
    });

    so.recomputePayments();

    // auto-set main status to 'paid' if fully paid (optional)
    if (so.paymentStatus === "paid") {
      so.status = "paid";
      so.paidAt = so.paidAt || new Date();
    }

    await so.save();
    res.json(so);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to add payment" });
  }
};

// DELETE /api/sales-orders/:id/payments/:paymentId
export const deletePayment = async (req, res) => {
  const { id, paymentId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(paymentId)) {
    return res.status(400).json({ error: "Invalid paymentId" });
  }
  try {
    const so = await SalesOrder.findById(id);
    if (!so) return res.status(404).json({ error: "Sales order not found" });

    const before = so.payments.length;
    so.payments = so.payments.filter(
      (p) => String(p._id) !== String(paymentId)
    );
    if (so.payments.length === before) {
      return res.status(404).json({ error: "Payment not found" });
    }

    so.recomputePayments();
    if (so.paymentStatus !== "paid" && so.status === "paid") {
      so.status = "confirmed"; // or previous status, depending on policy
      so.paidAt = undefined;
    }

    await so.save();
    res.json(so);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to delete payment" });
  }
};

// PATCH /api/sales-orders/:id/payments/:paymentId
export const updatePayment = async (req, res) => {
  const { id, paymentId } = req.params;
  const { amount, method, reference, date, note } = req.body || {};

  try {
    const so = await SalesOrder.findById(id);
    if (!so) return res.status(404).json({ error: "Sales order not found" });

    const p = (so.payments || []).find(
      (x) => String(x._id) === String(paymentId)
    );
    if (!p) return res.status(404).json({ error: "Payment not found" });

    if (amount !== undefined) {
      const n = Number(amount);
      if (!Number.isFinite(n) || n < 0) {
        return res
          .status(400)
          .json({ error: "amount must be a non-negative number" });
      }
      p.amount = n;
    }
    if (method) p.method = method;
    if (reference !== undefined) p.reference = reference;
    if (note !== undefined) p.note = note;
    if (date) {
      const d = new Date(date);
      if (!isNaN(d.getTime())) p.date = d;
    }

    so.recomputePayments();

    if (so.paymentStatus === "paid") {
      so.status = "paid";
      so.paidAt = so.paidAt || new Date();
    } else if (so.status === "paid") {
      so.status = "confirmed"; // or previous
      so.paidAt = undefined;
    }

    await so.save();
    res.json(so);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to update payment" });
  }
};
