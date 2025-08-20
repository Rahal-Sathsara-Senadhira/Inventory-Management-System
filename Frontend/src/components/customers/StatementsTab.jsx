import { useEffect, useMemo, useRef, useState } from "react";
import StatementToolbar from "./StatementToolbar";
import StatementPreview from "./StatementPreview";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

/* ------------ small date utilities (no external deps) ------------- */
const toISODate = (d) => new Date(d).toISOString().slice(0, 10);
const todayISO = () => toISODate(new Date());

function startOfWeek(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun
  const diff = (day === 0 ? -6 : 1) - day; // make Monday first
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfWeek(date) {
  const s = startOfWeek(date);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfMonth(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}
function startOfYear(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), 0, 1);
}
function endOfYear(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), 11, 31, 23, 59, 59, 999);
}

function periodRange(preset) {
  const now = new Date();
  switch (preset) {
    case "daily": {
      const s = new Date(now); s.setHours(0, 0, 0, 0);
      const e = new Date(now); e.setHours(23, 59, 59, 999);
      return { from: toISODate(s), to: toISODate(e) };
    }
    case "weekly":
      return { from: toISODate(startOfWeek(now)), to: toISODate(endOfWeek(now)) };
    case "monthly":
      return { from: toISODate(startOfMonth(now)), to: toISODate(endOfMonth(now)) };
    case "yearly":
      return { from: toISODate(startOfYear(now)), to: toISODate(endOfYear(now)) };
    default:
      return { from: todayISO(), to: todayISO() };
  }
}

function getOrderDate(o) {
  const raw = o?.salesOrderDate || o?.createdAt;
  return raw ? new Date(raw) : null;
}

/* key used for grouping */
function groupKey(date, mode) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  if (mode === "daily") return `${y}-${m}-${dd}`;
  if (mode === "monthly") return `${y}-${m}`;
  if (mode === "yearly") return `${y}`;
  // weekly - ISO week-ish label
  const start = startOfWeek(d);
  const weekYear = start.getFullYear();
  const wk = Math.ceil(((+d - +startOfYear(d)) / 86400000 + startOfYear(d).getDay()) / 7);
  return `W${String(wk).padStart(2, "0")} ${weekYear}`;
}

/* amount helpers */
const money = (n) => Number(n || 0);
const currencyOf = (o) => o?.totals?.currency || "USD";

export default function StatementsTab({ customerId }) {
  const printRef = useRef();
  const [mode, setMode] = useState("monthly"); // 'daily' | 'weekly' | 'monthly' | 'yearly'
  const [{ from, to }, setRange] = useState(periodRange("monthly"));
  const [loading, setLoading] = useState(false);
  const [allOrders, setAllOrders] = useState([]);
  const [error, setError] = useState("");

  // fetch once (no server change)
  useEffect(() => {
    if (!customerId) return;
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        setError("");
        const tenantId = localStorage.getItem("tenantId") || "default";
        const res = await fetch(
          `${API_BASE}/api/sales-orders?customerId=${encodeURIComponent(customerId)}`,
          { headers: { "x-tenant-id": tenantId }, credentials: "include" }
        );
        if (!res.ok) throw new Error(`Orders fetch failed (${res.status})`);
        const json = await res.json();
        if (abort) return;
        const list = Array.isArray(json) ? json : (json?.data ?? []);
        setAllOrders(list);
      } catch (e) {
        if (!abort) setError(e.message || "Failed to load orders");
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => { abort = true; };
  }, [customerId]);

  // filter by date range (client-side)
  const filtered = useMemo(() => {
    if (!from || !to) return allOrders;
    const f = new Date(from);
    const t = new Date(to); t.setHours(23, 59, 59, 999);
    return allOrders.filter((o) => {
      const d = getOrderDate(o);
      return d && d >= f && d <= t;
    });
  }, [allOrders, from, to]);

  // group orders
  const groups = useMemo(() => {
    const map = new Map();
    for (const o of filtered) {
      const d = getOrderDate(o);
      if (!d) continue;
      const key = groupKey(d, mode);
      const list = map.get(key) || [];
      list.push(o);
      map.set(key, list);
    }

    // convert to array with totals
    const arr = Array.from(map.entries()).map(([label, orders]) => {
      const currency = orders[0] ? currencyOf(orders[0]) : "USD";
      const totals = orders.reduce(
        (acc, o) => {
          const g = money(o?.totals?.grandTotal);
          const p = money(o?.amountPaid);
          const bal = Math.max(g - p, 0);
          acc.grand += g; acc.paid += p; acc.balance += bal;
          return acc;
        },
        { grand: 0, paid: 0, balance: 0 }
      );
      return { label, currency, orders, totals };
    });

    // sort by label as date-ish (best effort)
    return arr.sort((a, b) => a.label.localeCompare(b.label));
  }, [filtered, mode]);

  // quick presets
  const setPreset = (preset) => {
    setMode(preset);
    setRange(periodRange(preset));
  };

  const onRangeChange = (next) => setRange((prev) => ({ ...prev, ...next }));

  // compute global currency (fallback)
  const currency = useMemo(() => {
    return groups[0]?.currency || "USD";
  }, [groups]);

  return (
    <div className="space-y-4">
      <StatementToolbar
        printRef={printRef}
        mode={mode}
        from={from}
        to={to}
        onSetMode={setMode}
        onPreset={setPreset}
        onRangeChange={onRangeChange}
        loading={loading}
        groups={groups}
        currency={currency}
      />
      <div ref={printRef}>
        <StatementPreview
          loading={loading}
          error={error}
          mode={mode}
          from={from}
          to={to}
          groups={groups}
          currency={currency}
        />
      </div>
    </div>
  );
}
