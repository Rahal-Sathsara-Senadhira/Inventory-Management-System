// routes/fulfillmentPackages.js
import { Router } from "express";
import mongoose from "mongoose";
import SalesOrder from "../models/salesOrder.js";

const router = Router();

const UI_PROJECTION = {
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
};

/** utils */
function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfDay(d) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

/**
 * GET /api/fulfillment-packages
 *
 * Safe list endpoint for the Packages board.
 */
router.get("/", async (req, res) => {
  try {
    const {
      q = "",
      status = "all",
      days = 5,
      page = 1,
      limit = 100,
    } = req.query;

    // base eligibility
    const match = { status: "confirmed" };

    // time window
    const start = startOfToday();
    const end = endOfDay(new Date(start));
    end.setDate(end.getDate() + Number(days || 5));

    // expectedShipmentDate can be Date OR string
    match.$or = [
      { expectedShipmentDate: { $gte: start, $lte: end } },
      {
        $expr: {
          $and: [
            { $gte: [{ $toDate: "$expectedShipmentDate" }, start] },
            { $lte: [{ $toDate: "$expectedShipmentDate" }, end] },
          ],
        },
      },
    ];

    // filter out delivered orders unless delivered today
    const startToday = startOfToday();
    const deliveredFilter = {
      $or: [
        { fulfillmentStatus: { $ne: "delivered" } },
        { deliveredAt: { $gte: startToday } },
      ],
    };

    // status filter (fulfillment status)
    if (status && status !== "all") {
      match.fulfillmentStatus = status;
    }

    // pagination
    const pg = Math.max(Number(page) || 1, 1);
    const lim = Math.min(Math.max(Number(limit) || 100, 1), 500);
    const skip = (pg - 1) * lim;

    const pipeline = [
      { $match: match },
      { $match: deliveredFilter },
      { $sort: { updatedAt: -1 } },
      { $skip: skip },
      { $limit: lim },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      ...(q
        ? [
            {
              $match: {
                $or: [
                  { salesOrderNo: new RegExp(q, "i") },
                  { referenceNo: new RegExp(q, "i") },
                  { fulfillmentAssignee: new RegExp(q, "i") },
                  { "customer.displayName": new RegExp(q, "i") },
                  { "customer.name": new RegExp(q, "i") },
                ],
              },
            },
          ]
        : []),
      { $project: UI_PROJECTION },
    ];

    const rows = await SalesOrder.aggregate(pipeline);

    // total count (base criteria only)
    const total = await SalesOrder.countDocuments({
      ...match,
      $or: deliveredFilter.$or,
    });

    res.json({ rows, total });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to list fulfillment packages" });
  }
});

/* ------------------------------------------------------------------ */
/* Mutations (no schema change needed; allow unknown paths)            */
/* ------------------------------------------------------------------ */

const F_STATUS = ["new","picking","packing","ready","shipped","delivered","cancelled"];

/**
 * PATCH /api/fulfillment-packages/:id/status
 * body: { status: "picking" }
 */
router.patch("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const next = String(req.body?.status || "").trim().toLowerCase();
    if (!F_STATUS.includes(next)) {
      return res.status(400).json({ error: `Invalid status: ${req.body?.status}` });
    }

    // read current to create a history event & deliveredAt logic
    const current = await SalesOrder.findById(id).select("fulfillmentStatus deliveredAt").lean();
    if (!current) return res.status(404).json({ error: "Order not found" });

    const prev = current.fulfillmentStatus || "new";

    const $set = {
      fulfillmentStatus: next,
      updatedAt: new Date(),
    };

    // deliveredAt bookkeeping
    if (prev !== "delivered" && next === "delivered") {
      $set.deliveredAt = new Date();
    } else if (prev === "delivered" && next !== "delivered") {
      $set.deliveredAt = null;
    }

    const $push = {
      fulfillmentHistory: {
        at: new Date(),
        event: `${prev} → ${next}`,
      },
    };

    await SalesOrder.updateOne(
      { _id: id },
      { $set, $push },
      { strict: false } // <— allow fields not in schema
    );

    // respond with a shape the UI expects
    const agg = await SalesOrder.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      { $project: UI_PROJECTION },
      { $limit: 1 },
    ]);

    res.json(agg[0] || { _id: id, fulfillmentStatus: next });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update package status" });
  }
});

/**
 * PATCH /api/fulfillment-packages/:id
 * body: { fulfillmentAssignee?, fulfillmentNotes? }
 */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { fulfillmentAssignee, fulfillmentNotes } = req.body || {};
    const $set = { updatedAt: new Date() };
    const events = [];

    if (typeof fulfillmentAssignee === "string") {
      $set.fulfillmentAssignee = fulfillmentAssignee;
      events.push(`assignee → ${fulfillmentAssignee || "—"}`);
    }
    if (typeof fulfillmentNotes === "string") {
      $set.fulfillmentNotes = fulfillmentNotes;
      if (fulfillmentNotes) events.push(`notes updated`);
    }

    const update = { $set };
    if (events.length) {
      update.$push = {
        fulfillmentHistory: { at: new Date(), event: events.join("; ") },
      };
    }

    await SalesOrder.updateOne({ _id: id }, update, { strict: false });

    const agg = await SalesOrder.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: { path: "$customer", preserveNullAndEmptyArrays: true } },
      { $project: UI_PROJECTION },
      { $limit: 1 },
    ]);

    res.json(agg[0] || { _id: id });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to update package details" });
  }
});

export default router;
