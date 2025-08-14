import React, { useEffect, useMemo, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const API_BASE = import.meta.env?.VITE_API_BASE || ""; // set in .env during dev
const fmtMoney = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
const asNumberOrZero = (v) => (v === "" || v === null ? 0 : Number(v));

/* Small tooltip icon */
function InfoIcon({ text }) {
  return (
    <div className="group relative inline-flex align-middle">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500">
        ?
      </span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 z-20 mt-2 w-60 -translate-x-1/2 rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
      >
        {text}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Item Autocomplete rendered in a BODY portal (won't be clipped)     */
/* ------------------------------------------------------------------ */

function ItemAutocomplete({
  value,        // selected itemId (string) or null
  onChange,     // (itemId: string) => void
  onPick,       // optional: (fullItem: object) => void
  onFreeText,   // optional: (text: string) => void (when user types)
  priceListId,  // optional: pick tiered price
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const acRef = useRef(null); // AbortController

  // ---- dropdown position (anchored to input, rendered in <body>) ----
  const EXTRA_WIDTH = 80;   // add a bit more width than the input
  const MIN_WIDTH   = 300;  // never smaller than this
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,    // small gap under input
      left: r.left,
      width: Math.max(r.width + EXTRA_WIDTH, MIN_WIDTH),
    });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);

    const ro = new ResizeObserver(updatePosition);
    ro.observe(document.documentElement);
    if (inputRef.current) ro.observe(inputRef.current);

    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
      ro.disconnect();
    };
  }, [open]);

  // Reflect selected id -> visible text
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!value) {
        setQuery("");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/items/${value}`);
        if (alive && res.ok) {
          const it = await res.json();
          setQuery(it.name || it.sku || "");
        }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [value]);

  // Debounced server search
  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    setOpen(true);

    const t = setTimeout(async () => {
      try {
        acRef.current?.abort();
        const ac = new AbortController();
        acRef.current = ac;

        const res = await fetch(
          `${API_BASE}/api/items/search?q=${encodeURIComponent(q)}`,
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setActive(0);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  // Close on outside click (list is portaled, so listen on document)
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const insideInput = inputRef.current?.contains(e.target);
      const insideList = (el) => {
        while (el) {
          if (el.dataset?.role === "item-listbox") return true;
          el = el.parentElement;
        }
        return false;
      };
      if (!insideInput && !insideList(e.target)) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const select = (it) => {
    onChange?.(it?._id || "");
    onPick?.(it || null);
    setQuery(it ? (it.name || it.sku || "") : "");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      updatePosition();
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) select(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <>
      <div className="relative w-full">
        <div className="flex">
          <input
            ref={inputRef}
            type="text"
            placeholder="Start typing an item…"
            value={query}
            onChange={(e) => {
              const text = e.target.value;
              setQuery(text);
              onFreeText?.(text);
            }}
            onFocus={() => { setOpen(true); updatePosition(); }}
            onKeyDown={onKeyDown}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />
        </div>
      </div>

      {/* Portal: dropdown rendered at <body> with fixed positioning */}
      {open &&
        createPortal(
          <ul
            data-role="item-listbox"
            role="listbox"
            style={{
              position: "fixed",
              top: pos.top,
              left: pos.left,
              width: pos.width,
              maxHeight: "20rem",
              overflow: "auto",
              zIndex: 2147483647,
            }}
            className="rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
          >
            {loading && (
              <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>
            )}
            {!loading && items.length === 0 && query.trim().length > 0 && (
              <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
            )}

            {items.map((it, i) => {
              const isActive = i === active;
              const price =
                (it.prices && priceListId && it.prices[priceListId] != null)
                  ? it.prices[priceListId]
                  : (it.price ?? 0);

              return (
                <li
                  key={it._id}
                  role="option"
                  aria-selected={isActive}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => { e.preventDefault(); select(it); }}
                  className={`cursor-pointer rounded-md px-4 py-3 text-sm transition ${
                    isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="font-semibold text-indigo-700"
                      style={{
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        maxWidth: "70%",
                      }}
                      title={it.name}
                    >
                      {it.name || "(unnamed item)"}
                    </div>
                    {it.sku && (
                      <div
                        className="text-xs text-gray-500 text-right"
                        style={{ whiteSpace: "nowrap" }}
                      >
                        <div>SKU:</div>
                        <div>{it.sku}</div>
                      </div>
                    )}
                  </div>

                  {it.description && (
                    <div className="mt-1 text-xs text-gray-600 line-clamp-2">
                      {it.description}
                    </div>
                  )}

                  <div className="mt-1 text-xs font-medium text-gray-700">
                    Rate: {fmtMoney(price)}
                  </div>
                </li>
              );
            })}
          </ul>,
          document.body
        )}
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Customer Autocomplete (safe, server-side search + debounce)        */
/* ------------------------------------------------------------------ */

function CustomerAutocomplete({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const acRef = useRef(null); // AbortController

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!value) {
        setQuery("");
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/customers/${value}`);
        if (alive && res.ok) {
          const c = await res.json();
          setQuery(c.displayName || c.name || "");
        }
      } catch { /* ignore */ }
    })();
    return () => { alive = false; };
  }, [value]);

  useEffect(() => {
    const q = query.trim();
    if (q.length === 0) {
      setItems([]);
      return;
    }
    setLoading(true);
    setOpen(true);

    const t = setTimeout(async () => {
      try {
        acRef.current?.abort();
        const ac = new AbortController();
        acRef.current = ac;

        const res = await fetch(
          `${API_BASE}/api/customers/search?q=${encodeURIComponent(q)}`,
          { signal: ac.signal }
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
        setActive(0);
      } catch (e) {
        if (e.name !== "AbortError") {
          console.error(e);
          setItems([]);
        }
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const onDoc = (e) => {
      if (!inputRef.current?.contains(e.target) && !listRef.current?.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const select = (c) => {
    onChange?.(c?._id || "");
    setQuery(c ? c.displayName || c.name || "" : "");
    setOpen(false);
    inputRef.current?.blur();
  };

  const onKeyDown = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "Enter")) {
      setOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[active]) select(items[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="flex">
        <input
          ref={inputRef}
          type="text"
          placeholder="Start typing a customer name…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          className="w-full rounded-l-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          role="combobox"
          aria-expanded={open}
          aria-controls="customer-listbox"
          aria-autocomplete="list"
        />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-r-lg bg-blue-600 px-3 text-white"
          title="Open list"
        >
          {loading ? "…" : "🔍"}
        </button>
      </div>

      {open && (
        <ul
          ref={listRef}
          id="customer-listbox"
          role="listbox"
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          {loading && (
            <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>
          )}
          {!loading && items.length === 0 && query.trim().length > 0 && (
            <li className="px-3 py-2 text-sm text-gray-500">No matches</li>
          )}
          {items.map((c, i) => {
            const label = c.displayName || c.name || "(unnamed)";
            const sub = c.customerEmail || c.email || c.phone || c.mobile || "";
            const isActive = i === active;
            return (
              <li
                key={c._id}
                role="option"
                aria-selected={isActive}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => { e.preventDefault(); select(c); }}
                className={`cursor-pointer rounded-md px-3 py-2 text-sm ${
                  isActive ? "bg-indigo-50 text-indigo-700" : "hover:bg-gray-50"
                }`}
              >
                <div className="font-medium">{label}</div>
                {sub && <div className="text-xs text-gray-500">{sub}</div>}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Customer details blocks (billing, shipping, remarks)               */
/* ------------------------------------------------------------------ */

function AddressBlock({ title, addr = {}, contact }) {
  const {
    country,
    addressNo,
    street1,
    street2,
    city,
    district,
    zipCode,
    phone,
    fax,
  } = addr || {};

  return (
    <div className="min-w-[260px] flex-1">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
        <span className="text-gray-300">⎯</span>
        <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-gray-300 text-[10px] text-gray-500">
          ✎
        </span>
      </div>

      {contact && <div className="mb-1 font-semibold">{contact}</div>}

      <div className="space-y-0.5 text-sm leading-relaxed text-gray-800">
        {addressNo || street1 ? (
          <div>{[addressNo, street1].filter(Boolean).join(" ")}</div>
        ) : null}
        {street2 && <div>{street2}</div>}
        {(city || district || zipCode) && (
          <div>{[city, district, zipCode].filter(Boolean).join(", ")}</div>
        )}
        {country && <div>{country}</div>}
        {phone && <div>Phone: {phone}</div>}
        {fax && <div>Fax Number: {fax}</div>}
      </div>
    </div>
  );
}

function Remarks({ text }) {
  if (!text) return null;
  const short = text.length > 140 ? text.slice(0, 140) + "…" : text;
  return (
    <div className="mt-6">
      <div className="mb-1 w-max border-b border-dotted border-gray-400 text-sm font-semibold text-gray-700">
        REMARKS
      </div>
      <div className="text-sm text-gray-700">
        {short}
        {text.length > 140 && (
          <button
            type="button"
            className="ml-2 text-indigo-600 hover:underline"
            title={text}
          >
            more…
          </button>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main component                                                      */
/* ------------------------------------------------------------------ */

export default function AddSalesOrders({
  customers: _customers = [],
  items: itemsProp = [],
  taxes: taxesProp = [],
  priceLists: priceListsProp = [],
  deliveryMethods: deliveryMethodsProp = [],
  paymentTerms: paymentTermsProp = [
    { value: "due_on_receipt", label: "Due on Receipt" },
    { value: "net_7", label: "Net 7" },
    { value: "net_15", label: "Net 15" },
    { value: "net_30", label: "Net 30" },
  ],
  salespersons: salespersonsProp = [],
  nextNumber = "SO-0000",
  currency = "$",
  onSubmit,
}) {
  const items = itemsProp;
  const taxes = taxesProp;
  const priceLists = priceListsProp;
  const deliveryMethods = deliveryMethodsProp;
  const paymentTerms = paymentTermsProp;
  const [salespersons, setSalespersons] = useState([]);

  const [saving, setSaving] = useState(false);
  const [showShipTax, setShowShipTax] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [form, setForm] = useState({
    customerId: "",
    salesOrderNo: nextNumber,
    referenceNo: "",
    salesOrderDate: todayISO(),
    expectedShipmentDate: "",
    paymentTerm: paymentTerms?.[0]?.value || "due_on_receipt",
    deliveryMethod: "",
    salespersonId: "",
    priceListId: "",
    shippingCharge: 0,
    shippingTaxId: "",
    adjustment: 0,
    roundOff: 0,
    notes: "",
    terms: "",
    files: [],
  });

  const newRow = () => ({
    id: uid(),
    itemId: null,
    freeText: "",
    quantity: 1,
    rate: 0,
    discount: 0,
    taxId: "",
    stockAvailable: undefined, // for client-side max clamp
  });

  const [rows, setRows] = useState([newRow()]);

  // Load selected customer to show addresses & currency
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!form.customerId) {
        setSelectedCustomer(null);
        return;
      }
      try {
        const res = await fetch(`${API_BASE}/api/customers/${form.customerId}`);
        if (!res.ok) throw new Error("Failed to fetch customer");
        const data = await res.json();
        if (alive) setSelectedCustomer(data);
      } catch (e) {
        console.error(e);
        if (alive) setSelectedCustomer(null);
      }
    })();
    return () => { alive = false; };
  }, [form.customerId]);

  useEffect(() => {
    fetch(`${API_BASE}/api/salespersons`)
      .then((response) => response.json())
      .then((data) => setSalespersons(data))
      .catch((error) => console.error("Failed to load salespersons:", error));
  }, []);

  useEffect(() => {
    const fetchOrderNumber = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sales-orders/next-order-number`);
        if (!res.ok) throw new Error("Failed to fetch next order number");
        const data = await res.json();
        setForm((f) => ({ ...f, salesOrderNo: data.nextOrderNumber }));
      } catch (e) {
        console.error("Failed to fetch next order number", e);
      }
    };
    fetchOrderNumber();
  }, []);

  const taxRate = (id) => taxes.find((t) => t._id === id)?.rate || 0;

  const calc = useMemo(() => {
    const calcRows = rows.map((r) => {
      const base =
        Number(r.quantity || 0) *
        Number(r.rate || 0) *
        (1 - Number(r.discount || 0) / 100);
      const tax = base * (taxRate(r.taxId) / 100);
      return { ...r, base, tax, total: base + tax };
    });

    const subTotal = calcRows.reduce((s, r) => s + r.base, 0);
    const taxTotal =
      calcRows.reduce((s, r) => s + r.tax, 0) +
      (Number(form.shippingCharge || 0) * taxRate(form.shippingTaxId)) / 100;
    const grand =
      subTotal +
      taxTotal +
      Number(form.shippingCharge || 0) +
      Number(form.adjustment || 0) +
      Number(form.roundOff || 0);
    const totalQty = calcRows.reduce((s, r) => s + Number(r.quantity || 0), 0);

    return { calcRows, subTotal, taxTotal, grand, totalQty };
  }, [rows, form.shippingCharge, form.shippingTaxId, form.adjustment, form.roundOff, taxes]);

  const updateRow = (id, patch) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const addRow = () => setRows((rs) => [...rs, newRow()]);
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));

  // helpers for clamping qty when same item appears on multiple rows
  const qtyUsedByOtherRows = (row) =>
    rows.reduce((sum, rr) => {
      if (rr.id === row.id) return sum;
      if (rr.itemId && rr.itemId === row.itemId) return sum + Number(rr.quantity || 0);
      return sum;
    }, 0);

  const maxQtyForRow = (row) => {
    if (!row.itemId) return Infinity;
    const avail = Number.isFinite(row.stockAvailable) ? row.stockAvailable : Infinity;
    const remaining = avail - qtyUsedByOtherRows(row);
    return Math.max(0, remaining);
  };

  const handleSubmit = async (status = "draft") => {
    // guard against obvious over-ordering
    for (const row of rows) {
      if (!row.itemId) continue;
      const maxCap = maxQtyForRow(row);
      if (Number.isFinite(maxCap) && Number(row.quantity || 0) > maxCap) {
        alert("Quantity exceeds available stock for one or more items.");
        return;
      }
    }

    setSaving(true);

    // Get the next order number before submitting
    let nextOrderNumber = "SO-0001";
    try {
      const res = await fetch(`${API_BASE}/api/sales-orders/next-order-number`);
      if (!res.ok) throw new Error("Failed to fetch next order number");
      const data = await res.json();
      nextOrderNumber = data.nextOrderNumber;
    } catch (e) {
      console.error("Failed to fetch next order number", e);
    }

    // Prepare the payload (ensure "" is not sent for ObjectId fields)
    const payload = {
      ...form,
      status,
      salesOrderNo: nextOrderNumber,
      items: calc.calcRows.map(({ base, tax, total, id, stockAvailable, ...r }) => ({
        ...r,
        taxId: r.taxId || undefined, // <-- important
      })),
      totals: {
        subTotal: Number(calc.subTotal.toFixed(2)),
        taxTotal: Number(calc.taxTotal.toFixed(2)),
        shippingCharge: Number(form.shippingCharge || 0),
        adjustment: Number(form.adjustment || 0),
        roundOff: Number(form.roundOff || 0),
        grandTotal: Number(calc.grand.toFixed(2)),
        currency,
      },
      shippingTaxId: form.shippingTaxId || undefined, // <-- important
    };

    try {
      if (onSubmit) {
        await onSubmit(payload);
      } else {
        const res = await fetch(`${API_BASE}/api/sales-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (res.status === 409) {
          const body = await res.json().catch(() => ({}));
          alert(body?.error || "Insufficient stock");
          setSaving(false);
          return;
        }

        if (!res.ok) throw new Error("Failed to save the sales order");
      }
      alert("Sales Order saved successfully!");
    } catch (e) {
      console.error(e);
      alert(e.message || "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="mx-auto max-w-7xl space-y-6 px-4" onSubmit={(e) => e.preventDefault()}>
      {/* Title */}
      <div className="flex items-center gap-3">
        <span className="text-2xl">🛒</span>
        <h2 className="text-2xl font-semibold">New Sales Order</h2>
      </div>

      {/* Customer Name + details */}
      <section className="rounded-xl bg-gray-50 py-4">
        <div className="flex flex-col">
          <label className="mb-1 text-sm font-medium text-red-500">Customer Name*</label>

          <div className="flex items-center gap-2">
            <div className="flex-1">
              <CustomerAutocomplete
                value={form.customerId}
                onChange={(id) => setForm((f) => ({ ...f, customerId: id }))}
              />
            </div>

            {/* Currency chip */}
            <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
              {selectedCustomer?.currency || "USD"}
            </span>
          </div>

          {/* View details link */}
          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 text-[11px] text-gray-500">
              👤
            </span>
            <button
              type="button"
              className="text-indigo-600 hover:underline"
              onClick={() =>
                selectedCustomer &&
                window.open(`/customers/${selectedCustomer._id}`, "_blank")
              }
            >
              View Customer Details
            </button>
          </div>

          {/* Addresses */}
          {selectedCustomer && (
            <>
              <div className="mt-5 flex flex-wrap gap-8">
                <AddressBlock
                  title="Billing Address"
                  addr={selectedCustomer.billingAddress}
                  contact={
                    selectedCustomer.billingAddress?.attention ||
                    selectedCustomer.firstName ||
                    selectedCustomer.name ||
                    selectedCustomer.displayName
                  }
                />
                <AddressBlock
                  title="Shipping Address"
                  addr={selectedCustomer.shippingAddress}
                  contact={
                    selectedCustomer.shippingAddress?.attention ||
                    selectedCustomer.shippingAddress?.contact ||
                    selectedCustomer.firstName ||
                    selectedCustomer.name ||
                    selectedCustomer.displayName
                  }
                />
              </div>

              {/* Remarks */}
              <Remarks text={selectedCustomer.remarks || selectedCustomer.notes || ""} />
            </>
          )}
        </div>
      </section>

      {/* Header fields */}
      <section className="flex flex-wrap gap-4">
        <div className="flex w-full flex-col md:basis-[48%]">
          <label className="mb-1 text-sm font-medium text-red-500">Sales Order#*</label>
          <div className="flex items-center gap-2">
            <input
              value={form.salesOrderNo || ""}
              onChange={(e) => setForm((f) => ({ ...f, salesOrderNo: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <button
              type="button"
              className="rounded-md border border-gray-200 px-2 py-2 text-gray-500"
              title="Numbering settings"
            >
              ⚙️
            </button>
          </div>
        </div>

        <div className="flex w/full flex-col md:basis-[48%]">
          <label className="mb-1 text-sm text-gray-600">Reference#</label>
          <input
            value={form.referenceNo}
            onChange={(e) => setForm((f) => ({ ...f, referenceNo: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex w-full flex-col md:basis-[48%]">
          <label className="mb-1 text-sm font-medium text-red-500">Sales Order Date*</label>
          <input
            type="date"
            required
            value={form.salesOrderDate}
            onChange={(e) => setForm((f) => ({ ...f, salesOrderDate: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex w-full flex-col md:basis-[48%]">
          <label className="mb-1 text-sm text-gray-600">Expected Shipment Date</label>
          <input
            type="date"
            value={form.expectedShipmentDate}
            onChange={(e) => setForm((f) => ({ ...f, expectedShipmentDate: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex w-full flex-col md:basis-[48%]">
          <label className="mb-1 text-sm text-gray-600">Payment Terms</label>
          <select
            value={form.paymentTerm}
            onChange={(e) => setForm((f) => ({ ...f, paymentTerm: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {paymentTerms.map((p) => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </section>

      <hr className="my-4 border-gray-200" />

      <section className="flex flex-wrap gap-4">
        <div className="flex w-full flex-col md:basis-[48%]">
          <label className="mb-1 text-sm text-gray-600">Delivery Method</label>
          <select
            value={form.deliveryMethod}
            onChange={(e) => setForm((f) => ({ ...f, deliveryMethod: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select a delivery method or type to add</option>
            {deliveryMethods.map((d) => (
              <option key={d.value || d} value={d.value || d}>{d.label || d}</option>
            ))}
          </select>
        </div>

        <div className="flex w-full flex-col md:basis-[48%]">
          <label className="mb-1 text-sm text-gray-600">Salesperson</label>
          <select
            value={form.salespersonId}
            onChange={(e) => setForm((f) => ({ ...f, salespersonId: e.target.value }))}
            className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select or Add Salesperson</option>
            {salespersons.map((s) => (
              <option key={s._id || s.value} value={s._id || s.value}>{s.name || s.label}</option>
            ))}
          </select>
        </div>
      </section>

      {/* Price List */}
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300">📋</span>
        <span className="min-w-[7rem]">Select Price List</span>
        <select
          value={form.priceListId}
          onChange={(e) => setForm((f) => ({ ...f, priceListId: e.target.value }))}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">—</option>
          {priceLists.map((pl) => (
            <option key={pl._id} value={pl._id}>{pl.name}</option>
          ))}
        </select>
        <button type="button" className="ml-1 text-gray-500">▾</button>
      </div>

      {/* Items table */}
      <section className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full rounded-2xl border border-gray-200 bg-white p-4 shadow-sm lg:flex-[1_1_70%]">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-base font-semibold">Item Table</h3>
            <button type="button" className="text-sm text-indigo-600">
              <span className="mr-1">✔️</span>Bulk Actions
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="p-2 font-medium">ITEM DETAILS</th>
                  <th className="p-2 font-medium">QUANTITY</th>
                  <th className="p-2 font-medium">RATE</th>
                  <th className="p-2 font-medium">DISCOUNT</th>
                  <th className="p-2 font-medium">TAX</th>
                  <th className="p-2 text-right font-medium">AMOUNT</th>
                  <th className="p-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const cr = calc.calcRows[i];
                  return (
                    <tr key={r.id} className="border-b border-gray-100">
                      <td className="p-2">
                        <div className="flex items-center gap-3">
                          <div className="grid h-8 w-5 grid-cols-2 gap-0.5 opacity-50">
                            {[...Array(6)].map((_, k) => (
                              <span key={k} className="h-1.5 w-1.5 rounded bg-gray-300" />
                            ))}
                          </div>
                          <div className="h-10 w-12 rounded border border-gray-200 bg-gray-50" />
                          <ItemAutocomplete
                            value={r.itemId}
                            priceListId={form.priceListId}
                            onChange={(itemId) => updateRow(r.id, { itemId })}
                            onPick={(it) => {
                              const rate =
                                it.prices && form.priceListId && it.prices[form.priceListId] != null
                                  ? it.prices[form.priceListId]
                                  : it.price ?? 0;

                              const stockAvailable =
                                typeof it.availableQty === "number" ? it.availableQty : Infinity;

                              const currentQ = Number(r.quantity || 1);
                              const clampedQ = Number.isFinite(stockAvailable)
                                ? Math.min(currentQ, stockAvailable)
                                : currentQ;

                              updateRow(r.id, {
                                itemId: it._id,
                                freeText: "",
                                rate,
                                taxId: it.taxId || null,       // <-- no empty string
                                stockAvailable,
                                quantity: clampedQ,
                              });
                            }}
                            onFreeText={(text) => {
                              if (!r.itemId) updateRow(r.id, { freeText: text });
                            }}
                          />
                        </div>
                      </td>

                      <td className="p-2 align-top">
                        {(() => {
                          const maxCap = maxQtyForRow(r);
                          return (
                            <input
                              type="number"
                              min={0}
                              step="1"
                              value={r.quantity}
                              max={Number.isFinite(maxCap) ? maxCap : undefined}
                              onChange={(e) => {
                                let q = asNumberOrZero(e.target.value);
                                if (Number.isFinite(maxCap) && q > maxCap) q = maxCap;
                                updateRow(r.id, { quantity: q });
                              }}
                              className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            />
                          );
                        })()}
                      </td>

                      <td className="p-2 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={r.rate}
                            onChange={(e) => updateRow(r.id, { rate: asNumberOrZero(e.target.value) })}
                            className="w-28 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-gray-400">🧮</span>
                        </div>
                      </td>

                      <td className="p-2 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            step="0.01"
                            value={r.discount}
                            onChange={(e) => updateRow(r.id, { discount: asNumberOrZero(e.target.value) })}
                            className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <span className="text-sm text-gray-500">%</span>
                        </div>
                      </td>

                      <td className="p-2 align-top">
                        <select
                          value={r.taxId || ""}
                          onChange={(e) => updateRow(r.id, { taxId: e.target.value || null })}
                          className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select a Tax</option>
                          {taxes.map((t) => (
                            <option key={t._id} value={t._id}>
                              {t.name} ({t.rate}%)
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-2 text-right tabular-nums">
                        {fmtMoney(cr.total)}
                      </td>

                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="rounded-md border border-gray-200 px-2 py-1"
                            title="Row actions"
                          >
                            ⋮
                          </button>
                          <button
                            type="button"
                            onClick={() => removeRow(r.id)}
                            className="rounded-md border border-red-200 px-2 py-1 text-red-600 hover:bg-red-50"
                            title="Remove row"
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Summary + notes */}
      <section className="flex flex-row flex-wrap content-start items-start gap-[20px]">
        <div className="mb-4 w-auto flex-1">
          <button
            type="button"
            onClick={addRow}
            className="mb-4 inline-flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
          >
            <span>➕</span> Add New Row <span className="ml-2 text-gray-500">▾</span>
          </button>

          <div className="w-full lg:flex-1">
            <h4 className="mb-2 text-sm font-semibold text-gray-800">Customer Notes</h4>
            <textarea
              rows={3}
              placeholder="Enter any notes to be displayed in your transaction"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <h4 className="mb-2 text-sm font-semibold text-gray-800">Terms & Conditions</h4>
            <textarea
              rows={3}
              placeholder="Enter the terms and conditions of your business to be displayed in your transaction"
              value={form.terms}
              onChange={(e) => setForm((f) => ({ ...f, terms: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="w-auto flex-1 space-y-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Sub Total</span>
            <strong className="tabular-nums">{fmtMoney(calc.subTotal)}</strong>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Shipping Charges</span>
              <InfoIcon text="Any delivery/handling fee you want to add to this sales order. Tax can be applied below." />
            </div>
            <input
              type="number"
              min={0}
              step="0.01"
              value={form.shippingCharge}
              onChange={(e) =>
                setForm((f) => ({ ...f, shippingCharge: asNumberOrZero(e.target.value) }))
              }
              className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="button"
            className="text-left text-sm text-indigo-600 underline"
            onClick={() => setShowShipTax((v) => !v)}
          >
            Apply Tax on Shipping Charge
          </button>
          {showShipTax && (
            <select
              value={form.shippingTaxId}
              onChange={(e) => setForm((f) => ({ ...f, shippingTaxId: e.target.value }))}
              className="w-44 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">—</option>
              {taxes.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.name} ({t.rate}%)
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">
                <span className="rounded border border-dashed px-3 py-1">Adjustment</span>
              </span>
              <InfoIcon text="Manual +/- tweak to your total (e.g., discount, small correction). This applies after subtotal + tax." />
            </div>
            <input
              type="number"
              step="0.01"
              value={form.adjustment}
              onChange={(e) => setForm((f) => ({ ...f, adjustment: asNumberOrZero(e.target.value) }))}
              className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700">Round Off</span>
              <InfoIcon text="Final rounding to match invoice total conventions (e.g., round to 2 decimals)." />
            </div>
            <input
              type="number"
              step="0.01"
              value={form.roundOff}
              onChange={(e) => setForm((f) => ({ ...f, roundOff: asNumberOrZero(e.target.value) }))}
              className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mt-2 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-base font-semibold">Total ( {currency} )</span>
            <strong className="text-lg tabular-nums">{fmtMoney(calc.grand)}</strong>
          </div>
        </div>
      </section>

      {/* Attachments */}
      <section className="flex flex-col gap-6 lg:flex-row">
        <div className="w-full lg:flex-1">
          <h4 className="mb-2 text-sm font-semibold text-gray-800">Attach File(s) to Sales Order</h4>
          <div className="flex items-center gap-2">
            <label className="inline-flex cursor-pointer items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium shadow-sm hover:bg-gray-50">
              ⬆️ Upload File
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    files: Array.from(e.target.files || []).slice(0, 10),
                  }))
                }
              />
            </label>
            <button type="button" className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm">▾</button>
          </div>
          <p className="mt-2 text-xs text-gray-500">You can upload a maximum of 10 files, 5MB each</p>
        </div>
      </section>

      {/* Sticky footer */}
      <div className="sticky bottom-0 z-20 w-full border-t bg-white px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => handleSubmit("draft")}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save as Draft
            </button>
            <div className="relative">
              <button
                type="button"
                disabled={saving}
                onClick={() => handleSubmit("confirmed")}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save and Send
              </button>
              <button
                type="button"
                className="ml-1 rounded-md border border-blue-200 bg-blue-50 px-2 py-2 text-sm text-blue-700"
                title="More actions"
              >
                ▾
              </button>
            </div>
            <button
              type="button"
              onClick={() => (window.history?.back?.(), null)}
              className="rounded-md border border-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
          <div className="text-right text-sm text-gray-700">
            <div> Total Amount: {currency} {fmtMoney(calc.grand)} </div>
            <div className="text-xs text-gray-500"> Total Quantity: {calc.totalQty} </div>
          </div>
        </div>
      </div>
    </form>
  );
}
