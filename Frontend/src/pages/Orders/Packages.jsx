import React, { useEffect, useMemo, useState } from "react";
import { FulfillmentAPI } from "../../../lib/api.js";

/* -------------------------------------------------------------
   Packages (Fulfillment) — Only confirmed orders are eligible
   - Kanban board with drag & drop
   - Table view with inline status change
   - Search, status filter, bulk move
   - Details side panel with timeline
   Tailwind only.
----------------------------------------------------------------*/

const STATUSES = [
  { key: "new",       label: "New",           badge: "bg-blue-100 text-blue-700" },
  { key: "picking",   label: "Picking",       badge: "bg-violet-100 text-violet-700" },
  { key: "packing",   label: "Packing",       badge: "bg-amber-100 text-amber-700" },
  { key: "ready",     label: "Ready to Ship", badge: "bg-teal-100 text-teal-700" },
  { key: "shipped",   label: "Shipped",       badge: "bg-sky-100 text-sky-700" },
  { key: "delivered", label: "Delivered",     badge: "bg-green-100 text-green-700" },
  { key: "cancelled", label: "Cancelled",     badge: "bg-rose-100 text-rose-700" },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.key, s]));
const COMMERCIAL_ELIGIBLE = ["confirmed"]; // 🔒 Only confirmed orders go to packaging

const fmtMoney = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
const fmtDate  = (d) => (d ? new Date(d).toLocaleString() : "—");

const Badge = ({ className = "", children }) => (
  <span className={"inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium " + className}>{children}</span>
);

const Button = ({ variant = "solid", className = "", ...props }) => {
  const base = "inline-flex items-center justify-center rounded-xl px-3 py-2 text-sm font-medium transition";
  const styles =
    variant === "outline"
      ? "border border-slate-300 text-slate-700 hover:bg-slate-50"
      : variant === "ghost"
      ? "text-slate-700 hover:bg-slate-100"
      : "bg-slate-900 text-white hover:bg-slate-800";
  return <button className={`${base} ${styles} ${className}`} {...props} />;
};
const Input = (props) => (
  <input
    {...props}
    className={(props.className || "") + " w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"}
  />
);
const Select = ({ value, onChange, children, className = "" }) => (
  <select
    value={value}
    onChange={(e) => onChange && onChange(e.target.value)}
    className={"w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300 " + className}
  >
    {children}
  </select>
);

const Card = ({ className = "", children, ...rest }) => (
  <div className={"rounded-2xl border bg-white shadow-sm " + className} {...rest}>{children}</div>
);
const CardHeader = ({ className = "", children }) => <div className={"border-b px-4 py-3 " + className}>{children}</div>;
const CardTitle  = ({ children }) => <div className="text-sm font-semibold">{children}</div>;
const CardContent= ({ className = "", children }) => <div className={"p-4 " + className}>{children}</div>;

function SideSheet({ open, onClose, children, title }) {
  return (
    <div className={`fixed inset-0 z-50 ${open ? "" : "pointer-events-none"}`}>
      <div className={`absolute inset-0 bg-black/30 transition-opacity ${open ? "opacity-100" : "opacity-0"}`} onClick={onClose} />
      <div className={`absolute right-0 top-0 h-full w-[92vw] max-w-lg bg-white shadow-xl border-l transition-transform rounded-l-2xl ${open ? "translate-x-0" : "translate-x-full"}`}>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">{title}</div>
          <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" onClick={onClose}>✕</button>
        </div>
        <div className="p-4 h-full overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

function PackageCard({ pkg, onOpen, onDragStart }) {
  const status = STATUS_MAP[pkg.status] || { badge: "" };
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, pkg)}
      onDoubleClick={() => onOpen(pkg)}
      className="group rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-3 cursor-grab active:cursor-grabbing min-w-0"
    >
      <div className="flex items-center justify-between">
        <div className="font-medium">{pkg.id}</div>
        <Badge className={`${status.badge} font-normal`}>{status.label}</Badge>
      </div>
      <div className="mt-2 text-sm text-slate-700 flex items-center justify-between">
        <span className="truncate pr-2" title={pkg.customer}>{pkg.customer}</span>
        <span className="font-semibold">${fmtMoney(pkg.total)}</span>
      </div>
      <div className="mt-1 text-xs text-slate-500">{pkg.items} item(s) • {pkg.assignee || "Unassigned"}</div>
      <div className="mt-2 opacity-0 group-hover:opacity-100 transition flex gap-2">
        <Button variant="outline" onClick={() => onOpen(pkg)}>Details</Button>
        <Button variant="ghost" onClick={() => navigator.clipboard.writeText(pkg.id)}>Copy ID</Button>
      </div>
    </div>
  );
}

function DetailsSheet({ pkg, onClose, onUpdate, onStatus }) {
  if (!pkg) return null;
  const status = STATUS_MAP[pkg.status];
  return (
    <SideSheet open={!!pkg} onClose={onClose} title={`${pkg.id} / ${pkg.customer}`}>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-slate-500">Assignee</div>
          <div className="text-sm font-medium">{pkg.assignee || "—"}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Total</div>
          <div className="text-sm font-medium">${fmtMoney(pkg.total)}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Items</div>
          <div className="text-sm font-medium">{pkg.items}</div>
        </div>
        <div>
          <div className="text-xs text-slate-500">Updated</div>
          <div className="text-sm font-medium">{fmtDate(pkg.updatedAt)}</div>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-500 mb-2">Move to status</div>
        <Select value={pkg.status} onChange={(v) => onStatus(pkg, v)}>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-500 mb-2">Notes</div>
        <div className="rounded-xl border bg-slate-50 p-3 text-sm min-h-16 whitespace-pre-wrap">
          {pkg.notes || "No notes."}
        </div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-slate-500 mb-2">Timeline</div>
        <div className="space-y-2">
          {(pkg.history || []).slice().sort((a,b)=>b.at - a.at).map((h, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-slate-400 mt-2" />
              <div>
                <div className="text-sm">{h.event}</div>
                <div className="text-xs text-slate-500">{fmtDate(h.at)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SideSheet>
  );
}

export default function Packages() {
  const [view, setView] = useState("board"); // 'board' | 'table'
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [rows, setRows] = useState([]);     // {_id, id, customer, items, total, status, assignee, notes, history, updatedAt}
  const [openPkg, setOpenPkg] = useState(null);

  // Load from API (server already filters to confirmed; we double-check here)
  useEffect(() => {
    let alive = true;
    FulfillmentAPI
      .list({ q: "", status: "all" })
      .then(({ rows }) => {
        if (!alive) return;
        const eligible = rows.filter(r => COMMERCIAL_ELIGIBLE.includes(r.status || "draft"));
        setRows(eligible.map(r => ({
          _id: r._id,
          id: r.salesOrderNo,
          customer: r.customerName || "—",
          items: r.itemsCount || 0,
          total: r.total ?? 0,
          status: r.fulfillmentStatus || "new",
          assignee: r.fulfillmentAssignee || "—",
          notes: r.fulfillmentNotes || "",
          history: (r.fulfillmentHistory || []).map(h => ({ at: new Date(h.at).getTime(), event: h.event })),
          updatedAt: new Date(r.updatedAt).getTime(),
          createdAt: new Date(r.createdAt).getTime(),
        })));
      })
      .catch(console.error);
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQ =
        !q ||
        r.id.toLowerCase().includes(q) ||
        r.customer.toLowerCase().includes(q) ||
        (r.assignee || "").toLowerCase().includes(q);
      const matchesS = statusFilter === "all" || r.status === statusFilter;
      return matchesQ && matchesS;
    });
  }, [rows, query, statusFilter]);

  const grouped = useMemo(() => {
    const m = Object.fromEntries(STATUSES.map((s) => [s.key, []]));
    for (const r of filtered) m[r.status]?.push(r);
    return m;
  }, [filtered]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(["all", ...STATUSES.map((s) => s.key)].map((k) => [k, 0]));
    for (const r of rows) { c.all++; c[r.status] = (c[r.status] || 0) + 1; }
    return c;
  }, [rows]);

  // DnD
  const onDragStart = (e, pkg) => {
    e.dataTransfer.setData("text/pkg-id", pkg.id);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDropTo = (statusKey, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/pkg-id");
    if (!id) return;
    changeStatusByBusinessId(id, statusKey);
  };

  // Change status (optimistic)
  const changeStatusByBusinessId = async (businessId, next) => {
    const row = rows.find(r => r.id === businessId);
    if (!row) return;
    await changeStatus(row, next);
  };
  const changeStatus = async (pkg, next) => {
    const {_id} = pkg;
    const prev = pkg.status;
    // optimistic
    setRows(curr => curr.map(r =>
      r._id === _id
        ? { ...r, status: next, updatedAt: Date.now(), history: [...(r.history||[]), { at: Date.now(), event: `${prev} → ${next}` }] }
        : r
    ));
    try {
      const saved = await FulfillmentAPI.setStatus(_id, next);
      setRows(curr => curr.map(r => r._id === _id ? {
        ...r,
        status: saved.fulfillmentStatus,
        assignee: saved.fulfillmentAssignee || r.assignee,
        notes: saved.fulfillmentNotes || r.notes,
        history: (saved.fulfillmentHistory || []).map(h => ({ at: new Date(h.at).getTime(), event: h.event })),
        updatedAt: new Date(saved.updatedAt).getTime(),
      } : r));
    } catch (e) {
      console.error(e);
      // rollback
      setRows(curr => curr.map(r => r._id === _id ? { ...r, status: prev } : r));
      alert("Status change failed (order may not be confirmed)");
    }
  };

  // Update from side sheet (assignee/notes)
  const updatePkg = async (nextPkg) => {
    const {_id} = nextPkg;
    const prev = rows.find(r => r._id === _id);
    setRows(curr => curr.map(r => r._id === _id ? nextPkg : r)); // optimistic
    try {
      const saved = await FulfillmentAPI.patch(_id, {
        fulfillmentAssignee: nextPkg.assignee,
        fulfillmentNotes: nextPkg.notes,
      });
      setRows(curr => curr.map(r => r._id === _id ? {
        ...r,
        assignee: saved.fulfillmentAssignee || "",
        notes: saved.fulfillmentNotes || "",
        updatedAt: new Date(saved.updatedAt).getTime(),
      } : r));
      setOpenPkg(curr => curr && curr._id === _id ? {
        ...curr,
        assignee: saved.fulfillmentAssignee || "",
        notes: saved.fulfillmentNotes || "",
      } : curr);
    } catch (e) {
      console.error(e);
      setRows(curr => curr.map(r => r._id === _id ? prev : r)); // rollback
      alert("Update failed (order may not be confirmed)");
    }
  };

  const openDetails = (pkg) => setOpenPkg(pkg);

  return (
    <div className="p-4 sm:p-6 space-y-4 overflow-x-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-slate-800">
          <span className="text-xl">📦</span>
          <h1 className="text-xl font-semibold">Packages</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-xl border p-1 bg-slate-50">
            <button className={`px-3 py-2 text-sm rounded-lg ${view === "board" ? "bg-white shadow" : ""}`} onClick={() => setView("board")}>
              Board
            </button>
            <button className={`px-3 py-2 text-sm rounded-lg ${view === "table" ? "bg-white shadow" : ""}`} onClick={() => setView("table")}>
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔎</span>
              <Input
                placeholder="Search by order, customer, assignee…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="md:col-span-2 flex gap-2">
              <Select value={statusFilter} onChange={setStatusFilter} className="w-48">
                <option value="all">All statuses ({Object.values(grouped).flat().length})</option>
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label}</option>
                ))}
              </Select>

              {/* Bulk move: apply to currently filtered rows */}
              <Select className="w-56" onChange={(v) => {
                if (!v) return;
                const ids = new Set(filtered.map(f => f._id));
                // optimistic
                setRows(curr => curr.map(r => ids.has(r._id) ? { ...r, status: v, updatedAt: Date.now(), history: [...(r.history||[]), { at: Date.now(), event: `${r.status} → ${v}` }] } : r));
                // fire per id
                filtered.forEach(f => FulfillmentAPI.setStatus(f._id, v).catch(console.error));
              }} value="">
                <option value="">Bulk: move visible →</option>
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>Move to {s.label}</option>
                ))}
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Board View */}
      {view === "board" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 2xl:grid-cols-7 gap-4 overflow-x-hidden">
          {STATUSES.map((s) => (
            <Card key={s.key} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDropTo(s.key, e)}>
              <CardHeader className="flex items-center justify-between">
                <CardTitle>{s.label}</CardTitle>
                <Badge className="bg-slate-100 text-slate-700">{grouped[s.key]?.length || 0}</Badge>
              </CardHeader>
              <CardContent>
                <div className="h-[56vh] overflow-y-auto overflow-x-hidden pr-1 space-y-3 min-w-0">
                  {(grouped[s.key] || []).map((pkg) => (
                    <PackageCard key={pkg._id} pkg={pkg} onOpen={openDetails} onDragStart={onDragStart} />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Table View */}
      {view === "table" && (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-y-auto overflow-x-hidden">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-slate-600">
                  <tr>
                    <th className="text-left px-4 py-2">Order</th>
                    <th className="text-left px-4 py-2">Customer</th>
                    <th className="text-left px-4 py-2">Items</th>
                    <th className="text-left px-4 py-2">Total</th>
                    <th className="text-left px-4 py-2">Assignee</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Updated</th>
                    <th className="text-right px-4 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r._id} className="border-t">
                      <td className="px-4 py-2 font-medium">{r.id}</td>
                      <td className="px-4 py-2">{r.customer}</td>
                      <td className="px-4 py-2">{r.items}</td>
                      <td className="px-4 py-2">${fmtMoney(r.total)}</td>
                      <td className="px-4 py-2">{r.assignee || "—"}</td>
                      <td className="px-4 py-2">
                        <Select value={r.status} onChange={(v) => changeStatus(r, v)} className="w-48">
                          {STATUSES.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </Select>
                      </td>
                      <td className="px-4 py-2">{fmtDate(r.updatedAt)}</td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="outline" onClick={() => openDetails(r)}>View</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <DetailsSheet
        pkg={openPkg}
        onClose={() => setOpenPkg(null)}
        onUpdate={(next) => updatePkg(next)}
        onStatus={(pkg, next) => changeStatus(pkg, next)}
      />
    </div>
  );
}
