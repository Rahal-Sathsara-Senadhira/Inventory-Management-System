// routes/timekeeping.js
import express from "express";
import TimeEntry from "../models/timeEntry.js";
import RoleRate from "../models/roleRate.js";
import User, { ROLES } from "../models/user.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

const router = express.Router();

// Helpers
const asDateOrNull = (v) => (v ? new Date(v) : null);
const isAdminOrManager = [ROLES.ADMIN, ROLES.MANAGER];

// Seed default rates if none exist
async function ensureDefaultRates() {
  const count = await RoleRate.countDocuments();
  if (count > 0) return;
  const defaults = [
    { role: ROLES.ADMIN, hourlyRate: 0, currency: "LKR" },
    { role: ROLES.MANAGER, hourlyRate: 1200, currency: "LKR" },
    { role: ROLES.INVENTORY, hourlyRate: 900, currency: "LKR" },
    { role: ROLES.SALES, hourlyRate: 1000, currency: "LKR" },
  ];
  await RoleRate.insertMany(defaults);
}

// --- Employees list (minimal fields) for managers/admins
router.get(
  "/employees",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (_req, res) => {
    const users = await User.find({ isActive: true }, "name email role").sort({ name: 1 });
    res.json(users);
  }
);

// --- Rates: get (M,A), upsert (A only)
router.get(
  "/rates",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (_req, res) => {
    await ensureDefaultRates();
    const rates = await RoleRate.find().sort({ role: 1 });
    res.json(rates);
  }
);

router.post(
  "/rates",
  requireAuth,
  requireRole(ROLES.ADMIN),
  async (req, res) => {
    const { role, hourlyRate, currency } = req.body || {};
    if (!Object.values(ROLES).includes(role)) return res.status(400).json({ error: "Invalid role" });
    if (typeof hourlyRate !== "number" || hourlyRate < 0) return res.status(400).json({ error: "Invalid hourlyRate" });

    const updated = await RoleRate.findOneAndUpdate(
      { role },
      { role, hourlyRate, currency: currency || "LKR" },
      { new: true, upsert: true }
    );
    res.json(updated);
  }
);

// --- Create time entry (M,A)
router.post(
  "/entries",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (req, res) => {
    const { userId, clockIn, clockOut, note } = req.body || {};
    if (!userId || !clockIn || !clockOut) return res.status(400).json({ error: "userId, clockIn, clockOut required" });

    const inAt = new Date(clockIn);
    const outAt = new Date(clockOut);
    if (!(inAt instanceof Date) || isNaN(inAt)) return res.status(400).json({ error: "Invalid clockIn" });
    if (!(outAt instanceof Date) || isNaN(outAt)) return res.status(400).json({ error: "Invalid clockOut" });
    if (outAt <= inAt) return res.status(400).json({ error: "clockOut must be after clockIn" });

    const existsUser = await User.findById(userId);
    if (!existsUser) return res.status(404).json({ error: "Employee not found" });

    const entry = await TimeEntry.create({
      userId,
      clockIn: inAt,
      clockOut: outAt,
      note: note || "",
      createdBy: req.user._id,
    });

    res.status(201).json(entry);
  }
);

// --- List entries with filters (M,A)
router.get(
  "/entries",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (req, res) => {
    const { from, to, userId } = req.query || {};
    const q = {};
    if (userId) q.userId = userId;
    if (from || to) {
      q.clockIn = {};
      if (from) q.clockIn.$gte = asDateOrNull(from);
      if (to) q.clockIn.$lte = asDateOrNull(to);
    }
    const list = await TimeEntry.find(q).populate("userId", "name email role").sort({ clockIn: -1 });
    res.json(list);
  }
);

// --- Delete entry (M,A)
router.delete(
  "/entries/:id",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (req, res) => {
    const del = await TimeEntry.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ error: "Entry not found" });
    res.json({ ok: true });
  }
);

// --- Summary hours per employee (M,A)
router.get(
  "/summary",
  requireAuth,
  requireRole(...isAdminOrManager),
  async (req, res) => {
    const { from, to } = req.query || {};
    const match = {};
    if (from) match.clockIn = { ...(match.clockIn || {}), $gte: asDateOrNull(from) };
    if (to) match.clockIn = { ...(match.clockIn || {}), $lte: asDateOrNull(to) };

    // Aggregate hours per user
    const rows = await TimeEntry.aggregate([
      { $match: match },
      {
        $project: {
          userId: 1,
          hours: {
            $divide: [{ $subtract: ["$clockOut", "$clockIn"] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: "$userId",
          totalHours: { $sum: "$hours" },
        },
      },
      { $sort: { totalHours: -1 } },
    ]);

    // Attach user info & role rates
    await ensureDefaultRates();
    const users = await User.find({ _id: { $in: rows.map(r => r._id) } }, "name email role");
    const rates = await RoleRate.find();
    const rateMap = Object.fromEntries(rates.map(r => [r.role, { rate: r.hourlyRate, currency: r.currency }]));
    const userMap = Object.fromEntries(users.map(u => [String(u._id), u]));

    const result = rows.map(r => {
      const u = userMap[String(r._id)];
      const rr = rateMap[u?.role] || { rate: 0, currency: "LKR" };
      const hours = Math.round((r.totalHours + Number.EPSILON) * 100) / 100;
      const amount = Math.round((hours * rr.rate + Number.EPSILON) * 100) / 100;
      return {
        userId: r._id,
        name: u?.name,
        email: u?.email,
        role: u?.role,
        totalHours: hours,
        hourlyRate: rr.rate,
        currency: rr.currency,
        amount,
      };
    });

    res.json(result);
  }
);

export default router;
