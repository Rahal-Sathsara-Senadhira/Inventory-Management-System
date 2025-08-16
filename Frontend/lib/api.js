// src/lib/api.js
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

export const FulfillmentAPI = {
  list: ({ q = "", status = "all", page = 1, limit = 100 } = {}) =>
    http(`/api/fulfillment?q=${encodeURIComponent(q)}&fulfillmentStatus=${encodeURIComponent(status)}&page=${page}&limit=${limit}`),

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
