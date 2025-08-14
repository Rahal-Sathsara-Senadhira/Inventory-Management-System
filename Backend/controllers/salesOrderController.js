// controllers/salesOrderController.js
import SalesOrder from "../models/salesOrder.js";

/** Map "", null to undefined for ObjectId fields */
const toIdOrUndef = (v) => (v && String(v).trim() ? v : undefined);

/** Strip empty tax ids to avoid CastError */
const sanitizeOrder = (body) => {
  const b = { ...body };

  // top-level id fields
  b.customerId      = toIdOrUndef(b.customerId);
  b.shippingTaxId   = toIdOrUndef(b.shippingTaxId);

  // numbers (ensure numeric)
  const num = (x) => (x === "" || x === null || x === undefined ? undefined : Number(x));
  if (b.shippingCharge !== undefined) b.shippingCharge = num(b.shippingCharge) ?? 0;
  if (b.adjustment     !== undefined) b.adjustment     = num(b.adjustment) ?? 0;
  if (b.roundOff       !== undefined) b.roundOff       = num(b.roundOff) ?? 0;

  // items
  b.items = Array.isArray(b.items) ? b.items.map((it) => ({
    ...it,
    itemId:  toIdOrUndef(it.itemId),
    taxId:   toIdOrUndef(it.taxId),
    quantity: num(it.quantity) ?? 1,
    rate:     num(it.rate) ?? 0,
    discount: num(it.discount) ?? 0
  })) : [];

  // totals (optional)
  if (b.totals && typeof b.totals === "object") {
    const t = b.totals;
    b.totals = {
      ...t,
      subTotal:       num(t.subTotal) ?? 0,
      taxTotal:       num(t.taxTotal) ?? 0,
      shippingCharge: num(t.shippingCharge) ?? 0,
      adjustment:     num(t.adjustment) ?? 0,
      roundOff:       num(t.roundOff) ?? 0,
      grandTotal:     num(t.grandTotal) ?? 0,
      currency:       t.currency || "USD",
    };
  }

  return b;
};

// OPTIONAL: if you want to denormalize customerName on the fly for the UI
const addCustomerName = (doc) => {
  const c = doc?.customerId;
  const name = c?.displayName || c?.name || c?.firstName || c?.lastName || "";
  return { ...doc, customerName: name };
};

// Create a new Sales Order
export const createSalesOrder = async (req, res) => {
  try {
    const clean = sanitizeOrder(req.body);
    const newSalesOrder = new SalesOrder(clean);
    await newSalesOrder.save();
    res.status(201).json(newSalesOrder);
  } catch (error) {
    console.error(error);
    // surface duplicate key nicely
    if (error?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key: " + JSON.stringify(error.keyValue) });
    }
    res.status(500).json({ error: "Failed to create sales order" });
  }
};

// Get a specific Sales Order by ID (POPULATED)
export const getSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const salesOrder = await SalesOrder.findById(id)
      .populate("customerId", "displayName name");
    if (!salesOrder) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    const json = salesOrder.toObject();
    const withName = addCustomerName(json);
    res.status(200).json(withName);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to get sales order" });
  }
};

// List all Sales Orders (POPULATED + SORTED + LEAN)
export const listSalesOrders = async (_req, res) => {
  try {
    const salesOrders = await SalesOrder.find()
      .populate("customerId", "displayName name")
      .sort({ createdAt: -1 })
      .lean();
    const withNames = salesOrders.map(addCustomerName);
    res.status(200).json(withNames);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to list sales orders" });
  }
};

// Update a Sales Order
export const updateSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const clean = sanitizeOrder(req.body);
    const updated = await SalesOrder.findByIdAndUpdate(
      id,
      clean,
      { new: true, runValidators: true }
    ).populate("customerId", "displayName name");
    if (!updated) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    res.status(200).json(addCustomerName(updated.toObject()));
  } catch (error) {
    console.error(error);
    if (error?.code === 11000) {
      return res.status(400).json({ error: "Duplicate key: " + JSON.stringify(error.keyValue) });
    }
    res.status(500).json({ error: "Failed to update sales order" });
  }
};

// Delete a Sales Order by ID
export const deleteSalesOrder = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await SalesOrder.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Sales order not found" });
    }
    res.status(200).json({ message: "Sales order deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete sales order" });
  }
};

// Get the next order number (SO-0001, SO-0002, etc.)
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
