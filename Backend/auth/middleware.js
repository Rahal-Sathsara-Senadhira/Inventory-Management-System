// Backend/auth/middleware.js
import jwt from "jsonwebtoken";
import User from "../models/user.js";

/**
 * ---- Your original behavior (unchanged) ----
 */
export async function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || "";
    const token = auth.startsWith("Bearer ") ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Missing token" });

    const payload = jwt.verify(token, process.env.JWT_SECRET); // { sub, role }
    const user = await User.findById(payload.sub);
    if (!user || !user.isActive) return res.status(401).json({ error: "Invalid user" });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Unauthorized" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

/**
 * ---- Optional permission layer (additive) ----
 * Use these when you want more granular checks than role lists.
 */

export const PERMISSIONS = {
  // Users
  "users.view":   ["ADMIN"],
  "users.manage": ["ADMIN"],

  // Items
  "items.view":   ["ADMIN", "MANAGER", "INVENTORY", "SALES"],
  "items.edit":   ["ADMIN", "MANAGER", "INVENTORY"],

  // Customers / Sales
  "customers.view": ["ADMIN", "MANAGER", "SALES"],
  "sales.create":   ["ADMIN", "MANAGER", "SALES"],
  "sales.view":     ["ADMIN", "MANAGER", "SALES"],

  // Timekeeping
  "timekeeping.view":       ["ADMIN", "MANAGER"],
  "timekeeping.switch":     ["ADMIN", "MANAGER"], // server still enforces who managers can toggle
  "timekeeping.audit.view": ["ADMIN", "MANAGER"],
  "timekeeping.rates.view": ["ADMIN", "MANAGER"],
  "timekeeping.rates.edit": ["ADMIN"],

  // Payroll
  "payroll.run": ["ADMIN", "MANAGER"],
  "payroll.pay": ["ADMIN", "MANAGER"],

  // Reports
  "reports.view": ["ADMIN", "MANAGER"],
};

export function roleHasPermission(role, perm) {
  const allowed = PERMISSIONS[perm] || [];
  return allowed.includes(role);
}

export function requirePermission(...perms) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const ok = perms.some((p) => roleHasPermission(req.user.role, p));
    if (!ok) return res.status(403).json({ error: "Forbidden" });
    next();
  };
}

export function permissionsForRole(role) {
  return Object.keys(PERMISSIONS).filter((p) => roleHasPermission(role, p));
}

/** Allow acting on self OR if role is in list (handy for profile routes) */
export function requireSelfOrRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: "Unauthorized" });
    const isSelf =
      (req.params.id && String(req.params.id) === String(req.user._id)) ||
      (req.body?.userId && String(req.body.userId) === String(req.user._id));
    if (isSelf) return next();
    if (roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: "Forbidden" });
  };
}
