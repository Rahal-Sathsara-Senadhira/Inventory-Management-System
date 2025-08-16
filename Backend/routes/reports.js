// routes/reports.js
import { Router } from "express";
import mongoose from "mongoose";
import SalesOrder from "../models/salesOrder.js";

const router = Router();

const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - Number(n || 0));
  return d;
};

// GET /api/reports/top-items?limit=5&periodDays=90
router.get("/top-items", async (req, res) => {
  try {
    const limit = Math.min(50, Math.max(1, Number(req.query.limit || 5)));
    const periodDays = Math.max(0, Number(req.query.periodDays || 90));
    const since = daysAgo(periodDays);

    const rows = await SalesOrder.aggregate([
      { $match: {
          $or: [{ fulfillmentStatus: "delivered" }, { status: "delivered" }],
          $or: [{ deliveredAt: { $gte: since } }, { updatedAt: { $gte: since } }]
      }},
      { $unwind: "$items" },
      { $project: {
          itemId: "$items.itemId",
          qty: { $ifNull: ["$items.quantity", 0] },
          rate: { $ifNull: ["$items.rate", 0] },
          discount: { $ifNull: ["$items.discount", 0] },
      }},
      { $addFields: {
          netRate: { $multiply: ["$rate", { $subtract: [1, { $divide: ["$discount", 100] }] }] },
          revenue: { $multiply: ["$qty", { $multiply: ["$rate", { $subtract: [1, { $divide: ["$discount", 100] }] }] }] }
      }},
      { $group: { _id: "$itemId", totalQty: { $sum: "$qty" }, totalRevenue: { $sum: "$revenue" } }},
      { $sort: { totalQty: -1 } },
      { $limit: limit },
      { $lookup: { from: "items", localField: "_id", foreignField: "_id", as: "item" } },
      { $unwind: { path: "$item", preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, itemId: "$_id", name: { $ifNull: ["$item.name", "Unknown"] }, sku: "$item.sku", totalQty: 1, totalRevenue: 1 } }
    ]);

    res.json({ rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load top items" });
  }
});

// GET /api/reports/sales-summary?group=month&periodDays=180
router.get("/sales-summary", async (req, res) => {
  try {
    const group = String(req.query.group || "month").toLowerCase(); // 'day' | 'month'
    const periodDays = Math.max(0, Number(req.query.periodDays || 180));
    const since = daysAgo(periodDays);
    const fmt = group === "day" ? "%Y-%m-%d" : "%Y-%m";

    const rows = await SalesOrder.aggregate([
      { $match: {
          $or: [{ fulfillmentStatus: "delivered" }, { status: "delivered" }],
          $or: [{ deliveredAt: { $gte: since } }, { createdAt: { $gte: since } }]
      }},
      { $addFields: { when: { $ifNull: ["$deliveredAt", "$createdAt"] } } },
      { $group: {
          _id: { $dateToString: { format: fmt, date: "$when" } },
          totalRevenue: { $sum: { $ifNull: ["$totals.grandTotal", 0] } },
          count: { $sum: 1 }
      }},
      { $sort: { _id: 1 } }
    ]);

    res.json({ rows, group });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load sales summary" });
  }
});

// GET /api/reports/product-details?periodDays=30&lowStock=10
router.get("/product-details", async (req, res) => {
  try {
    const periodDays = Math.max(0, Number(req.query.periodDays || 30));
    const lowStock = Math.max(0, Number(req.query.lowStock || 10));
    const since = daysAgo(periodDays);

    // sold quantities per item (delivered window)
    const sold = await SalesOrder.aggregate([
      { $match: {
          $or: [{ fulfillmentStatus: "delivered" }, { status: "delivered" }],
          $or: [{ deliveredAt: { $gte: since } }, { createdAt: { $gte: since } }]
      }},
      { $unwind: "$items" },
      { $group: { _id: "$items.itemId", soldLastPeriod: { $sum: { $ifNull: ["$items.quantity", 0] } } } }
    ]);
    const soldMap = new Map(sold.map(s => [String(s._id), s.soldLastPeriod]));

    // items collection
    const Items = mongoose.connection.collection("items");
    const items = await Items.find({}, { projection: { _id: 1, name: 1, sku: 1, stock: 1 } }).toArray();

    const rows = items.map(it => ({
      itemId: it._id,
      name: it.name || "Unknown",
      sku: it.sku || "",
      stock: Number(it.stock || 0),
      soldLastPeriod: Number(soldMap.get(String(it._id)) || 0),
      lowStock: Number(it.stock || 0) <= lowStock
    }));

    res.json({ rows, periodDays, lowStock });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to load product details" });
  }
});

export default router;
