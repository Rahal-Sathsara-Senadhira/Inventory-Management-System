// src/pages/ViewSalesOrder.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "";
const fmtMoney = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
const safeDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

// helpers for attachments
const prettyBytes = (n) => {
  if (!Number.isFinite(n)) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < u.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${u[i]}`;
};
const getFileUrl = (u) => (u?.startsWith("http") ? u : `${API_BASE}${u || ""}`);
const isImageUrl = (u = "", type = "") => {
  if (String(type).toLowerCase().startsWith("image/")) return true;
  const ext = u.split("?")[0].toLowerCase();
  return /\.(png|jpe?g|webp|gif|bmp|svg)$/.test(ext);
};
const fileEmoji = (t = "") => {
  const m = t.toLowerCase();
  if (m.startsWith("image/")) return "🖼️";
  if (m.includes("pdf")) return "📄";
  if (m.includes("zip") || m.includes("compressed")) return "🗜️";
  if (m.includes("sheet") || m.includes("excel") || m.endsWith("csv")) return "📊";
  if (m.includes("word") || m.endsWith("doc") || m.endsWith("docx")) return "📝";
  return "📎";
};

export default function ViewSalesOrder() {
  const { type, id } = useParams(); // /inventory/:type/salesOrders/:id
  const base = type ?? "sales";
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [itemsById, setItemsById] = useState({});
  const [taxesById, setTaxesById] = useState({});
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      setErr("");
      try {
        const res = await fetch(`${API_BASE}/api/sales-orders/${id}`);
        if (!res.ok) throw new Error("Failed to fetch sales order");
        const data = await res.json();

        // Normalize filesMeta (could be array or JSON string)
        let filesMeta = data.filesMeta;
        if (typeof filesMeta === "string") {
          try {
            filesMeta = JSON.parse(filesMeta);
          } catch {
            filesMeta = [];
          }
        }
        if (!Array.isArray(filesMeta)) filesMeta = [];
        if (!alive) return;

        setOrder({ ...data, filesMeta });

        // Fetch all items referenced by id strings
        const uniqueItemIds = [
          ...new Set(
            (data.items || [])
              .map((it) => (typeof it.itemId === "object" ? it.itemId?._id : it.itemId))
              .filter(Boolean)
              .map(String)
          ),
        ];
        const itemPairs = await Promise.all(
          uniqueItemIds.map(async (iid) => {
            try {
              const r = await fetch(`${API_BASE}/api/items/${iid}`);
              if (!r.ok) throw new Error();
              return [iid, await r.json()];
            } catch {
              return [iid, null];
            }
          })
        );
        if (!alive) return;
        setItemsById(Object.fromEntries(itemPairs));

        // Fetch taxes
        try {
          const tr = await fetch(`${API_BASE}/api/taxes`);
          if (tr.ok) {
            const tlist = await tr.json();
            const map = {};
            (Array.isArray(tlist) ? tlist : []).forEach((t) => (map[t._id] = t));
            if (alive) setTaxesById(map);
          }
        } catch {
          /* ignore */
        }
      } catch (e) {
        if (alive) setErr(e.message || "Something went wrong");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  const lines = useMemo(() => {
    if (!order) return [];
    return (order.items || []).map((r) => {
      const qty = Number(r.quantity || 0);
      const rate = Number(r.rate || 0);
      const disc = Number(r.discount || 0);
      const base = qty * rate * (1 - disc / 100);

      const taxKey = r.taxId ? String(r.taxId) : "";
      const taxRate = taxesById[taxKey]?.rate || 0;
      const tax = base * (taxRate / 100);
      const total = base + tax;

      const item =
        r.itemId
          ? itemsById[String(typeof r.itemId === "object" ? r.itemId._id : r.itemId)] ||
            (typeof r.itemId === "object" ? r.itemId : null)
          : null;

      const label =
        r.freeText || item?.name || (r.itemId ? `#${String(r.itemId).slice(-6)}` : "(free text)");

      return {
        ...r,
        _label: label,
        _sku: item?.sku || "",
        _unit: item?.unit || "",
        _taxName: taxesById[taxKey]?.name || "",
        _taxRate: taxRate,
        _base: base,
        _tax: tax,
        _total: total,
      };
    });
  }, [order, itemsById, taxesById]);

  const statusBadge = (status) =>
    (status || "draft") === "confirmed"
      ? "bg-green-100 text-green-700"
      : (status || "draft") === "cancelled"
      ? "bg-red-100 text-red-700"
      : (status || "draft") === "delivered"
      ? "bg-blue-100 text-blue-700"
      : "bg-gray-100 text-gray-700";

  const updateStatus = async (next) => {
    try {
      setSavingStatus(true);
      const res = await fetch(`${API_BASE}/api/sales-orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: next }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      const updated = await res.json();
      setOrder((o) => ({ ...(o || {}), ...updated }));
    } catch (e) {
      alert(e.message || "Failed to update status");
    } finally {
      setSavingStatus(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-6xl p-4 text-sm text-gray-600">Loading…</div>;
  }
  if (err || !order) {
    return (
      <div className="mx-auto max-w-6xl p-4">
        {!!err && <div className="mb-3 text-sm text-red-600">{err}</div>}
        <button
          onClick={() => navigate(-1)}
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>
    );
  }

  const currency = order?.totals?.currency || "$";

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-800">
            Sales Order {order.salesOrderNo || ""}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-gray-600">
            <span>Order Date: {safeDate(order.salesOrderDate)}</span>
            <span className="text-gray-300">•</span>
            <span>Expected Shipment: {safeDate(order.expectedShipmentDate)}</span>
            <span className="text-gray-300">•</span>
            <span>
              Status:{" "}
              <span className={`rounded px-2 py-0.5 text-xs ${statusBadge(order.status)}`}>
                {order.status || "draft"}
              </span>
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={order.status || "draft"}
            onChange={(e) => updateStatus(e.target.value)}
            disabled={savingStatus}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Change status"
          >
            <option value="draft">draft</option>
            <option value="confirmed">confirmed</option>
            <option value="delivered">delivered</option>
            <option value="cancelled">cancelled</option>
          </select>
          <button
            onClick={() => window.print()}
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50"
          >
            🖨️ Print
          </button>
          <Link to={`/inventory/${base}/salesOrders`}>
            <button className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm hover:bg-gray-50">
              ← Back
            </button>
          </Link>
        </div>
      </div>

      {/* Top meta */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Customer
          </div>
          <div className="text-sm text-gray-800">
            {order.customerName ||
              order.customerId?.displayName ||
              order.customerId?.name ||
              "—"}
          </div>
          {!!order.customerId?._id && (
            <button
              type="button"
              onClick={() => window.open(`/customers/${order.customerId._id}`, "_blank")}
              className="mt-2 text-xs text-indigo-600 hover:underline"
            >
              View customer →
            </button>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
            Details
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            <div className="text-gray-500">Reference #</div>
            <div className="text-gray-800">{order.referenceNo || "—"}</div>

            <div className="text-gray-500">Payment Terms</div>
            <div className="text-gray-800">{order.paymentTerm || "—"}</div>

            <div className="text-gray-500">Delivery Method</div>
            <div className="text-gray-800">{order.deliveryMethod || "—"}</div>

            <div className="text-gray-500">Salesperson</div>
            <div className="text-gray-800">{order.salespersonId || "—"}</div>

            <div className="text-gray-500">Price List</div>
            <div className="text-gray-800">{order.priceListId || "—"}</div>
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold text-gray-800">Items</h3>
          <div className="text-sm text-gray-600">
            {Array.isArray(order.items) ? order.items.length : 0} item(s)
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-gray-600">
              <tr>
                <th className="p-2 font-medium">ITEM</th>
                <th className="p-2 font-medium">SKU</th>
                <th className="p-2 font-medium">QTY</th>
                <th className="p-2 font-medium">UNIT</th>
                <th className="p-2 font-medium">RATE</th>
                <th className="p-2 font-medium">DISC%</th>
                <th className="p-2 font-medium">TAX</th>
                <th className="p-2 text-right font-medium">LINE TOTAL</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((ln, idx) => (
                <tr key={idx} className="border-t border-gray-100">
                  <td className="p-2">
                    <div className="text-gray-800">{ln._label}</div>
                  </td>
                  <td className="p-2 text-gray-500">{ln._sku || "—"}</td>
                  <td className="p-2 tabular-nums">{ln.quantity}</td>
                  <td className="p-2 text-gray-500">{ln._unit || "—"}</td>
                  <td className="p-2 tabular-nums">{fmtMoney(ln.rate)}</td>
                  <td className="p-2 tabular-nums">
                    {Number(ln.discount || 0).toFixed(2)}
                  </td>
                  <td className="p-2 text-gray-600">
                    {ln._taxName
                      ? `${ln._taxName} (${ln._taxRate}%)`
                      : ln.taxId
                      ? `${ln._taxRate}%`
                      : "—"}
                  </td>
                  <td className="p-2 text-right tabular-nums">
                    {currency} {fmtMoney(ln._total)}
                  </td>
                </tr>
              ))}
              {lines.length === 0 && (
                <tr>
                  <td className="p-2 text-sm text-gray-500" colSpan={8}>
                    No items in this order.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Notes + Attachments & Totals */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="mb-2 text-sm font-semibold text-gray-800">Customer Notes</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {order.notes || "—"}
          </div>

          <div className="mt-4 mb-2 text-sm font-semibold text-gray-800">
            Terms & Conditions
          </div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {order.terms || "—"}
          </div>

          {/* Attachments with thumbnails */}
          {Array.isArray(order.filesMeta) && order.filesMeta.length > 0 && (
            <>
              <div className="mt-4 mb-2 text-sm font-semibold text-gray-800">
                Attachments
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {order.filesMeta.map((f, i) => {
                  const url = getFileUrl(f.url);
                  const img = isImageUrl(url, f.type);
                  return (
                    <a
                      key={`${f.publicId || f.url || f.name}-${i}`}
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className="group flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm hover:border-indigo-300 hover:shadow"
                      title="Open attachment"
                    >
                      <div className="h-16 w-20 overflow-hidden rounded border border-gray-200 bg-gray-50">
                        {img ? (
                          <img
                            src={url}
                            alt={f.name || "attachment"}
                            className="h-full w-full object-cover transition-transform group-hover:scale-[1.03]"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-2xl">
                            {fileEmoji(f.type)}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium text-gray-800">
                          {f.name || f.url || "file"}
                        </div>
                        <div className="text-xs text-gray-500">
                          {(f.type || "—") + " · " + prettyBytes(f.size)}
                        </div>
                        <div className="mt-1 text-xs text-indigo-600 underline">
                          Open
                        </div>
                      </div>
                    </a>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold">Sub Total</span>
            <strong className="tabular-nums">
              {currency} {fmtMoney(order?.totals?.subTotal ?? 0)}
            </strong>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-700">Shipping Charges</span>
            <span className="tabular-nums">
              {currency} {fmtMoney(order?.shippingCharge ?? 0)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-700">Tax Total</span>
            <span className="tabular-nums">
              {currency} {fmtMoney(order?.totals?.taxTotal ?? 0)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-700">Adjustment</span>
            <span className="tabular-nums">
              {currency} {fmtMoney(order?.adjustment ?? 0)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <span className="text-sm text-gray-700">Round Off</span>
            <span className="tabular-nums">
              {currency} {fmtMoney(order?.roundOff ?? 0)}
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
            <span className="text-base font-semibold">Grand Total</span>
            <strong className="text-lg tabular-nums">
              {currency} {fmtMoney(order?.totals?.grandTotal ?? 0)}
            </strong>
          </div>
        </div>
      </div>
    </div>
  );
}
