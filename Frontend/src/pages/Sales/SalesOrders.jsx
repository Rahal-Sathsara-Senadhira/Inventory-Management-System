//SalesOrders.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "";
const fmtMoney = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));

export default function SalesOrders() {
  const { type } = useParams(); // route like /inventory/:type/salesOrders
  const base = type ?? "sales";

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");

  const load = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/sales-orders`);
      if (!res.ok) throw new Error("Failed to fetch sales orders");
      const data = await res.json();
      setOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesText =
        !text ||
        (o.salesOrderNo || "").toLowerCase().includes(text) ||
        (o.referenceNo || "").toLowerCase().includes(text) ||
        (o.customerName || o.customer?.displayName || o.customer?.name || "")
          .toLowerCase()
          .includes(text);
      const matchesStatus = status === "all" || (o.status || "draft") === status;
      return matchesText && matchesStatus;
    });
  }, [orders, q, status]);

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Sales Orders</h1>
        <Link to={`/inventory/${base}/salesOrders/add-salesOrders`}>
          <button className="rounded-md bg-blue-600 px-4 py-2 font-medium text-white shadow hover:bg-blue-700">
            + New
          </button>
        </Link>
      </div>

      {/* Controls */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by Order No, Customer, Reference…"
          className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All statuses</option>
          <option value="draft">Draft</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button
          onClick={load}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          title="Refresh"
        >
          ⟳ Refresh
        </button>
      </div>

      {/* States */}
      {loading && <div className="text-sm text-gray-600">Loading…</div>}
      {!!err && <div className="text-sm text-red-600">{err}</div>}
      {!loading && !err && filtered.length === 0 && (
        <div className="text-sm text-gray-500">No sales orders found.</div>
      )}

      {/* Table */}
      {!loading && !err && filtered.length > 0 && (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-200 text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-600">
                <th className="p-2 border">Order #</th>
                <th className="p-2 border">Customer</th>
                <th className="p-2 border">Date</th>
                <th className="p-2 border">Reference</th>
                <th className="p-2 border">Items</th>
                <th className="p-2 border">Total</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => {
                const customerLabel =
                  o.customerName ||
                  o.customer?.displayName ||
                  o.customer?.name ||
                  "—";
                const date = o.salesOrderDate
                  ? new Date(o.salesOrderDate).toLocaleDateString()
                  : "—";
                const itemCount = Array.isArray(o.items) ? o.items.length : 0;
                const currency = o?.totals?.currency || "$";
                const grand = fmtMoney(o?.totals?.grandTotal ?? 0);
                const statusBadge =
                  (o.status || "draft") === "confirmed"
                    ? "bg-green-100 text-green-700"
                    : (o.status || "draft") === "cancelled"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700";

                return (
                  <tr key={o._id} className="border-t">
                    <td className="p-2 border font-medium">{o.salesOrderNo}</td>
                    <td className="p-2 border">{customerLabel}</td>
                    <td className="p-2 border">{date}</td>
                    <td className="p-2 border">{o.referenceNo || "—"}</td>
                    <td className="p-2 border tabular-nums">{itemCount}</td>
                    <td className="p-2 border tabular-nums">
                      {currency} {grand}
                    </td>
                    <td className="p-2 border">
                      <span className={`rounded px-2 py-1 text-xs ${statusBadge}`}>
                        {o.status || "draft"}
                      </span>
                    </td>
                    <td className="p-2 border">
                      <div className="flex items-center gap-2">
                        <Link to={`/inventory/${base}/salesOrders/${o._id}`}>
                          <button className="rounded-md border px-2 py-1 hover:bg-gray-50">
                            View
                          </button>
                        </Link>
                        {/* Add edit/print/delete as you implement */}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
