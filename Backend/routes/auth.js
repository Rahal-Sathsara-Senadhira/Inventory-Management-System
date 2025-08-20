// routes/auth.js
import express from "express";
import User, { ROLES } from "../models/user.js";
import { signUserJWT } from "../auth/jwt.js";
import { requireAuth, requireRole } from "../auth/middleware.js";

const router = express.Router();

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body || {};
  const user = await User.findOne({ email: (email || "").toLowerCase() });
  if (!user) return res.status(400).json({ error: "Invalid credentials" });
  const ok = await user.verifyPassword(password || "");
  if (!ok) return res.status(400).json({ error: "Invalid credentials" });
  if (!user.isActive) return res.status(403).json({ error: "Account disabled" });

  user.lastLoginAt = new Date();
  await user.save();

  const token = signUserJWT(user);
  res.json({ token, user: user.toJSONSafe() });
});

// GET /api/auth/me
router.get("/me", requireAuth, (req, res) => res.json(req.user.toJSONSafe()));

// ADMIN: list users
router.get("/users", requireAuth, requireRole(ROLES.ADMIN), async (_req, res) => {
  const list = await User.find({}, "-passwordHash -resetToken -resetTokenExp").sort({ createdAt: -1 });
  res.json(list);
});

// ADMIN: create user (with temp password)
router.post("/users", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const { name, email, role, password } = req.body || {};
  if (!name || !email || !role || !password) {
    return res.status(400).json({ error: "name, email, role, password required" });
  }
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) return res.status(409).json({ error: "Email already in use" });

  const passwordHash = await User.hashPassword(password);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    role,
    passwordHash,
    mustChangePassword: true,
    invitedBy: req.user._id,
    createdBy: req.user._id,
  });

  res.status(201).json(user.toJSONSafe());
});

// ADMIN: update role / status
router.patch("/users/:id", requireAuth, requireRole(ROLES.ADMIN), async (req, res) => {
  const { role, isActive } = req.body || {};
  const updates = {};
  if (role) {
    if (!Object.values(ROLES).includes(role)) return res.status(400).json({ error: "Invalid role" });
    updates.role = role;
  }
  if (typeof isActive === "boolean") {
    // Prevent self-disable
    if (req.user._id.toString() === req.params.id && isActive === false) {
      return res.status(400).json({ error: "You cannot deactivate your own account." });
    }
    updates.isActive = isActive;
  }

  const updated = await User.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    select: "-passwordHash -resetToken -resetTokenExp",
  });
  if (!updated) return res.status(404).json({ error: "User not found" });
  res.json(updated);
});

// POST /api/auth/change-password (for all users)
router.post("/change-password", requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ error: "New password must be at least 8 characters." });
  }

  if (!req.user.mustChangePassword) {
    const ok = await req.user.verifyPassword(currentPassword || "");
    if (!ok) return res.status(400).json({ error: "Current password invalid" });
  }

  req.user.passwordHash = await User.hashPassword(newPassword);
  req.user.mustChangePassword = false;
  await req.user.save();
  res.json({ ok: true });
});

export default router;
