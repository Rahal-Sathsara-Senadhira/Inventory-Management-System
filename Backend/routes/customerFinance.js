// Backend/routes/customerFinance.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import mongoose from "mongoose";
import SalesOrder from "../models/salesOrder.js";
import Customer from "../models/customer.js";

const router = Router();

const getTenant = (req) =>
  req.user?.tenantId ||
  req.header("x-tenant-id") ||
  process.env.DEFAULT_TENANT_ID ||
  "default";

const rl = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * GET /api/customer-finance/:customerId
 * Returns { byCurrency: { [code]: { receivables } }, totalReceivables, unusedCredits }
 */
router.get("/:customerId", rl, async (req, res, next) => {
  try {
    const tenantId = getTenant(req);
    const { customerId } = req.params;

    if (!mongoose.isValidObjectId(customerId)) {
      return res.status(400).json({ error: "Invalid customerId" });
    }

    // 1) fetch unused credits from customer doc
    const customer = await Customer.findOne(
      { _id: customerId, ...(tenantId ? { tenantId } : {}) },
      { unused_credits: 1 }
    ).lean();

    if (!customer) return res.status(404).json({ error: "Customer not found" });

    // 2) aggregate receivables from sales orders (exclude cancelled)
    const pipeline = [
      { $match: {
          customerId: new mongoose.Types.ObjectId(customerId),
          status: { $ne: "cancelled" },
        }
      },
      { $project: {
          currency: { $ifNull: ["$totals.currency", "USD"] },
          grand: { $toDouble: { $ifNull: ["$totals.grandTotal", 0] } },
          paid: { $toDouble: { $ifNull: ["$amountPaid", 0] } },
        }
      },
      { $addFields: { due: { $max: [ { $subtract: ["$grand", "$paid"] }, 0 ] } } },
      { $group: { _id: "$currency", receivables: { $sum: "$due" } } },
    ];

    const rows = await SalesOrder.aggregate(pipeline).exec();
    const byCurrency = rows.reduce((acc, r) => {
      acc[r._id] = { receivables: r.receivables };
      return acc;
    }, {});
    const totalReceivables = rows.reduce((s, r) => s + r.receivables, 0);

    res.json({
      byCurrency,
      totalReceivables,
      unusedCredits: Number(customer.unused_credits || 0),
    });
  } catch (e) {
    next(e);
  }
});

export default router;
export const customerFinanceRouter = router;
