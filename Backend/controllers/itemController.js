// controllers/itemController.js
import Item from "../models/Item.js";

export const listItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list items" });
  }
};

export const createItem = async (req, res) => {
  try {
    const b = req.body;

    // Ensure dimensions are an object and properly parsed
    let dimensions = {};
    if (typeof b.dimensions === "string") {
      try {
        dimensions = JSON.parse(b.dimensions); // Parse if it's a string
      } catch (e) {
        console.error("Invalid dimensions JSON:", e);
      }
    } else if (b.dimensions) {
      dimensions = b.dimensions; // If already an object, use it
    }

    // Handle prices (ensure it's an object)
    const prices = b.prices && typeof b.prices === 'object' ? b.prices : {};

    // Generate unique item ID (NI-XXXX)
    const itemId = `NI-${Math.floor(1000 + Math.random() * 9000)}`;

    const doc = new Item({
      itemId, // The new unique item ID
      type: b.type,
      name: b.name,
      sku: b.sku || undefined,
      unit: b.unit,
      returnable: b.returnable === true || b.returnable === "true",
      price: b.price ? Number(b.price) : 0,
      stock: b.stock ? Number(b.stock) : 0,
      weight: b.weight ? Number(b.weight) : 0,
      manufacturer: b.manufacturer,
      brand: b.brand,
      upc: b.upc,
      ean: b.ean,
      mpn: b.mpn,
      isbn: b.isbn,
      taxId: b.taxId || undefined,
      dimensions, // Properly saved dimensions
      prices, // Saving prices correctly
      imageUrl: b.imageUrl || "", // <- from Cloudinary
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

export const checkSku = async (req, res) => {
  try {
    const sku = (req.query.sku || "").trim();
    if (!sku) return res.json({ exists: false });
    const exists = await Item.exists({ sku });
    res.json({ exists: !!exists });
  } catch (e) {
    console.error(e);
    res.status(500).json({ exists: false });
  }
};

export const updateItem = async (req, res) => {
  try {
    const patch = { ...req.body };
    ["price", "stock", "weight"].forEach((k) => {
      if (patch[k] !== undefined && patch[k] !== "")
        patch[k] = Number(patch[k]);
    });

    const it = await Item.findByIdAndUpdate(req.params.id, patch, {
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
