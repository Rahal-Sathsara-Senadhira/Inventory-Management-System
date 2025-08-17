// Frontend/lib/api.js
const API_BASE = import.meta.env?.VITE_API_BASE || "";

async function http(path, opts = {}) {
  const res = await fetch(API_BASE + path, {
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    credentials: "include",
    ...opts,
  });
  if (!res.ok) {
    let msg = "Request failed";
    try { const j = await res.json(); msg = j?.error || msg; } catch {}
    throw new Error(msg);
  }
  return res.json();
}

/**
 * ✅ New default for the Packages board.
 * Uses /api/fulfillment-packages so status + history persist.
 */
export const FulfillmentAPI = {
  // You can pass { q, status, days, page, limit }
  list: ({ q = "", status = "all", days = 5, page = 1, limit = 100 } = {}) =>
    http(
      `/api/fulfillment-packages?q=${encodeURIComponent(q)}&status=${encodeURIComponent(
        status
      )}&days=${days}&page=${page}&limit=${limit}`
    ),

  setStatus: (mongoId, next) =>
    http(`/api/fulfillment-packages/${mongoId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: next }),
    }),

  patch: (mongoId, payload) =>
    http(`/api/fulfillment-packages/${mongoId}`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

/**
 * 🧩 Keep the old endpoints around just in case other screens rely on them.
 * Nothing else changes here.
 */
export const FulfillmentLegacyAPI = {
  list: ({ q = "", status = "all", page = 1, limit = 100 } = {}) =>
    http(
      `/api/fulfillment?q=${encodeURIComponent(q)}&fulfillmentStatus=${encodeURIComponent(
        status
      )}&page=${page}&limit=${limit}`
    ),

  setStatus: (mongoId, next) =>
    http(`/api/fulfillment/${mongoId}/fulfillment-status`, {
      method: "PATCH",
      body: JSON.stringify({ next }),
    }),

  patch: (mongoId, payload) =>
    http(`/api/fulfillment/${mongoId}/fulfillment`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

/**
 * (Optional) Convenience alias if you already started using this name.
 * It simply forwards to FulfillmentAPI above.
 */
export const FulfillmentPackagesAPI = {
  list: (args) => FulfillmentAPI.list(args),
  setStatus: (id, next) => FulfillmentAPI.setStatus(id, next),
  patch: (id, payload) => FulfillmentAPI.patch(id, payload),
};

// 👉 Base orders (unchanged)
export const SalesOrdersAPI = {
  list: () => http(`/api/sales-orders`),
  setPayment: (id, payload) =>
    http(`/api/sales-orders/${id}/payment`, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
};

// 👉 Reports (unchanged)
export const ReportsAPI = {
  topItems: (limit = 5, periodDays = 90) =>
    http(`/api/reports/top-items?limit=${limit}&periodDays=${periodDays}`),
  salesSummary: (group = "month", periodDays = 180) =>
    http(`/api/reports/sales-summary?group=${group}&periodDays=${periodDays}`),
  productDetails: (periodDays = 30, lowStock = 10) =>
    http(`/api/reports/product-details?periodDays=${periodDays}&lowStock=${lowStock}`),
};
