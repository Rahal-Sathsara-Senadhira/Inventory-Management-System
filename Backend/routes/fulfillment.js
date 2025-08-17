// routes/fulfillment.js
import { Router } from "express";
import mongoose from "mongoose";
import SalesOrder from "../models/salesOrder.js";

const router = Router();

function startOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d = new Date()) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

router.get("/", async (req, res) => {
  try {
    const { q = "", fulfillmentStatus = "all", page = 1, limit = 100 } = req.query;

    // Commercial eligibility
    const match = { status: "confirmed" };

    // 5-day shipment window: [today 00:00 .. (today+5) 23:59]
    const today = new Date();
    const end = new Date(today);
    end.setDate(end.getDate() + 5);
    match.expectedShipmentDate = { $gte: startOfDay(today), $lte: endOfDay(end) };

    // Optional fulfillment status
    if (fulfillmentStatus && fulfillmentStatus !== "all") {
      match.fulfillmentStatus = fulfillmentStatus;
    }

    // Keep delivered orders only if deliveredAt is today
    const startToday = startOfDay();
    match.$or = [
      { fulfillmentStatus: { $ne: "delivered" } },
      { deliveredAt: { $gte: startToday } },
    ];

    // Search text — add as AND condition (so we don't negate the delivered filter)
    const andConds = [];
    if (q) {
      andConds.push({
        $or: [
          { salesOrderNo: new RegExp(q, "i") },
          { referenceNo: new RegExp(q, "i") },
          { fulfillmentAssignee: new RegExp(q, "i") },
        ],
      });
    }
    const finalMatch = andConds.length ? { $and: [match, ...andConds] } : match;

    const skip = (Number(page) - 1) * Number(limit);

    const rows = await SalesOrder.aggregate([
      { $match: finalMatch },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: Number(limit) },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          status: 1,
          salesOrderNo: 1,
          referenceNo: 1,
          itemsCount: { $size: { $ifNull: ["$items", []] } },
          total: "$totals.grandTotal",
          fulfillmentStatus: 1,
          fulfillmentAssignee: 1,
          fulfillmentNotes: 1,
          fulfillmentHistory: 1,
          expectedShipmentDate: 1,
          deliveredAt: 1,
          updatedAt: 1,
          createdAt: 1,
          customerName: {
            $ifNull: ["$customer.displayName", { $ifNull: ["$customer.name", ""] }],
          },
        },
      },
    ]);

    const total = await SalesOrder.countDocuments(finalMatch);
    res.json({ rows, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list fulfillment orders" });
  }
});

/**
 * Keep the status endpoints as they were
 */
router.patch("/:id/fulfillment-status", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const { next } = req.body || {};
    const allowed = ['new','picking','packing','ready','shipped','delivered','cancelled'];
    if (!allowed.includes(String(next))) {
      return res.status(400).json({ error: `Invalid fulfillment status: ${next}` });
    }

    const so = await SalesOrder.findById(id);
    if (!so) return res.status(404).json({ error: "Not found" });

    if ((so.status || "draft") !== "confirmed") {
      return res.status(409).json({ error: "Order is not eligible for packaging (must be confirmed)" });
    }

    const prev = so.fulfillmentStatus || "new";
    const now = new Date();

    so.fulfillmentStatus = next;
    so.fulfillmentHistory = [...(so.fulfillmentHistory || []), { at: now, event: `${prev} → ${next}` }];

    if (next === "picking")   so.pickedAt   = so.pickedAt   ?? now;
    if (next === "packing")   so.packedAt   = so.packedAt   ?? now;
    if (next === "ready")     so.readyAt    = so.readyAt    ?? now;
    if (next === "shipped")   so.shippedAt  = so.shippedAt  ?? now;
    if (next === "delivered") so.deliveredAt= so.deliveredAt?? now;

    await so.save();
    res.json(so);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to change fulfillment status" });
  }
});

router.patch("/:id/fulfillment", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const so = await SalesOrder.findById(id);
    if (!so) return res.status(404).json({ error: "Not found" });

    if ((so.status || "draft") !== "confirmed") {
      return res.status(409).json({ error: "Order is not eligible for packaging (must be confirmed)" });
    }

    if ("fulfillmentAssignee" in req.body) so.fulfillmentAssignee = req.body.fulfillmentAssignee;
    if ("fulfillmentNotes" in req.body)    so.fulfillmentNotes    = req.body.fulfillmentNotes;

    await so.save();
    res.json(so);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to update fulfillment info" });
  }
});

export default router;
