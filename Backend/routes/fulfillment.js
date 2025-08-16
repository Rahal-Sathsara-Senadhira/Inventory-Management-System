// routes/fulfillment.js
import { Router } from "express";
import mongoose from "mongoose";
import SalesOrder from "../models/salesOrder.js";

const router = Router();

function ymd(date) {
  // returns yyyy-mm-dd from a Date
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

router.get("/", async (req, res) => {
  try {
    const { q = "", fulfillmentStatus = "all", page = 1, limit = 100 } = req.query;

    // Eligibility base: must be commercially confirmed
    const match = { status: "confirmed" };

    // 5-day shipment window (inclusive)
    const today = new Date();
    const fiveDays = new Date(today);
    fiveDays.setDate(fiveDays.getDate() + 5);

    const fromStr = ymd(today);
    const toStr = ymd(fiveDays);

    // Only include orders with expectedShipmentDate in [today .. today+5]
    // expectedShipmentDate is a yyyy-mm-dd string in your model
    match.expectedShipmentDate = { $gte: fromStr, $lte: toStr };

    // Optional UI filter by fulfillmentStatus
    if (fulfillmentStatus && fulfillmentStatus !== "all") {
      match.fulfillmentStatus = fulfillmentStatus;
    }

    // Hide delivered orders after the day ends
    // Keep them visible only if delivered today (deliveredAt >= startOfToday)
    const startToday = startOfToday();
    match.$or = [
      { fulfillmentStatus: { $ne: "delivered" } },
      { deliveredAt: { $gte: startToday } }, // still show delivered today
    ];

    // Search text
    if (q) {
      match.$or = [
        ...(match.$or || []),
        { salesOrderNo: new RegExp(q, "i") },
        { referenceNo: new RegExp(q, "i") },
        { fulfillmentAssignee: new RegExp(q, "i") },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);

    const rows = await SalesOrder.aggregate([
      { $match: match },
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
          expectedShipmentDate: 1, // <-- added for UI verification
          deliveredAt: 1,          // <-- used to hide after day end
          updatedAt: 1,
          createdAt: 1,
          customerName: {
            $ifNull: ["$customer.displayName", { $ifNull: ["$customer.name", ""] }],
          },
        },
      },
    ]);

    const total = await SalesOrder.countDocuments(match);
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
