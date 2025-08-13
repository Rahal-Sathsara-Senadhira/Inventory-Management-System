// routes/taxes.js
import express from "express";
import Tax from "../models/tax.js";

const router = express.Router();

router.get("/", async (_req, res) => {
  try {
    const taxes = await Tax.find({ isActive: true }).sort({ name: 1 });
    res.json(taxes);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load taxes" });
  }
});

// (optional) seed once
router.post("/seed", async (_req, res) => {
  try {
    const count = await Tax.countDocuments();
    if (count > 0) return res.json({ ok: true, message: "Already seeded" });
    await Tax.insertMany([
      { name: "VAT 15%", rate: 15 },
      { name: "GST 5%", rate: 5 },
      { name: "Zero", rate: 0 },
    ]);
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Seed failed" });
  }
});

export default router;
