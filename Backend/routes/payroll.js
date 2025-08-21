// routes/payroll.js
import express from "express";
import { requireAuth, requireRole } from "../auth/middleware.js";
import { ROLES } from "../models/user.js";
import TimeEntry from "../models/timeEntry.js";
import RoleRate from "../models/roleRate.js";
import PayrollPayment from "../models/payrollPayment.js";
import User from "../models/user.js";

const router = express.Router();
const isAdminOrManager = [ROLES.ADMIN, ROLES.MANAGER];

const asDate = (s) => new Date(s);

// Compute hours per user within range
async function computeSummary(from, to, onlyUserId) {
  const match = { clockIn: { $gte: asDate(from) }, clockIn: { $lte: asDate(to) } };
  match.clockIn = { $gte: asDate(from), $lte: asDate(to) };
  if (onlyUserId) match.userId = onlyUserId;

  const agg = await TimeEntry.aggregate([
    { $match: match },
    {
      $project: {
        userId: 1,
        hours: { $divide: [{ $subtract: ["$clockOut", "$clockIn"] }, 1000 * 60 * 60] },
      },
    },
    { $group: { _id: "$userId", totalHours: { $sum: "$hours" } } },
  ]);

  const users = await User.find({ _id: { $in: agg.map(x => x._id) } }, "name email role");
  const rates = await RoleRate.find();
  const rateMap = Object.fromEntries(rates.map(r => [r.role, { rate: r.hourlyRate, currency: r.currency }]));
  const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

  return agg.map(x => {
    const u = userMap[String(x._id)];
    const rr = rateMap[u?.role] || { rate: 0, currency: "LKR" };
    const hours = Math.round((x.totalHours + Number.EPSILON) * 100) / 100;
    const amount = Math.round((hours * rr.rate + Number.EPSILON) * 100) / 100;
    return { userId: x._id, name: u?.name, email: u?.email, role: u?.role, totalHours: hours, hourlyRate: rr.rate, currency: rr.currency, amount };
  });
}

// Preview payroll (no DB writes)
router.post(
  "/run",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (req, res) => {
    const { from, to, userId } = req.body || {};
    if (!from || !to) return res.status(400).json({ error: "from and to required (ISO dates)" });

    const summary = await computeSummary(from, to, userId || null);
    res.json(summary);
  }
);

// Pay and persist
router.post(
  "/pay",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (req, res) => {
    const { from, to, userId, method, reference } = req.body || {};
    if (!from || !to) return res.status(400).json({ error: "from and to required" });

    const summary = await computeSummary(from, to, userId || null);
    const created = [];

    for (const row of summary) {
      try {
        const doc = await PayrollPayment.create({
          employeeId: row.userId,
          periodFrom: asDate(from),
          periodTo: asDate(to),
          totalHours: row.totalHours,
          hourlyRate: row.hourlyRate,
          currency: row.currency,
          grossPay: row.amount,
          status: "PAID",
          paidAt: new Date(),
          method: method || "CASH",
          reference: reference || "",
          createdBy: req.user._id,
        });
        created.push(doc);
      } catch (e) {
        // If duplicate (already paid), skip silently
        if (e && e.code === 11000) continue;
        throw e;
      }
    }

    res.status(201).json({ ok: true, count: created.length, payments: created });
  }
);

// List payments
router.get(
  "/payments",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (req, res) => {
    const { from, to, userId } = req.query || {};
    const q = {};
    if (from || to) {
      q.paidAt = {};
      if (from) q.paidAt.$gte = asDate(from);
      if (to) q.paidAt.$lte = asDate(to);
    }
    if (userId) q.employeeId = userId;

    const list = await PayrollPayment.find(q)
      .populate("employeeId", "name email role")
      .sort({ paidAt: -1 });
    res.json(list);
  }
);

export default router;
