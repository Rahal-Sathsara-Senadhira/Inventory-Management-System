// controllers/itemController.js
import Item from "../models/Item.js";
import { uploadBuffer } from "../config/cloudinary.js";

/* -------------------------- helper coercion utils ------------------------- */

const coerceNumber = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
};

const coerceBoolean = (v) => {
  if (v === undefined || v === null || v === "") return undefined;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") {
    const s = v.trim().toLowerCase();
    if (["true", "1", "yes"].includes(s)) return true;
    if (["false", "0", "no"].includes(s)) return false;
  }
  return undefined;
};

const parseMaybeJSON = (v) => {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "object") return v;
  if (typeof v === "string") {
    try {
      return JSON.parse(v);
    } catch {
      return undefined;
    }
  }
  return undefined;
};

const normalizeDimensions = (raw) => {
  const d = typeof raw === "string" ? parseMaybeJSON(raw) : raw;
  if (!d || typeof d !== "object") return undefined;
  return {
    length: d.length ?? "",
    width: d.width ?? "",
    height: d.height ?? "",
  };
};

const normalizePrices = (raw) => {
  const p = typeof raw === "string" ? parseMaybeJSON(raw) : raw;
  if (!p || typeof p !== "object" || Array.isArray(p)) return undefined;
  const entries = Object.entries(p).map(([k, v]) => [k, coerceNumber(v) ?? 0]);
  return Object.fromEntries(entries);
};

/* --------------------------------- list ---------------------------------- */

export const listItems = async (_req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list items" });
  }
};

/* --------------------------------- create -------------------------------- */

export const createItem = async (req, res) => {
  try {
    const b = req.body;

    // If an image file was uploaded, send to Cloudinary
    let imageUrl = b.imageUrl ?? "";
    if (req.file && req.file.buffer) {
      const up = await uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        `${process.env.CLOUDINARY_FOLDER || "ims"}/items`
      );
      imageUrl = up.secure_url;
    }

    const doc = new Item({
      type: b.type,
      name: b.name,
      sku: b.sku || undefined,
      unit: b.unit,
      returnable: coerceBoolean(b.returnable) ?? true,

      price: coerceNumber(b.price) ?? 0,
      stock: coerceNumber(b.stock) ?? 0,
      weight: coerceNumber(b.weight) ?? 0,

      manufacturer: b.manufacturer ?? "",
      brand: b.brand ?? "",
      upc: b.upc ?? "",
      ean: b.ean ?? "",
      mpn: b.mpn ?? "",
      isbn: b.isbn ?? "",

      taxId: b.taxId || undefined,

      dimensions: normalizeDimensions(b.dimensions),
      prices: normalizePrices(b.prices) ?? {},

      imageUrl,
    });

    await doc.save();
    res.status(201).json(doc);
  } catch (e) {
    console.error(e);
    if (e?.code === 11000 && e?.keyPattern?.sku) {
      return res.status(400).send("SKU already exists");
    }
    res.status(500).send("Failed to create item");
  }
};

/* --------------------------------- getOne -------------------------------- */

export const getItem = async (req, res) => {
  try {
    const it = await Item.findById(req.params.id);
    if (!it) return res.status(404).json({ error: "Item not found" });
    res.json(it);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to fetch item" });
  }
};

/* -------------------------------- search --------------------------------- */

export const searchItems = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (!q) return res.json([]);
    const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const items = await Item.find({ $or: [{ name: rx }, { sku: rx }] })
      .limit(20)
      .lean();
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Search failed" });
  }
};

/* ------------------------------ check SKU -------------------------------- */

export const checkSku = async (req, res) => {
  try {
    const sku = (req.query.sku || "").trim();
    const excludeId = (req.query.excludeId || "").trim();

    if (!sku) return res.json({ exists: false });

    const query = { sku };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }

    const exists = await Item.exists(query);
    res.json({ exists: !!exists });
  } catch (e) {
    console.error(e);
    res.status(500).json({ exists: false });
  }
};

/* --------------------------------- update -------------------------------- */

export const updateItem = async (req, res) => {
  try {
    const id = req.params.id;
    const b = req.body;

    // If SKU provided, ensure unique
    if (b.sku && b.sku.trim()) {
      const taken = await Item.exists({ sku: b.sku.trim(), _id: { $ne: id } });
      if (taken) return res.status(400).json({ error: "SKU already exists" });
    }

    const patch = {
      ...(b.type !== undefined ? { type: b.type } : {}),
      ...(b.name !== undefined ? { name: b.name } : {}),
      ...(b.sku !== undefined ? { sku: b.sku || undefined } : {}),
      ...(b.unit !== undefined ? { unit: b.unit } : {}),
      ...(b.manufacturer !== undefined ? { manufacturer: b.manufacturer } : {}),
      ...(b.brand !== undefined ? { brand: b.brand } : {}),
      ...(b.upc !== undefined ? { upc: b.upc } : {}),
      ...(b.ean !== undefined ? { ean: b.ean } : {}),
      ...(b.mpn !== undefined ? { mpn: b.mpn } : {}),
      ...(b.isbn !== undefined ? { isbn: b.isbn } : {}),
      ...(b.taxId !== undefined ? { taxId: b.taxId || undefined } : {}),
    };

    ["price", "stock", "weight"].forEach((k) => {
      if (b[k] !== undefined) {
        const n = coerceNumber(b[k]);
        if (n !== undefined) patch[k] = n;
      }
    });

    if (b.returnable !== undefined) {
      const bool = coerceBoolean(b.returnable);
      if (bool !== undefined) patch.returnable = bool;
    }

    if (b.dimensions !== undefined) {
      patch.dimensions = normalizeDimensions(b.dimensions);
    }
    if (b.prices !== undefined) {
      patch.prices = normalizePrices(b.prices) ?? {};
    }

    // Image upload if provided
    if (req.file && req.file.buffer) {
      const up = await uploadBuffer(
        req.file.buffer,
        req.file.originalname,
        `${process.env.CLOUDINARY_FOLDER || "ims"}/items`
      );
      patch.imageUrl = up.secure_url;
    } else if (b.imageUrl !== undefined) {
      patch.imageUrl = b.imageUrl; // allow clearing/overwriting via URL
    }

    delete patch._id;

    const it = await Item.findByIdAndUpdate(id, patch, {
      new: true,
      runValidators: true,
    });

    if (!it) return res.status(404).json({ error: "Item not found" });
    res.json(it);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update item" });
  }
};

/* --------------------------------- delete -------------------------------- */

export const deleteItem = async (req, res) => {
  try {
    const it = await Item.findByIdAndDelete(req.params.id);
    if (!it) return res.status(404).json({ error: "Item not found" });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to delete item" });
  }
};
