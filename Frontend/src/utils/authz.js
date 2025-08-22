// src/utils/authz.js
export function hasPerm(user, permissions, perm) {
  if (!user) return false;
  if (user.role === "ADMIN") return true; // optional shortcut
  return Array.isArray(permissions) && permissions.includes(perm);
}
