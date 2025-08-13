// routes/priceLists.js
import express from "express";
import PriceList from "../models/priceList.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const lists = await PriceList.find({ isActive: true }).sort({ name: 1 });
    res.json(lists);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load price lists" });
  }
});

// (optional) seed once
router.post("/seed", async (_req, res) => {
  try {
    const count = await PriceList.countDocuments();
    if (count > 0) return res.json({ ok: true, message: "Already seeded" });
    await PriceList.insertMany([
      { name: "Standard", currency: "USD" },
      { name: "Wholesale", currency: "USD" },
      { name: "VIP", currency: "USD" },
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Seed failed" });
  }
});

export default router;
