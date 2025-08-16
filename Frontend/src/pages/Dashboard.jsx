// src/pages/Dashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { assets } from "../assets/assets";
import {
  FaBoxOpen,
  FaShippingFast,
  FaTruckLoading,
  FaFileInvoiceDollar,
  FaChartBar,
  FaTags,
  FaStar,
  FaChartPie,
  FaHandshake,
  FaChartLine,
  FaDollarSign,
  FaBoxes,
} from "react-icons/fa";

// Recharts
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
} from "recharts";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

/* ---------------- utils ---------------- */
const fmtMoney = (n) => (isNaN(Number(n)) ? "0.00" : Number(n).toFixed(2));
const safeStr = (s) => (typeof s === "string" ? s : "");
const startOf = (d) => {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
};
const ymd = (d) => {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  return `${Y}-${M}-${D}`;
};
const ym = (d) => {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  return `${Y}-${M}`;
};
const daysAgo = (n) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
};

/* ---------------- Recharts helpers ---------------- */
const money = (n) => `$${fmtMoney(n)}`;

function SalesBarChart({ data }) {
  // expects [{ key: 'YYYY-MM', value: revenue, count: orders }, ...]
  const rows = (data || []).map((d) => ({
    month: d.key,
    revenue: Number(d.value || 0),
    orders: Number(d.count || 0),
  }));
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <BarChart
          data={rows}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis
            tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v)}
          />
          <Tooltip
            formatter={(val, name) => (name === "Revenue" ? money(val) : val)}
            labelFormatter={(label) => `Month: ${label}`}
          />
          <Legend />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#6366f1"
            radius={[6, 6, 0, 0]}
          >
            <LabelList
              dataKey="revenue"
              formatter={(v) => (v > 0 ? `$${Math.round(v)}` : "")}
              position="top"
              className="text-xs"
            />
          </Bar>
          <Bar
            dataKey="orders"
            name="Orders"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function DeliveriesBarChart({ data }) {
  // expects [{ key: 'YYYY-MM-DD', value: count }, ...]
  const rows = (data || []).map((d) => ({
    day: d.key?.slice(5) || "",
    deliveries: Number(d.value || 0),
  }));
  return (
    <div className="w-full h-40">
      <ResponsiveContainer>
        <BarChart
          data={rows}
          margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" />
          <YAxis allowDecimals={false} />
          <Tooltip labelFormatter={(label) => `Day: ${label}`} />
          <Bar
            dataKey="deliveries"
            name="Deliveries"
            fill="#8b5cf6"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function TopItemsBar({ data }) {
  // expects [{ name, qty, revenue }, ...]
  const rows = (data || []).map((d) => ({
    name: d.name,
    qty: Number(d.qty || 0),
    revenue: Number(d.revenue || 0),
  }));
  return (
    <div className="w-full h-56">
      <ResponsiveContainer>
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 8, right: 16, bottom: 8, left: 8 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" />
          <YAxis type="category" dataKey="name" width={140} />
          <Tooltip
            formatter={(val, name) => (name === "Revenue" ? money(val) : val)}
          />
          <Legend />
          <Bar dataKey="qty" name="Qty" fill="#06b6d4" radius={[0, 6, 6, 0]} />
          <Bar
            dataKey="revenue"
            name="Revenue"
            fill="#f59e0b"
            radius={[0, 6, 6, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ---------------- main ---------------- */
export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/sales-orders`, {
          credentials: "include",
        });
        if (!res.ok) throw new Error("Failed to fetch sales orders");
        const data = await res.json();
        if (!alive) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setErr(e?.message || "Something went wrong");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    return () => {
      alive = false;
    };
  }, []);

  /* ---------- core KPIs ---------- */
  const {
    totals,
    fulfill,
    chart7,
    toBePacked,
    toBeShipped,
    toBeDelivered,
    toBeInvoiced,
  } = useMemo(() => {
    const totals = {
      countAll: 0,
      draft: 0,
      confirmed: 0,
      delivered: 0,
      cancelled: 0,
      sumGrand: 0,
    };
    const fulfill = {
      new: 0,
      picking: 0,
      packing: 0,
      ready: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };
    const byDayDelivered = {};
    const last7 = [];
    for (let i = 6; i >= 0; i--) last7.push(ymd(startOf(daysAgo(i))));

    for (const o of orders) {
      totals.countAll += 1;
      const st = safeStr(o.status || "draft").toLowerCase();
      if (st in totals) totals[st] += 1;
      const grand = Number(o?.totals?.grandTotal ?? 0);
      if (Number.isFinite(grand)) totals.sumGrand += grand;

      const fs = safeStr(o.fulfillmentStatus || "").toLowerCase();
      if (fs && fs in fulfill) fulfill[fs] += 1;

      const deliveredAt = o?.deliveredAt ? new Date(o.deliveredAt) : null;
      if (deliveredAt && !isNaN(deliveredAt.getTime())) {
        const key = ymd(startOf(deliveredAt));
        byDayDelivered[key] = (byDayDelivered[key] || 0) + 1;
      } else {
        const hist = Array.isArray(o.fulfillmentHistory)
          ? o.fulfillmentHistory
          : [];
        for (const h of hist) {
          const label = (h?.event || "").toLowerCase();
          if (label.includes("→ delivered") || label === "delivered") {
            const t = h?.at ? new Date(h.at) : null;
            if (t && !isNaN(t.getTime())) {
              const key = ymd(startOf(t));
              byDayDelivered[key] = (byDayDelivered[key] || 0) + 1;
            }
          }
        }
      }
    }

    const chart7 = last7.map((d) => ({
      key: d,
      value: byDayDelivered[d] || 0,
    }));
    const toBePacked = fulfill.picking + fulfill.new + fulfill.packing;
    const toBeShipped = fulfill.ready;
    const toBeDelivered = fulfill.shipped;
    const toBeInvoiced = fulfill.delivered; // treat delivered as “awaiting invoice”

    return {
      totals,
      fulfill,
      chart7,
      toBePacked,
      toBeShipped,
      toBeDelivered,
      toBeInvoiced,
    };
  }, [orders]);

  /* ---------- analytics for filled cards ---------- */
  const { topItems, salesSeries, productStats, salesKPIs } = useMemo(() => {
    // prefer delivered, else confirmed
    let base = orders.filter(
      (o) =>
        (o.fulfillmentStatus || "").toLowerCase() === "delivered" ||
        (o.status || "").toLowerCase() === "delivered"
    );
    if (base.length === 0) {
      base = orders.filter(
        (o) => (o.status || "").toLowerCase() === "confirmed"
      );
    }

    // Top Selling Items (90d)
    const since90 = daysAgo(90);
    const itemMap = new Map();
    for (const o of base) {
      const when = o.deliveredAt
        ? new Date(o.deliveredAt)
        : new Date(o.updatedAt || o.createdAt);
      if (when && when < since90) continue;
      const items = Array.isArray(o.items) ? o.items : [];
      for (const it of items) {
        const qty = Number(it.quantity || 0);
        if (!Number.isFinite(qty) || qty <= 0) continue;
        const rate = Number(it.rate || 0);
        const disc = Number(it.discount || 0);
        const net = rate * (1 - disc / 100);
        const rev = qty * net;
        const key = String(it.itemId || it.freeText || "unknown");
        const prev = itemMap.get(key) || {
          name:
            it.freeText ||
            (key.startsWith("unknown") ? "Unknown Item" : `#${key.slice(-6)}`),
          qty: 0,
          revenue: 0,
        };
        prev.qty += qty;
        prev.revenue += rev;
        if (!prev.name && it.freeText) prev.name = it.freeText;
        itemMap.set(key, prev);
      }
    }
    const topItems = [...itemMap.values()]
      .sort((a, b) => b.qty - a.qty)
      .slice(0, 5);

    // Sales Report (last 6 months)
    const months = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now);
      d.setMonth(d.getMonth() - i);
      months.push(ym(new Date(d.getFullYear(), d.getMonth(), 1)));
    }
    const monthMap = new Map(
      months.map((k) => [k, { key: k, value: 0, count: 0 }])
    );
    for (const o of base) {
      const when = o.deliveredAt
        ? new Date(o.deliveredAt)
        : new Date(o.updatedAt || o.createdAt);
      if (!when || isNaN(when.getTime())) continue;
      const k = ym(when);
      if (!monthMap.has(k)) continue;
      const gt = Number(o?.totals?.grandTotal ?? 0);
      const row = monthMap.get(k);
      row.value += Number.isFinite(gt) ? gt : 0;
      row.count += 1;
    }
    const salesSeries = [...monthMap.values()];

    // Product Details (computed locally)
    const since30 = daysAgo(30);
    const distinctItemsAll = new Set();
    const distinctItems30 = new Set();
    let qty30 = 0;
    let linesAll = 0;
    for (const o of orders) {
      const items = Array.isArray(o.items) ? o.items : [];
      linesAll += items.length;
      for (const it of items) {
        const key = String(it.itemId || it.freeText || "unknown");
        distinctItemsAll.add(key);
        const when = o.deliveredAt
          ? new Date(o.deliveredAt)
          : new Date(o.updatedAt || o.createdAt);
        if (when && when >= since30) {
          distinctItems30.add(key);
          qty30 += Number(it.quantity || 0) || 0;
        }
      }
    }
    const productStats = {
      distinctAll: distinctItemsAll.size,
      distinct30: distinctItems30.size,
      avgLinesPerOrder: orders.length ? linesAll / orders.length : 0,
      qtySold30: qty30,
    };

    // Sales KPIs
    const customers = new Set(
      orders
        .map((o) =>
          String(o.customerId?._id || o.customerId || o.customerName || "")
        )
        .filter(Boolean)
    ).size;
    const totalRevenue = orders.reduce(
      (a, o) => a + (Number(o?.totals?.grandTotal ?? 0) || 0),
      0
    );
    const avgOrder = orders.length ? totalRevenue / orders.length : 0;
    const deliveredRate = totals.confirmed
      ? (totals.delivered / totals.confirmed) * 100
      : 0;
    const cancelRate = totals.countAll
      ? (totals.cancelled / totals.countAll) * 100
      : 0;
    let unpaid = 0,
      overdue = 0;
    for (const o of orders) {
      const ps = (o.paymentStatus || "").toLowerCase();
      if (ps === "unpaid" || ps === "partially_paid") unpaid++;
      if (ps === "overdue") overdue++;
    }
    const salesKPIs = {
      customers,
      avgOrder,
      deliveredRate,
      cancelRate,
      unpaid,
      overdue,
    };

    return { topItems, salesSeries, productStats, salesKPIs };
  }, [orders, totals]);

  /* ---------- recent activity ---------- */
  const recent = useMemo(() => {
    return orders
      .slice()
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 8)
      .map((o) => ({
        id: o._id,
        salesOrderNo: o.salesOrderNo,
        customer:
          o.customerName || o.customer?.displayName || o.customer?.name || "—",
        total: o?.totals?.grandTotal ?? 0,
        status: o.status || "draft",
        fstatus: o.fulfillmentStatus || "—",
        updatedAt: o.updatedAt ? new Date(o.updatedAt) : null,
      }));
  }, [orders]);

  return (
    <div className="pb-6">
      {/* Header */}
      <div>
        <h1
          className="text-xl font-bold p-6 bg-cover bg-center text-white rounded-md mb-6"
          style={{ backgroundImage: `url(${assets.DashboardBanner})` }}
        >
          Dashboard Overview
        </h1>
      </div>

      {/* Top KPIs */}
      <div className="flex gap-4 flex-wrap content-start p-6">
        <KpiCard
          icon={<FaBoxOpen className="text-3xl text-blue-600" />}
          title="To Be Packed"
          value={toBePacked}
          hint={`${fulfill.picking} picking • ${fulfill.packing} packing`}
        />
        <KpiCard
          icon={<FaShippingFast className="text-3xl text-green-600" />}
          title="To Be Shipped"
          value={toBeShipped}
          hint={`${fulfill.ready} ready`}
        />
        <KpiCard
          icon={<FaTruckLoading className="text-3xl text-purple-600" />}
          title="To Be Delivered"
          value={toBeDelivered}
          hint={`${fulfill.shipped} in transit`}
        />
        <KpiCard
          icon={<FaFileInvoiceDollar className="text-3xl text-yellow-600" />}
          title="To Be Invoiced"
          value={toBeInvoiced}
          hint={`${fulfill.delivered} delivered`}
        />
      </div>
      <div className="flex gap-4 flex-wrap content-start px-6">
        {/* Inventory & Sales Summary */}
        <WideCard
          icon={<FaChartBar className="text-3xl text-indigo-500" />}
          title="Inventory & Sales Summary"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <FaHandshake /> Orders
              </div>
              <div className="text-lg font-semibold">{totals.countAll}</div>
              <div className="text-xs text-gray-500">
                {totals.confirmed} confirmed • {totals.draft} draft •{" "}
                {totals.cancelled} cancelled
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <FaDollarSign /> Gross Total (All Orders)
              </div>
              <div className="text-lg font-semibold">
                ${fmtMoney(totals.sumGrand)}
              </div>
              <div className="text-xs text-gray-500">
                Sum of order grand totals
              </div>
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <FaChartLine /> Deliveries (Last 7 days)
              </div>
              <DeliveriesBarChart data={chart7} />
            </div>
            <div className="rounded-xl border p-3">
              <div className="text-xs text-gray-500 flex items-center gap-2">
                <FaBoxes /> Fulfillment Snapshot
              </div>
              <div className="mt-2 space-y-1 text-xs text-gray-700">
                {Object.entries(fulfill).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <span className="w-24 capitalize">{k}</span>
                    <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-2 rounded-full bg-slate-900"
                        style={{
                          width: `${
                            totals.countAll
                              ? Math.min(100, (v / totals.countAll) * 100)
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    <span className="w-8 text-right tabular-nums">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </WideCard>
      </div>

      {/* Charts row */}
      <div className="px-6 mt-4 grid gap-4 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
        {/* Top Selling Items */}
        <div className="bg-white p-4 rounded-xl shadow-md border">
          <div className="flex items-center gap-2 mb-2">
            <FaStar className="text-3xl text-red-500" />
            <h2 className="font-semibold text-lg">Top Selling Items</h2>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : topItems.length === 0 ? (
            <div className="text-sm text-gray-500">No data yet.</div>
          ) : (
            <TopItemsBar data={topItems} />
          )}
        </div>

        {/* Sales Report */}
        <div className="bg-white p-4 rounded-xl shadow-md border">
          <div className="flex items-center gap-2 mb-2">
            <FaChartPie className="text-3xl text-orange-500" />
            <h2 className="font-semibold text-lg">
              Sales Report (Last 6 months)
            </h2>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : (
            <>
              <SalesBarChart data={salesSeries} />
              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border p-2">
                  <div className="text-xs text-gray-500">
                    Last Month Revenue
                  </div>
                  <div className="font-semibold">
                    ${fmtMoney(salesSeries.at(-1)?.value || 0)}
                  </div>
                </div>
                <div className="rounded-md border p-2">
                  <div className="text-xs text-gray-500">Last Month Orders</div>
                  <div className="font-semibold">
                    {salesSeries.at(-1)?.count || 0}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Product Details */}
        <div className="bg-white p-4 rounded-xl shadow-md border">
          <div className="flex items-center gap-2 mb-2">
            <FaTags className="text-3xl text-emerald-600" />
            <h2 className="font-semibold text-lg">Product Details</h2>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : (
            <div className="grid grid-cols-2 gap-2 text-sm">
              <InfoBox
                label="Distinct Items (All)"
                value={productStats.distinctAll}
              />
              <InfoBox
                label="Distinct Items (30d)"
                value={productStats.distinct30}
              />
              <InfoBox
                label="Avg Lines / Order"
                value={fmtMoney(productStats.avgLinesPerOrder)}
              />
              <InfoBox label="Qty Sold (30d)" value={productStats.qtySold30} />
            </div>
          )}
        </div>

        {/* Sales Overview */}
        <div className="bg-white p-4 rounded-xl shadow-md border xl:col-span-3">
          <div className="flex items-center gap-2 mb-2">
            <FaHandshake className="text-3xl text-cyan-600" />
            <h2 className="font-semibold text-lg">Sales</h2>
          </div>
          {loading ? (
            <div className="text-sm text-gray-600">Loading…</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-sm">
              <InfoBox label="Customers" value={salesKPIs.customers} />
              <InfoBox
                label="Avg Order Value"
                value={`$${fmtMoney(salesKPIs.avgOrder)}`}
              />
              <InfoBox
                label="Delivered Rate"
                value={`${fmtMoney(salesKPIs.deliveredRate)}%`}
              />
              <InfoBox
                label="Cancel Rate"
                value={`${fmtMoney(salesKPIs.cancelRate)}%`}
              />
              <InfoBox label="Unpaid" value={salesKPIs.unpaid} />
              <InfoBox label="Overdue" value={salesKPIs.overdue} />
            </div>
          )}
        </div>
      </div>

      {/* Recent activity */}
      <div className="px-6 mt-6">
        <div className="bg-white p-4 rounded-xl shadow-md border">
          <div className="mb-3 font-semibold text-lg">Recent Activity</div>
          {loading && <div className="text-sm text-gray-600">Loading…</div>}
          {!!err && <div className="text-sm text-red-600">{err}</div>}
          {!loading && !err && recent.length === 0 && (
            <div className="text-sm text-gray-500">No recent updates.</div>
          )}
          {!loading && !err && recent.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="text-left p-2">Order</th>
                    <th className="text-left p-2">Customer</th>
                    <th className="text-left p-2">Total</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Fulfillment</th>
                    <th className="text-left p-2">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((r) => (
                    <tr key={r.id} className="border-t">
                      <td className="p-2 font-medium">{r.salesOrderNo}</td>
                      <td className="p-2">{r.customer}</td>
                      <td className="p-2">${fmtMoney(r.total)}</td>
                      <td className="p-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs ${
                            r.status === "confirmed"
                              ? "bg-green-100 text-green-700"
                              : r.status === "cancelled"
                              ? "bg-red-100 text-red-700"
                              : r.status === "delivered"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="text-xs capitalize">{r.fstatus}</span>
                      </td>
                      <td className="p-2">
                        {r.updatedAt ? r.updatedAt.toLocaleString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* --------------- small UI atoms --------------- */
function KpiCard({ icon, title, value, hint }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border min-w-56 grow w-auto xl:min-w-32">
      <div className="mb-2">{icon}</div>
      <h2 className="font-semibold text-lg">{title}</h2>
      <div className="text-2xl font-bold mt-1">{value}</div>
      {hint ? <p className="text-sm text-gray-600 mt-1">{hint}</p> : null}
    </div>
  );
}
function WideCard({ icon, title, children }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow-md border grow min-w-[20rem]">
      <div className="flex items-center gap-2 mb-2">
        <span>{icon}</span>
        <h2 className="font-semibold text-lg">{title}</h2>
      </div>
      {children}
    </div>
  );
}
function InfoBox({ label, value }) {
  return (
    <div className="rounded-md border p-2">
      <div className="text-xs text-gray-500">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
