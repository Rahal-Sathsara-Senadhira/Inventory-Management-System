// Backend/middleware/tenant.js
export function attachTenant(req, _res, next) {
  // Prefer header, else env, else "default"
  req.tenantId = req.header("X-Tenant-Id") || process.env.DEFAULT_TENANT_ID || "default";
  next();
}
