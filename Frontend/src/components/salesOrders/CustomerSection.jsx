import React, { useEffect, useRef, useState } from "react";

const API_BASE = import.meta.env?.VITE_API_BASE || "";

/* Customer Autocomplete (safe, server-side search + debounce) */
function CustomerAutocomplete({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const listRef = useRef(null);
  const acRef = useRef(null);

  // reflect selected -> visible text
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
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [value]);

  // debounced search
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

  // outside click
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
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(c);
                }}
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

function AddressBlock({ title, addr = {}, contact }) {
  const {
    country, addressNo, street1, street2, city, district, zipCode, phone, fax,
  } = addr || {};
  return (
    <div className="min-w-[260px] flex-1">
      <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
        {title}
        <span className="text-gray-300">⎯</span>
        <span className="inline-flex h-4 w-4 items-center justify-center rounded border border-gray-300 text-[10px] text-gray-500">✎</span>
      </div>
      {contact && <div className="mb-1 font-semibold">{contact}</div>}
      <div className="space-y-0.5 text-sm leading-relaxed text-gray-800">
        {addressNo || street1 ? (<div>{[addressNo, street1].filter(Boolean).join(" ")}</div>) : null}
        {street2 && <div>{street2}</div>}
        {(city || district || zipCode) && (<div>{[city, district, zipCode].filter(Boolean).join(", ")}</div>)}
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
          <button type="button" className="ml-2 text-indigo-600 hover:underline" title={text}>
            more…
          </button>
        )}
      </div>
    </div>
  );
}

export default function CustomerSection({
  form,
  setForm,
  selectedCustomer,
  setSelectedCustomer,
}) {
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
  }, [form.customerId, setSelectedCustomer]);

  return (
    <section className="rounded-xl bg-gray-50 py-4">
      <div className="flex flex-col">
        <label className="mb-1 text-sm font-medium text-red-500">
          Customer Name*
        </label>

        <div className="flex items-center gap-2">
          <div className="flex-1">
            <CustomerAutocomplete
              value={form.customerId}
              onChange={(id) => setForm((f) => ({ ...f, customerId: id }))}
            />
          </div>
          <span className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700">
            {selectedCustomer?.currency || "USD"}
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-gray-300 text-[11px] text-gray-500">
            👤
          </span>
          <button
            type="button"
            className="text-indigo-600 hover:underline"
            onClick={() =>
              selectedCustomer && window.open(`/customers/${selectedCustomer._id}`, "_blank")
            }
          >
            View Customer Details
          </button>
        </div>

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

            <Remarks text={selectedCustomer.remarks || selectedCustomer.notes || ""} />
          </>
        )}
      </div>
    </section>
  );
}
