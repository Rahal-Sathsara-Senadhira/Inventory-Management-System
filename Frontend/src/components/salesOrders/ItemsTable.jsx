import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "";
const fmtMoney = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));

/* Item Autocomplete (portal to body so it won't be clipped) */
function ItemAutocomplete({ value, onChange, onPick, onFreeText, priceListId }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const inputRef = useRef(null);
  const acRef = useRef(null);

  const EXTRA_WIDTH = 80;
  const MIN_WIDTH = 300;
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePosition = () => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    setPos({
      top: r.bottom + 4,
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

  // selected id -> visible text
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
      } catch {}
    })();
    return () => { alive = false; };
  }, [value]);

  // debounced server search
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
        const res = await fetch(`${API_BASE}/api/items/search?q=${encodeURIComponent(q)}`, { signal: ac.signal });
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

  // outside click / esc
  useEffect(() => {
    if (!open) return;
    const onDoc = (e) => {
      const insideInput = inputRef.current?.contains(e.target);
      const insideList = (el) => {
        while (el) { if (el.dataset?.role === "item-listbox") return true; el = el.parentElement; }
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
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (items[active]) select(items[active]); }
    else if (e.key === "Escape") { setOpen(false); }
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
            onChange={(e) => { const text = e.target.value; setQuery(text); onFreeText?.(text); }}
            onFocus={() => { setOpen(true); updatePosition(); }}
            onKeyDown={onKeyDown}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            role="combobox"
            aria-expanded={open}
            aria-autocomplete="list"
          />
        </div>
      </div>

      {open && createPortal(
        <ul
          data-role="item-listbox"
          role="listbox"
          style={{ position: "fixed", top: pos.top, left: pos.left, width: pos.width, maxHeight: "20rem", overflow: "auto", zIndex: 2147483647 }}
          className="rounded-lg border border-gray-200 bg-white p-1 shadow-lg"
        >
          {loading && <li className="px-3 py-2 text-sm text-gray-500">Searching…</li>}
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
                    style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "70%" }}
                    title={it.name}
                  >
                    {it.name || "(unnamed item)"}
                  </div>
                  {it.sku && (
                    <div className="text-xs text-gray-500 text-right" style={{ whiteSpace: "nowrap" }}>
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
                  Rate: {fmtMoney(price)} · In stock: {it.stock ?? 0}
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

export default function ItemsTable({
  rows,
  setRows,
  calcRows, // array aligned with rows (from parent calc)
  taxes,
  priceListId,
  asNumberOrZero,
}) {
  const updateRow = (id, patch) =>
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const removeRow = (id) => setRows((rs) => rs.filter((r) => r.id !== id));

  return (
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
                const cr = calcRows[i]; // { total, ... }
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
                          priceListId={priceListId}
                          onChange={(itemId) => {
                            updateRow(r.id, { itemId });
                          }}
                          onPick={(it) => {
                            const rate =
                              it.prices && priceListId && it.prices[priceListId] != null
                                ? it.prices[priceListId]
                                : it.price ?? 0;

                            const maxQty =
                              typeof it.stock === "number"
                                ? Math.max(0, Math.floor(it.stock))
                                : undefined;

                            let nextQty = r.quantity ?? 1;
                            if (typeof maxQty === "number") {
                              nextQty = Math.min(nextQty || 1, maxQty);
                            }
                            updateRow(r.id, {
                              itemId: it._id,
                              freeText: "",
                              rate,
                              taxId: it.taxId || "",
                              maxQty,
                              quantity: nextQty || 1,
                            });
                          }}
                          onFreeText={(text) => {
                            if (!r.itemId) updateRow(r.id, { freeText: text });
                          }}
                        />
                      </div>
                    </td>

                    <td className="p-2 align-top">
                      <input
                        type="number"
                        min={0}
                        step="1"
                        max={typeof r.maxQty === "number" ? r.maxQty : undefined}
                        value={r.quantity}
                        onChange={(e) => {
                          const v = asNumberOrZero(e.target.value);
                          const capped =
                            typeof r.maxQty === "number"
                              ? Math.min(Math.max(0, v), r.maxQty)
                              : Math.max(0, v);
                          updateRow(r.id, { quantity: capped });
                        }}
                        className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </td>

                    <td className="p-2 align-top">
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={r.rate}
                          onChange={(e) =>
                            updateRow(r.id, { rate: asNumberOrZero(e.target.value) })
                          }
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
                          onChange={(e) =>
                            updateRow(r.id, { discount: asNumberOrZero(e.target.value) })
                          }
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                    </td>

                    <td className="p-2 align-top">
                      <select
                        value={r.taxId || ""}
                        onChange={(e) => updateRow(r.id, { taxId: e.target.value || "" })}
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
                      {fmtMoney(cr?.total ?? 0)}
                    </td>

                    <td className="p-2">
                      <div className="flex items-center gap-2">
                        <button type="button" className="rounded-md border border-gray-200 px-2 py-1" title="Row actions">
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
  );
}
