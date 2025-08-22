// Backend/routes/timekeeping.js
import express from "express";
import TimeEntry from "../models/timeEntry.js";
import RoleRate from "../models/roleRate.js";
import TimeEvent from "../models/timeEvent.js";
import User, { ROLES } from "../models/user.js";
import { requireAuth, requireRole, requirePermission } from "../auth/middleware.js";

const router = express.Router();

const canManagerControl = (targetRole) => [ROLES.INVENTORY, ROLES.SALES].includes(targetRole);

// seed default role rates if empty
async function ensureDefaultRates() {
  const count = await RoleRate.countDocuments();
  if (count > 0) return;
  const defaults = [
    { role: ROLES.ADMIN,     hourlyRate: 0,    currency: "LKR" },
    { role: ROLES.MANAGER,   hourlyRate: 1200, currency: "LKR" },
    { role: ROLES.INVENTORY, hourlyRate: 900,  currency: "LKR" },
    { role: ROLES.SALES,     hourlyRate: 1000, currency: "LKR" },
  ];
  await RoleRate.insertMany(defaults);
}

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  return (Array.isArray(fwd) ? fwd[0] : (fwd || "")).split(",")[0].trim() || req.ip;
}
function clientUA(req) {
  return req.get("user-agent") || "";
}

/* ---------- Presence (who is ON now) ---------- */
router.get(
  "/presence",
  requireAuth,
  requirePermission("timekeeping.view"),
  async (req, res) => {
    const actor = req.user;

    const userQuery =
      actor.role === ROLES.ADMIN
        ? { isActive: true }
        : { isActive: true, role: { $in: [ROLES.INVENTORY, ROLES.SALES] } };

    const users = await User.find(userQuery, "name email role").sort({ name: 1 });
    const ids = users.map((u) => u._id);

    const open = await TimeEntry.find({ userId: { $in: ids }, clockOut: null }, "userId clockIn");
    const openMap = new Map(open.map((e) => [String(e.userId), e]));

    const list = users.map((u) => {
      const e = openMap.get(String(u._id));
      return {
        _id: u._id,
        name: u.name,
        email: u.email,
        role: u.role,
        isOn: !!e,
        lastClockIn: e?.clockIn || null,
        canToggle:
          actor.role === ROLES.ADMIN
            ? true
            : actor.role === ROLES.MANAGER && canManagerControl(u.role) && String(actor._id) !== String(u._id),
      };
    });

    res.json(list);
  }
);

/* ---------- Switch ON/OFF (server timestamps) ---------- */
router.post(
  "/switch",
  requireAuth,
  requirePermission("timekeeping.switch"),
  async (req, res) => {
    const actor = req.user;
    const { userId, on } = req.body || {};
    if (!userId || typeof on !== "boolean") return res.status(400).json({ error: "userId and on (boolean) required" });

    const target = await User.findById(userId);
    if (!target || !target.isActive) return res.status(404).json({ error: "Employee not found" });

    // Manager constraints (admin can control anyone)
    if (actor.role === ROLES.MANAGER) {
      if (!canManagerControl(target.role) || String(actor._id) === String(target._id)) {
        await TimeEvent.create({
          subjectUserId: userId, actorUserId: actor._id, event: on ? "NOOP_ON" : "NOOP_OFF",
          source: "SWITCH", ip: clientIp(req), userAgent: clientUA(req),
          note: "Denied: manager cannot control this user",
        });
        return res.status(403).json({ error: "Managers can only control Inventory/Sales and not themselves." });
      }
    }

    const now = new Date();
    const ip = clientIp(req);
    const ua = clientUA(req);

    if (on) {
      const existing = await TimeEntry.findOne({ userId, clockOut: null });
      if (existing) {
        await TimeEvent.create({
          subjectUserId: userId, actorUserId: actor._id, entryId: existing._id,
          event: "NOOP_ON", source: "SWITCH", ip, userAgent: ua, note: "Already ON",
        });
        return res.json({ ok: true, status: "already-on", entryId: existing._id, clockIn: existing.clockIn });
      }
      const entry = await TimeEntry.create({
        userId, clockIn: now, clockOut: null, source: "SWITCH", openedBy: actor._id,
      });
      await TimeEvent.create({
        subjectUserId: userId, actorUserId: actor._id, entryId: entry._id,
        event: "ON", source: "SWITCH", ip, userAgent: ua,
      });
      return res.status(201).json({ ok: true, status: "on", entryId: entry._id, clockIn: entry.clockIn });
    } else {
      const existing = await TimeEntry.findOne({ userId, clockOut: null });
      if (!existing) {
        await TimeEvent.create({
          subjectUserId: userId, actorUserId: actor._id, event: "NOOP_OFF",
          source: "SWITCH", ip, userAgent: ua, note: "Already OFF",
        });
        return res.json({ ok: true, status: "already-off" });
      }
      existing.clockOut = now;
      existing.closedBy = actor._id;
      await existing.save();
      await TimeEvent.create({
        subjectUserId: userId, actorUserId: actor._id, entryId: existing._id,
        event: "OFF", source: "SWITCH", ip, userAgent: ua,
      });
      return res.json({ ok: true, status: "off", entryId: existing._id, clockOut: existing.clockOut });
    }
  }
);

/* ---------- Rates ---------- */
router.get(
  "/rates",
  requireAuth,
  requirePermission("timekeeping.rates.view"),
  async (_req, res) => {
    await ensureDefaultRates();
    const rates = await RoleRate.find().sort({ role: 1 });
    res.json(rates);
  }
);

router.post(
  "/rates",
  requireAuth,
  requirePermission("timekeeping.rates.edit"),
  async (req, res) => {
    const { role, hourlyRate, currency } = req.body || {};
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) return res.status(400).json({ error: "Invalid role" });
    if (typeof hourlyRate !== "number" || hourlyRate < 0) return res.status(400).json({ error: "Invalid hourlyRate" });

    const updated = await RoleRate.findOneAndUpdate(
      { role },
      { role, hourlyRate, currency: currency || "LKR" },
      { new: true, upsert: true }
    );
    res.json(updated);
  }
);

/* ---------- Audit ---------- */
router.get(
  "/audit",
  requireAuth,
  requirePermission("timekeeping.audit.view"),
  async (req, res) => {
    const { from, to, userId, limit = 200 } = req.query || {};
    const q = {};
    if (userId) q.subjectUserId = userId;
    if (from || to) {
      q.ts = {};
      if (from) q.ts.$gte = new Date(from);
      if (to) q.ts.$lte = new Date(to);
    }
    const list = await TimeEvent.find(q)
      .sort({ ts: -1, _id: -1 })
      .limit(Math.min(Number(limit) || 200, 1000))
      .populate("subjectUserId", "name email role")
      .populate("actorUserId", "name email role");
    res.json(list);
  }
);

router.get(
  "/audit/export",
  requireAuth,
  requirePermission("timekeeping.audit.view"),
  async (req, res) => {
    const { from, to, userId, limit = 5000 } = req.query || {};
    const q = {};
    if (userId) q.subjectUserId = userId;
    if (from || to) {
      q.ts = {};
      if (from) q.ts.$gte = new Date(from);
      if (to) q.ts.$lte = new Date(to);
    }
    const rows = await TimeEvent.find(q)
      .sort({ ts: -1, _id: -1 })
      .limit(Math.min(Number(limit) || 5000, 20000))
      .populate("subjectUserId", "name email role")
      .populate("actorUserId", "name email role");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="time_audit_${Date.now()}.csv"`);

    res.write("ts,event,subjectName,subjectEmail,subjectRole,actorName,actorEmail,actorRole,entryId,ip,userAgent,hash,previousHash,note\n");
    for (const r of rows) {
      const csv = [
        new Date(r.ts).toISOString(),
        r.event,
        JSON.stringify(r.subjectUserId?.name || ""),
        JSON.stringify(r.subjectUserId?.email || ""),
        r.subjectUserId?.role || "",
        JSON.stringify(r.actorUserId?.name || ""),
        JSON.stringify(r.actorUserId?.email || ""),
        r.actorUserId?.role || "",
        r.entryId || "",
        JSON.stringify(r.ip || ""),
        JSON.stringify(r.userAgent || ""),
        r.hash || "",
        r.previousHash || "",
        JSON.stringify(r.note || ""),
      ].join(",") + "\n";
      res.write(csv);
    }
    res.end();
  }
);

/* ---------- Admin-only maintenance ---------- */
router.post(
  "/admin/close-open",
  requireAuth,
  requireRole(ROLES.ADMIN), // keep strict admin here
  async (req, res) => {
    const { userId, note } = req.body || {};
    if (!userId || !note) return res.status(400).json({ error: "userId and note required" });

    const open = await TimeEntry.findOne({ userId, clockOut: null });
    if (!open) return res.json({ ok: true, status: "nothing-open" });

    open.clockOut = new Date();
    open.closedBy = req.user._id;
    await open.save();

    await TimeEvent.create({
      subjectUserId: userId,
      actorUserId: req.user._id,
      entryId: open._id,
      event: "ADMIN_CLOSE",
      source: "SWITCH",
      ip: clientIp(req),
      userAgent: clientUA(req),
      note: note || "Admin close open shift",
    });

    res.json({ ok: true, status: "closed", entryId: open._id });
  }
);

export default router;
