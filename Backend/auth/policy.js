// Backend/auth/policy.js
import { ROLES } from "../models/user.js";

/**
 * List of permissions and which roles have them.
 * Keep these short, stable strings — you'll use them on routes & (optionally) in the UI.
 */
export const PERMISSIONS = {
  // User management
  "users.view":   [ROLES.ADMIN],
  "users.manage": [ROLES.ADMIN], // create/update/deactivate

  // Items
  "items.view":   [ROLES.ADMIN, ROLES.MANAGER, ROLES.INVENTORY, ROLES.SALES],
  "items.edit":   [ROLES.ADMIN, ROLES.MANAGER, ROLES.INVENTORY],

  // Customers / Sales
  "customers.view": [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES],
  "sales.create":   [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES],
  "sales.view":     [ROLES.ADMIN, ROLES.MANAGER, ROLES.SALES],

  // Timekeeping
  "timekeeping.view":       [ROLES.ADMIN, ROLES.MANAGER],
  "timekeeping.switch":     [ROLES.ADMIN, ROLES.MANAGER], // server enforces who a manager can toggle
  "timekeeping.audit.view": [ROLES.ADMIN, ROLES.MANAGER],
  "timekeeping.rates.view": [ROLES.ADMIN, ROLES.MANAGER],
  "timekeeping.rates.edit": [ROLES.ADMIN],

  // Payroll
  "payroll.run": [ROLES.ADMIN, ROLES.MANAGER],
  "payroll.pay": [ROLES.ADMIN, ROLES.MANAGER],

  // Reports
  "reports.view": [ROLES.ADMIN, ROLES.MANAGER],
};

/** true if a role has a specific permission */
export function roleHas(role, perm) {
  const allowed = PERMISSIONS[perm] || [];
  return allowed.includes(role);
}

/** get all permissions for a role (useful for /auth/me) */
export function permsForRole(role) {
  return Object.keys(PERMISSIONS).filter((p) => roleHas(role, p));
}
