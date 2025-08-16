// routes/fulfillment.js
import { Router } from "express";
import mongoose from "mongoose";
import SalesOrder from "../models/salesOrder.js";

const router = Router();

/**
 * GET /api/fulfillment?q=&fulfillmentStatus=&page=&limit=
 * Returns rows for the Packages board/table
 * ✅ Only includes sales orders whose commercial status is 'confirmed'
 */
router.get("/", async (req, res) => {
  try {
    const { q = "", fulfillmentStatus = "all", page = 1, limit = 100 } = req.query;

    // Base eligibility: ONLY confirmed orders go to packaging
    const match = { status: "confirmed" };

    if (fulfillmentStatus && fulfillmentStatus !== "all") {
      match.fulfillmentStatus = fulfillmentStatus;
    }
    if (q) {
      match.$or = [
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
          status: 1, // <-- keep commercial status so the UI can double-check if needed
          salesOrderNo: 1,
          referenceNo: 1,
          itemsCount: { $size: { $ifNull: ["$items", []] } },
          total: "$totals.grandTotal",
          fulfillmentStatus: 1,
          fulfillmentAssignee: 1,
          fulfillmentNotes: 1,
          fulfillmentHistory: 1,
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
 * PATCH /api/fulfillment/:id/fulfillment-status  body: { next: 'packing' }
 * Updates fulfillmentStatus + appends fulfillmentHistory + marks timestamps
 * ✅ BLOCKS status changes if the order is not commercially 'confirmed'
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

    // ✅ Only confirmed orders can move through fulfillment
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
    if (next === "delivered") so.deliveredAt= so.deliveredAt?? now; // reuse existing field

    await so.save();
    res.json(so);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || "Failed to change fulfillment status" });
  }
});

/**
 * PATCH /api/fulfillment/:id/fulfillment  body: { fulfillmentAssignee?, fulfillmentNotes? }
 * Updates assignee/notes
 * ✅ Still allowed if confirmed; if you also want to block editing when not confirmed, add the same guard.
 */
router.patch("/:id/fulfillment", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ error: "Invalid id" });

    const so = await SalesOrder.findById(id);
    if (!so) return res.status(404).json({ error: "Not found" });

    // Optional: also block changes when not confirmed
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
