// src/pages/ViewSalesOrder.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || "";
const fmtMoney = (n) => (isNaN(n) ? "0.00" : Number(n).toFixed(2));
const safeDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

// attachments helpers
const prettyBytes = (n) => {
  if (!Number.isFinite(n)) return "—";
  const u = ["B", "KB", "MB", "GB", "TB"];
  let i = 0, v = n;
  while (v >= 1024 && i < u.length - 1) { v /= 1024; i++; }
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
  const [markingPaid, setMarkingPaid] = useState(false);

  // payment form
  const [payOpen, setPayOpen] = useState(false);
  const [savingPay, setSavingPay] = useState(false);
  const [payForm, setPayForm] = useState({
    amount: "",
    method: "cash",
    reference: "",
    date: "",
    note: "",
  });
  const [payError, setPayError] = useState("");

  const reload = async () => {
    setLoading(true);
    setErr("");
    try {
      const res = await fetch(`${API_BASE}/api/sales-orders/${id}`);
      if (!res.ok) throw new Error("Failed to fetch sales order");
      const data = await res.json();

      // normalize filesMeta
      let filesMeta = data.filesMeta;
      if (typeof filesMeta === "string") {
        try { filesMeta = JSON.parse(filesMeta); } catch { filesMeta = []; }
      }
      if (!Array.isArray(filesMeta)) filesMeta = [];
      setOrder({ ...data, filesMeta });

      // fetch items referenced by id
      const uniqueItemIds = [
        ...new Set(
          (data.items || [])
            .map((it) => (typeof it.itemId === "object" ? it.itemId?._id : it.itemId))
            .filter(Boolean)
            .map(String)
        ),
      ];
      const pairs = await Promise.all(
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
      setItemsById(Object.fromEntries(pairs));

      // taxes
      try {
        const tr = await fetch(`${API_BASE}/api/taxes`);
        if (tr.ok) {
          const list = await tr.json();
          const map = {};
          (Array.isArray(list) ? list : []).forEach((t) => (map[t._id] = t));
          setTaxesById(map);
        }
      } catch {}
    } catch (e) {
      setErr(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [id]);

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
      : (status || "draft") === "paid"
      ? "bg-purple-100 text-purple-700"
      : "bg-gray-100 text-gray-700";

  const paymentBadge = (paymentStatus) =>
    (paymentStatus || "unpaid") === "paid"
      ? "bg-purple-100 text-purple-700"
      : paymentStatus === "partially_paid"
      ? "bg-amber-100 text-amber-700"
      : paymentStatus === "overdue"
      ? "bg-red-100 text-red-700"
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

  const markPaid = async () => {
    try {
      setMarkingPaid(true);
      const r1 = await fetch(`${API_BASE}/api/sales-orders/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "paid" }),
      });
      if (!r1.ok) throw new Error("Failed to mark status as paid");
      const updated1 = await r1.json();
      await fetch(`${API_BASE}/api/sales-orders/${id}/payment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentStatus: "paid" }),
      }).catch(() => {});
      setOrder((o) => ({ ...(o || {}), ...updated1, paymentStatus: "paid" }));
    } catch (e) {
      alert(e.message || "Failed to mark as paid");
    } finally {
      setMarkingPaid(false);
    }
  };

  // computed amounts
  const currency = order?.totals?.currency || "$";
  const amountPaid = Number(order?.amountPaid || 0);
  const grand = Number(order?.totals?.grandTotal ?? 0);
  const remaining = Math.max(grand - amountPaid, 0);
  const EPS = 0.005;

  // add payment (guard overpay)
  const addPayment = async () => {
    const n = Number(payForm.amount);
    if (!Number.isFinite(n) || n <= 0) {
      setPayError("Enter a valid amount.");
      return;
    }
    if (n > remaining + EPS) {
      setPayError(`Amount exceeds remaining balance (${currency} ${fmtMoney(remaining)}).`);
      return;
    }
    setPayError("");
    try {
      setSavingPay(true);
      const res = await fetch(`${API_BASE}/api/sales-orders/${id}/payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: n,
          method: payForm.method,
          reference: payForm.reference || "",
          date: payForm.date || undefined,
          note: payForm.note || "",
        }),
      });
      if (!res.ok) throw new Error("Failed to add payment");
      const updated = await res.json();
      setOrder(updated);
      setPayForm({ amount: "", method: "cash", reference: "", date: "", note: "" });
      setPayOpen(false);
    } catch (e) {
      alert(e.message || "Failed to add payment");
    } finally {
      setSavingPay(false);
    }
  };

  // delete a payment
  const deletePayment = async (paymentId) => {
    if (!confirm("Delete this payment?")) return;
    try {
      const res = await fetch(`${API_BASE}/api/sales-orders/${id}/payments/${paymentId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete payment");
      const updated = await res.json();
      setOrder(updated);
    } catch (e) {
      alert(e.message || "Failed to delete payment");
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

  const balance = remaining;

  return (
    <div className="mx-auto max-w-6xl p-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-800">
            Sales Order {order.salesOrderNo || ""}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-600">
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
            {order.status === "paid" && (
              <>
                <span className="text-gray-300">•</span>
                <span>Paid on: {safeDate(order.paidAt)}</span>
              </>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
            <option value="paid">paid</option>
            <option value="cancelled">cancelled</option>
          </select>

          {order.status !== "paid" && (
            <button
              onClick={markPaid}
              disabled={markingPaid}
              className="rounded-md border border-purple-200 bg-purple-50 px-3 py-2 text-sm text-purple-700 hover:bg-purple-100 disabled:opacity-60"
              title="Mark as Paid"
            >
              {markingPaid ? "Marking…" : "Mark Paid"}
            </button>
          )}

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

          {/* Payment summary + Add Payment */}
          <div className="mt-4 rounded-lg border border-gray-200 p-3">
            <div className="mb-1 flex items-center gap-2">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Payment
              </div>
              <span className={`rounded px-2 py-0.5 text-xs ${paymentBadge(order.paymentStatus)}`}>
                {(order.paymentStatus || "unpaid").replace("_", " ")}
              </span>
              <button
                type="button"
                onClick={() => { setPayOpen((v) => !v); setPayError(""); }}
                className="ml-auto rounded-md border border-gray-200 bg-white px-2 py-1 text-xs hover:bg-gray-50"
              >
                + Record Payment
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-gray-600">
                Paid: {currency} {fmtMoney(order.amountPaid || 0)}
              </span>
              <span className="text-gray-300">•</span>
              <span className="text-gray-600">
                Balance: {currency} {fmtMoney(balance)}
              </span>
              {order.paymentDate && (
                <>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-600">Payment Date: {safeDate(order.paymentDate)}</span>
                </>
              )}
            </div>

            {Array.isArray(order.payments) && order.payments.length > 0 && (
              <div className="mt-3 space-y-1 text-sm">
                {order.payments.map((p) => (
                  <div
                    key={p._id}
                    className="flex flex-wrap items-center justify-between rounded border border-gray-100 p-2"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="font-medium">
                        + {currency} {fmtMoney(p.amount)}
                      </span>
                      <span className="text-gray-500">{p.method}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-gray-600">{safeDate(p.date)}</span>
                      {p.reference && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">Ref: {p.reference}</span>
                        </>
                      )}
                      {p.note && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-gray-500">Note: {p.note}</span>
                        </>
                      )}
                    </div>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={() => deletePayment(p._id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            )}

            {payOpen && (
              <div className="mt-3 grid grid-cols-1 gap-2 rounded-md border border-gray-200 p-3">
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    max={remaining || undefined}
                    placeholder="Amount"
                    value={payForm.amount}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = Number(v);
                      if (Number.isFinite(n) && n > remaining) {
                        setPayError(`Amount exceeds remaining balance (${currency} ${fmtMoney(remaining)}).`);
                      } else {
                        setPayError("");
                      }
                      setPayForm((f) => ({ ...f, amount: v }));
                    }}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <select
                    value={payForm.method}
                    onChange={(e) => setPayForm((f) => ({ ...f, method: e.target.value }))}
                    className="rounded-md border border-gray-300 bg-white px-2 py-1 text-sm"
                  >
                    <option value="cash">Cash</option>
                    <option value="card">Card</option>
                    <option value="bank">Bank</option>
                    <option value="cheque">Cheque</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="text-xs text-gray-500">
                  Remaining: {currency} {fmtMoney(remaining)}
                </div>
                {!!payError && <div className="text-xs text-red-600">{payError}</div>}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={payForm.date}
                    onChange={(e) => setPayForm((f) => ({ ...f, date: e.target.value }))}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                  <input
                    placeholder="Reference"
                    value={payForm.reference}
                    onChange={(e) => setPayForm((f) => ({ ...f, reference: e.target.value }))}
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                  />
                </div>
                <textarea
                  rows={2}
                  placeholder="Note (optional)"
                  value={payForm.note}
                  onChange={(e) => setPayForm((f) => ({ ...f, note: e.target.value }))}
                  className="rounded-md border border-gray-300 px-2 py-1 text-sm"
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => { setPayOpen(false); setPayError(""); }}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1 text-sm hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={
                      savingPay ||
                      !payForm.amount ||
                      Number(payForm.amount) <= 0 ||
                      Number(payForm.amount) > remaining + EPS
                    }
                    onClick={addPayment}
                    className="rounded-md bg-indigo-600 px-3 py-1 text-sm font-medium text-white disabled:opacity-60"
                  >
                    {savingPay ? "Saving…" : "Save Payment"}
                  </button>
                </div>
              </div>
            )}
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
                  <td className="p-2 tabular-nums">{Number(ln.discount || 0).toFixed(2)}</td>
                  <td className="p-2 text-gray-600">
                    {ln._taxName ? `${ln._taxName} (${ln._taxRate}%)` : ln.taxId ? `${ln._taxRate}%` : "—"}
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
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes || "—"}</div>

          <div className="mt-4 mb-2 text-sm font-semibold text-gray-800">Terms & Conditions</div>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">{order.terms || "—"}</div>

          {Array.isArray(order.filesMeta) && order.filesMeta.length > 0 && (
            <>
              <div className="mt-4 mb-2 text-sm font-semibold text-gray-800">Attachments</div>
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
                        <div className="mt-1 text-xs text-indigo-600 underline">Open</div>
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
