import React, { useMemo, useState } from "react";

/* -------------------------------------------------------------
   Simple Packages (Orders) Tracker — NO external UI libs
   - Kanban board with drag & drop
   - Table view with inline status change
   - Search, status filter, bulk move
   - Create Package modal
   - Details side panel with timeline
   Tailwind required, but no shadcn/lucide or alias imports.
----------------------------------------------------------------*/

/* Status definitions */
const STATUSES = [
  { key: "new", label: "New", badge: "bg-blue-100 text-blue-700" },
  { key: "picking", label: "Picking", badge: "bg-violet-100 text-violet-700" },
  { key: "packing", label: "Packing", badge: "bg-amber-100 text-amber-700" },
  { key: "ready", label: "Ready to Ship", badge: "bg-teal-100 text-teal-700" },
  { key: "shipped", label: "Shipped", badge: "bg-sky-100 text-sky-700" },
  { key: "delivered", label: "Delivered", badge: "bg-green-100 text-green-700" },
  { key: "cancelled", label: "Cancelled", badge: "bg-rose-100 text-rose-700" },
];
const STATUS_MAP = Object.fromEntries(STATUSES.map((s) => [s.key, s]));

/* Helpers */
const fmtMoney = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
const fmtDate = (d) => new Date(d).toLocaleString();

/* Demo seed data; replace with your API data */
const SEED = [
  {
    id: "SO-1001",
    customer: "AquaTech Marine",
    items: 6,
    total: 1290.5,
    status: "picking",
    createdAt: Date.now() - 1000 * 60 * 60 * 5,
    updatedAt: Date.now() - 1000 * 60 * 20,
    assignee: "Nimal",
    notes: "Pick from aisle B, bin 12.",
    history: [
      { at: Date.now() - 1000 * 60 * 60 * 5, event: "Created" },
      { at: Date.now() - 1000 * 60 * 60 * 4.5, event: "New → Picking" },
    ],
  },
  {
    id: "SO-1002",
    customer: "Oceanic Supplies",
    items: 2,
    total: 240,
    status: "packing",
    createdAt: Date.now() - 1000 * 60 * 60 * 10,
    updatedAt: Date.now() - 1000 * 60 * 40,
    assignee: "Vishwa",
    notes: "Fragile. Bubble wrap.",
    history: [
      { at: Date.now() - 1000 * 60 * 60 * 10, event: "Created" },
      { at: Date.now() - 1000 * 60 * 60 * 9.5, event: "New → Picking" },
      { at: Date.now() - 1000 * 60 * 60 * 2, event: "Picking → Packing" },
    ],
  },
  {
    id: "SO-1003",
    customer: "Harbor Tools",
    items: 4,
    total: 520.75,
    status: "ready",
    createdAt: Date.now() - 1000 * 60 * 60 * 24,
    updatedAt: Date.now() - 1000 * 60 * 10,
    assignee: "Sithara",
    notes: "Await courier pickup.",
    history: [
      { at: Date.now() - 1000 * 60 * 60 * 24, event: "Created" },
      { at: Date.now() - 1000 * 60 * 60 * 20, event: "New → Picking" },
      { at: Date.now() - 1000 * 60 * 60 * 12, event: "Picking → Packing" },
      { at: Date.now() - 1000 * 60 * 60 * 1, event: "Packing → Ready" },
    ],
  },
  {
    id: "SO-1004",
    customer: "WaveWorks",
    items: 1,
    total: 99.99,
    status: "new",
    createdAt: Date.now() - 1000 * 60 * 30,
    updatedAt: Date.now() - 1000 * 60 * 30,
    assignee: "—",
    notes: "",
    history: [{ at: Date.now() - 1000 * 60 * 30, event: "Created" }],
  },
];

/* -------------------------------------------------------------
   Small dumb UI atoms
----------------------------------------------------------------*/
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

/* -------------------------------------------------------------
   Cards & Modals (pure Tailwind)
----------------------------------------------------------------*/
const Card = ({ className = "", children, ...rest }) => (
  <div className={"rounded-2xl border bg-white shadow-sm " + className} {...rest}>
    {children}
  </div>
);
const CardHeader = ({ className = "", children }) => (
  <div className={"border-b px-4 py-3 " + className}>{children}</div>
);
const CardTitle = ({ children }) => <div className="text-sm font-semibold">{children}</div>;
const CardContent = ({ className = "", children }) => <div className={"p-4 " + className}>{children}</div>;

/* Simple modal */
function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative z-10 w-[92vw] max-w-xl rounded-2xl border bg-white shadow-lg">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="font-semibold">{title}</div>
          <button className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" onClick={onClose}>✕</button>
        </div>
        <div className="p-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t px-4 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/* Side sheet */
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

/* -------------------------------------------------------------
   Package Card (for board)
----------------------------------------------------------------*/
function PackageCard({ pkg, onOpen, onDragStart }) {
  const status = STATUS_MAP[pkg.status] || { badge: "" };
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, pkg)}
      onDoubleClick={() => onOpen(pkg)}
      className="min-w-0 group rounded-2xl border bg-white shadow-sm hover:shadow-md transition p-3 cursor-grab active:cursor-grabbing"
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

/* -------------------------------------------------------------
   Create Package Modal
----------------------------------------------------------------*/
function CreatePackageModal({ open, setOpen, onCreate }) {
  const [form, setForm] = useState({ id: "", customer: "", total: "", items: 1, status: "new", assignee: "", notes: "" });
  const submit = () => {
    if (!form.id || !form.customer) return alert("Order ID and Customer are required");
    const now = Date.now();
    onCreate({
      ...form,
      total: Number(form.total || 0),
      createdAt: now,
      updatedAt: now,
      history: [
        { at: now, event: "Created" },
        { at: now, event: `Status: ${STATUS_MAP[form.status].label}` },
      ],
    });
    setOpen(false);
    setForm({ id: "", customer: "", total: "", items: 1, status: "new", assignee: "", notes: "" });
  };

  return (
    <Modal
      open={open}
      onClose={() => setOpen(false)}
      title="Create Package"
      footer={<>
        <Button onClick={submit}>Create</Button>
      </>}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <div className="text-xs mb-1">Order ID</div>
          <Input value={form.id} onChange={(e) => setForm({ ...form, id: e.target.value })} placeholder="SO-1005" />
        </div>
        <div>
          <div className="text-xs mb-1">Customer</div>
          <Input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Customer name" />
        </div>
        <div>
          <div className="text-xs mb-1">Total (USD)</div>
          <Input type="number" value={form.total} onChange={(e) => setForm({ ...form, total: e.target.value })} />
        </div>
        <div>
          <div className="text-xs mb-1">Items</div>
          <Input type="number" min={1} value={form.items} onChange={(e) => setForm({ ...form, items: Number(e.target.value || 1) })} />
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs mb-1">Status</div>
          <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })}>
            {STATUSES.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs mb-1">Assignee</div>
          <Input value={form.assignee} onChange={(e) => setForm({ ...form, assignee: e.target.value })} placeholder="Who is handling it?" />
        </div>
        <div className="sm:col-span-2">
          <div className="text-xs mb-1">Notes</div>
          <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
        </div>
      </div>
    </Modal>
  );
}

/* -------------------------------------------------------------
   Details Side Sheet
----------------------------------------------------------------*/
function DetailsSheet({ pkg, onClose, onUpdate }) {
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
        <div className="text-xs text-slate-500 mb-2">Status</div>
        <Select value={pkg.status} onChange={(v) => onUpdate({ ...pkg, status: v, updatedAt: Date.now(), history: [...(pkg.history||[]), { at: Date.now(), event: `${status?.label || pkg.status} → ${STATUS_MAP[v]?.label || v}` }] })}>
          {STATUSES.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </Select>
      </div>

      <div className="mt-4">
        <div className="text-xs text-slate-500 mb-2">Notes</div>
        <div className="rounded-xl border bg-slate-50 p-3 text-sm min-h-16 whitespace-pre-wrap">{pkg.notes || "No notes."}</div>
      </div>

      <div className="mt-6">
        <div className="text-xs text-slate-500 mb-2">Timeline</div>
        <div className="space-y-2">
          {pkg.history?.slice().sort((a,b)=>b.at-a.at).map((h, i) => (
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

/* -------------------------------------------------------------
   Main Component
----------------------------------------------------------------*/
export default function Packages() {
  const [view, setView] = useState("board"); // 'board' | 'table'
  const [query, setQuery] = useState("");
  const [rows, setRows] = useState(SEED);
  const [openPkg, setOpenPkg] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const q = query.toLowerCase();
      const matchesQ = !q || r.id.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q) || (r.assignee||"").toLowerCase().includes(q);
      const matchesS = statusFilter === "all" || r.status === statusFilter;
      return matchesQ && matchesS;
    });
  }, [rows, query, statusFilter]);

  const grouped = useMemo(() => {
    const m = Object.fromEntries(STATUSES.map((s) => [s.key, []]));
    for (const r of filtered) m[r.status]?.push(r);
    return m;
  }, [filtered]);

  const changeStatus = (id, next) => {
    setRows((curr) => curr.map((r) => r.id === id ? { ...r, status: next, updatedAt: Date.now(), history: [...(r.history||[]), { at: Date.now(), event: `${STATUS_MAP[r.status]?.label || r.status} → ${STATUS_MAP[next]?.label || next}` }] } : r));
  };

  const onDropTo = (statusKey, e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/pkg-id");
    if (!id) return;
    changeStatus(id, statusKey);
  };

  const onDragStart = (e, pkg) => {
    e.dataTransfer.setData("text/pkg-id", pkg.id);
    e.dataTransfer.effectAllowed = "move";
  };

  const openDetails = (pkg) => setOpenPkg(pkg);
  const updatePkg = (nextPkg) => {
    setRows((curr) => curr.map((r) => (r.id === nextPkg.id ? nextPkg : r)));
    setOpenPkg(nextPkg);
  };
  const createPkg = (pkg) => setRows((curr) => [pkg, ...curr]);

  const counts = useMemo(() => {
    const c = Object.fromEntries(["all", ...STATUSES.map((s) => s.key)].map((k) => [k, 0]));
    for (const r of rows) { c.all++; c[r.status] = (c[r.status]||0) + 1; }
    return c;
  }, [rows]);

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
          <Button onClick={() => setShowCreate(true)}>＋ New Package</Button>
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
                <option value="all">All statuses ({counts.all})</option>
                {STATUSES.map((s) => (
                  <option key={s.key} value={s.key}>{s.label} ({counts[s.key] || 0})</option>
                ))}
              </Select>

              {/* Simple bulk move: choose status and apply to filtered */}
              <Select className="w-56" onChange={(v) => {
                if (!v) return;
                setRows((curr) => curr.map((r) => (filtered.some((f) => f.id === r.id) ? { ...r, status: v } : r)));
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
                    <PackageCard key={pkg.id} pkg={pkg} onOpen={openDetails} onDragStart={onDragStart} />
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
                    <tr key={r.id} className="border-t">
                      <td className="px-4 py-2 font-medium">{r.id}</td>
                      <td className="px-4 py-2">{r.customer}</td>
                      <td className="px-4 py-2">{r.items}</td>
                      <td className="px-4 py-2">${fmtMoney(r.total)}</td>
                      <td className="px-4 py-2">{r.assignee || "—"}</td>
                      <td className="px-4 py-2">
                        <Select value={r.status} onChange={(v) => changeStatus(r.id, v)} className="w-48">
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

      {/* Modals / Sheets */}
      <CreatePackageModal open={showCreate} setOpen={setShowCreate} onCreate={createPkg} />
      <DetailsSheet pkg={openPkg} onClose={() => setOpenPkg(null)} onUpdate={updatePkg} />
    </div>
  );
}
