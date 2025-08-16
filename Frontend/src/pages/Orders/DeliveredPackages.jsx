// src/pages/Orders/DeliveredPackages.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FulfillmentAPI } from "../../../lib/api.js";

// Tailwind-only helpers
const fmtMoney = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
const fmtDateTime = (ms) => (ms ? new Date(ms).toLocaleString() : "—");

// derive deliveredAt from fulfillmentHistory (server may not project deliveredAt)
function pickDeliveredAt(history = []) {
  let delivered = null;
  for (const h of history) {
    const label = (h?.event || "").toLowerCase();
    if (label.includes("→ delivered") || label.endsWith(" delivered") || label === "delivered") {
      const t = h?.at ? new Date(h.at).getTime() : null;
      if (t && (!delivered || t > delivered)) delivered = t;
    }
  }
  return delivered;
}

// very small CSV export
function exportCSV(filename, rows) {
  const headers = [
    "Order #",
    "Customer",
    "Items",
    "Total",
    "Assignee",
    "Delivered At",
  ];
  const esc = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const body = rows
    .map((r) =>
      [
        r.id,
        r.customer,
        r.items,
        r.total,
        r.assignee || "",
        fmtDateTime(r.deliveredAtMs),
      ]
        .map(esc)
        .join(",")
    )
    .join("\n");
  const csv = headers.join(",") + "\n" + body;
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DeliveredPackages() {
  const { type } = useParams(); // route like /inventory/:type/...
  const base = type ?? "sales";

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [q, setQ] = useState("");
  const [from, setFrom] = useState(""); // yyyy-mm-dd
  const [to, setTo] = useState("");     // yyyy-mm-dd

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setErr("");
    FulfillmentAPI.list({ status: "delivered" })
      .then(({ rows }) => {
        if (!alive) return;
        // Map API → UI shape and compute deliveredAt from history
        const mapped = rows.map((r) => {
          const history = (r.fulfillmentHistory || []).map((h) => ({
            at: h.at ? new Date(h.at).getTime() : null,
            event: h.event,
          }));
          const deliveredAtMs = pickDeliveredAt(history) || (r.updatedAt ? new Date(r.updatedAt).getTime() : null);
          return {
            _id: r._id,
            id: r.salesOrderNo,
            customer: r.customerName || "—",
            items: r.itemsCount || 0,
            total: Number(r.total ?? 0),
            assignee: r.fulfillmentAssignee || "—",
            deliveredAtMs,
            history,
          };
        });
        setRows(mapped);
      })
      .catch((e) => setErr(e?.message || "Failed to load delivered packages"))
      .finally(() => setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    const fromMs = from ? new Date(from + "T00:00:00").getTime() : null;
    const toMs = to ? new Date(to + "T23:59:59").getTime() : null;

    return rows.filter((r) => {
      const matchesText =
        !text ||
        (r.id || "").toLowerCase().includes(text) ||
        (r.customer || "").toLowerCase().includes(text) ||
        (r.assignee || "").toLowerCase().includes(text);

      const d = r.deliveredAtMs || 0;
      const matchesFrom = !fromMs || d >= fromMs;
      const matchesTo = !toMs || d <= toMs;

      return matchesText && matchesFrom && matchesTo;
    });
  }, [rows, q, from, to]);

  const totals = useMemo(() => {
    const count = filtered.length;
    const sum = filtered.reduce((acc, r) => acc + (Number.isFinite(r.total) ? r.total : 0), 0);
    return { count, sum: sum.toFixed(2) };
  }, [filtered]);

  return (
    <div className="mx-auto max-w-6xl p-4 overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Delivered Packages</h1>
        <div className="flex gap-2">
          <Link to={`/inventory/${base}/packages`}>
            <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50">← Back to Packages</button>
          </Link>
          <button
            onClick={() => exportCSV(`delivered_packages_${Date.now()}.csv`, filtered)}
            className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            ⤓ Export CSV
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-4 grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="relative">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">🔎</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by order, customer, assignee…"
            className="w-full rounded-md border border-gray-300 bg-white px-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">From</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs text-gray-500">To</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { setFrom(""); setTo(""); }}
            className="h-[38px] w-full rounded-md border border-gray-300 bg-white px-3 text-sm hover:bg-gray-50"
          >
            Reset Filters
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">Delivered Orders</div>
          <div className="text-lg font-semibold">{totals.count}</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">Total Value (sum)</div>
          <div className="text-lg font-semibold">${totals.sum}</div>
        </div>
        <div className="rounded-xl border bg-white p-3">
          <div className="text-xs text-gray-500">Search</div>
          <div className="text-sm text-gray-700 truncate">
            {q ? `"${q}"` : "—"}
          </div>
        </div>
      </div>

      {/* Data states */}
      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {!!err && <div className="text-sm text-red-600">{err}</div>}
      {!loading && !err && filtered.length === 0 && (
        <div className="text-sm text-gray-500">No delivered packages found.</div>
      )}

      {/* Table */}
      {!loading && !err && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="border p-2">Order #</th>
                <th className="border p-2">Customer</th>
                <th className="border p-2">Items</th>
                <th className="border p-2">Total</th>
                <th className="border p-2">Assignee</th>
                <th className="border p-2">Delivered At</th>
                <th className="border p-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r._id} className="border-t">
                  <td className="border p-2 font-medium">{r.id}</td>
                  <td className="border p-2">{r.customer}</td>
                  <td className="border p-2 tabular-nums">{r.items}</td>
                  <td className="border p-2 tabular-nums">${fmtMoney(r.total)}</td>
                  <td className="border p-2">{r.assignee || "—"}</td>
                  <td className="border p-2">{fmtDateTime(r.deliveredAtMs)}</td>
                  <td className="border p-2">
                    <div className="flex items-center gap-2">
                      <Link to={`/inventory/${base}/salesOrders/${r._id}`}>
                        <button className="rounded-md border px-2 py-1 hover:bg-gray-50">View</button>
                      </Link>
                      {/* Add print/return/etc. as needed */}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
