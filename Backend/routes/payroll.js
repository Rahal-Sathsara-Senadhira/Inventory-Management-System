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

// helper: build inclusive day range from 'YYYY-MM-DD'
function dayRange(from, to) {
  // Treat incoming dates as UTC days; make them inclusive 00:00 → 23:59:59.999
  const start = new Date(`${from}T00:00:00.000Z`);
  const end = new Date(`${to}T23:59:59.999Z`);
  return { start, end };
}

async function computeSummary(fromStr, toStr, onlyUserId) {
  const { start, end } = dayRange(fromStr, toStr);

  const match = {
    clockIn: { $gte: start, $lte: end },
    clockOut: { $ne: null }, // ignore open shifts
  };
  if (onlyUserId) match.userId = onlyUserId;

  // Aggregate total hours per user
  const agg = await TimeEntry.aggregate([
    { $match: match },
    {
      $project: {
        userId: 1,
        hours: {
          $divide: [{ $subtract: ["$clockOut", "$clockIn"] }, 1000 * 60 * 60],
        },
      },
    },
    { $group: { _id: "$userId", totalHours: { $sum: "$hours" } } },
  ]);

  // Join with users and role rates
  const users = await User.find({ _id: { $in: agg.map((x) => x._id) } }, "name email role");
  const rates = await RoleRate.find();
  const rateMap = Object.fromEntries(rates.map(r => [r.role, { rate: r.hourlyRate, currency: r.currency }]));
  const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

  return agg.map((x) => {
    const u = userMap[String(x._id)];
    const rr = rateMap[u?.role] || { rate: 0, currency: "LKR" };
    const hours = Math.round((x.totalHours + Number.EPSILON) * 100) / 100;
    const amount = Math.round((hours * rr.rate + Number.EPSILON) * 100) / 100;
    return {
      userId: x._id,
      name: u?.name,
      email: u?.email,
      role: u?.role,
      totalHours: hours,
      hourlyRate: rr.rate,
      currency: rr.currency,
      amount,
    };
  });
}

// Preview hours & pay (used by your WorkedHours page)
router.post("/run", requireAuth, requireRole(...isAdminOrManager), async (req, res) => {
  const { from, to, userId } = req.body || {};
  if (!from || !to) return res.status(400).json({ error: "from and to required (YYYY-MM-DD)" });
  const summary = await computeSummary(from, to, userId || null);
  res.json(summary);
});

// Create payments from the current summary (Pay / Pay All)
router.post("/pay", requireAuth, requireRole(...isAdminOrManager), async (req, res) => {
  const { from, to, userId, method, reference } = req.body || {};
  if (!from || !to) return res.status(400).json({ error: "from and to required" });

  const summary = await computeSummary(from, to, userId || null);
  const { start, end } = dayRange(from, to);
  const created = [];

  for (const row of summary) {
    try {
      const doc = await PayrollPayment.create({
        employeeId: row.userId,
        periodFrom: start,
        periodTo: end,
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
      if (e && e.code === 11000) continue; // duplicate for same employee+period → skip
      throw e;
    }
  }

  res.status(201).json({ ok: true, count: created.length, payments: created });
});

// List payments (for the table below your summary)
router.get("/payments", requireAuth, requireRole(...isAdminOrManager), async (req, res) => {
  const { from, to, userId } = req.query || {};
  if (!from || !to) return res.status(400).json({ error: "from and to required" });

  const { start, end } = dayRange(from, to);
  const q = { paidAt: { $gte: start, $lte: end } };
  if (userId) q.employeeId = userId;

  const list = await PayrollPayment.find(q)
    .populate("employeeId", "name email role")
    .sort({ paidAt: -1 });

  res.json(list);
});

export default router;
