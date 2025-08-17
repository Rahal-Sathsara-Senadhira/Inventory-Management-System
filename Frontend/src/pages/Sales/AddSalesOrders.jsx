// src/pages/AddSalesOrders.jsx
import React, { useEffect, useMemo, useState } from "react";

import SalesOrderHeader from "../../components/salesOrders/SalesOrderHeader.jsx";
import CustomerSection from "../../components/salesOrders/CustomerSection.jsx";
import ItemsTable from "../../components/salesOrders/ItemsTable.jsx";
import Attachments from "../../components/salesOrders/Attachments.jsx";

/* ----------------------------- helpers ------------------------------ */
const API_BASE = import.meta.env?.VITE_API_BASE || "";
const CLOUDINARY_CLOUD = import.meta.env?.VITE_CLOUDINARY_CLOUD || "";
const CLOUDINARY_PRESET = import.meta.env?.VITE_CLOUDINARY_PRESET || "";

const fmtMoney = (n) => (isNaN(n) ? "0.000" : Number(n).toFixed(3));
const todayISO = () => new Date().toISOString().slice(0, 10);
const uid = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);
const asNumberOrZero = (v) => (v === "" || v === null ? 0 : Number(v));
const normalizeDate = (v) => (v && String(v).trim() ? v : undefined);
const idOrUndef = (v) => (v && String(v).trim() ? v : undefined);

/* Small tooltip icon (kept locally, used in summary panel) */
function InfoIcon({ text }) {
  return (
    <div className="group relative inline-flex align-middle">
      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-gray-300 text-xs text-gray-500">?</span>
      <div
        role="tooltip"
        className="pointer-events-none absolute left-1/2 z-20 mt-2 w-60 -translate-x-1/2 rounded-md border border-gray-200 bg-white p-2 text-xs text-gray-700 shadow-lg opacity-0 transition-opacity group-hover:opacity-100"
      >
        {text}
      </div>
    </div>
  );
}

export default function AddSalesOrders({
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
  const taxes = taxesProp;
  const priceLists = priceListsProp;
  const deliveryMethods = deliveryMethodsProp;
  const paymentTerms = paymentTermsProp;

  const [salespersons, setSalespersons] = useState([]);
  const [saving, setSaving] = useState(false);
  const [showShipTax, setShowShipTax] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [filePreviews, setFilePreviews] = useState([]); // [{id, file, url, name, size, type}]

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
    maxQty: undefined,
  });
  const [rows, setRows] = useState([newRow()]);

  useEffect(() => {
    fetch(`${API_BASE}/api/salespersons`)
      .then((r) => r.json())
      .then((data) => setSalespersons(data))
      .catch((e) => console.error("Failed to load salespersons:", e));
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/sales-orders/next-order-number`);
        if (!res.ok) throw new Error("Failed to fetch next order number");
        const data = await res.json();
        setForm((f) => ({ ...f, salesOrderNo: data.nextOrderNumber }));
      } catch (e) {
        console.error("Failed to fetch next order number", e);
      }
    })();
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

  /* ---------------- cloudinary helpers ---------------- */
  async function uploadToCloudinary(file) {
    if (!CLOUDINARY_CLOUD || !CLOUDINARY_PRESET) {
      throw new Error("Cloudinary env vars are missing");
    }
    const url = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/auto/upload`;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("upload_preset", CLOUDINARY_PRESET);
    const res = await fetch(url, { method: "POST", body: fd });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Cloudinary upload failed: ${t}`);
    }
    const j = await res.json();
    return {
      name: j.original_filename || file.name,
      size: j.bytes || file.size,
      type: file.type || j.resource_type || "file",
      url: j.secure_url || j.url,
      publicId: j.public_id,
    };
  }
  async function uploadAllFiles(files = []) {
    const out = [];
    for (const f of files) out.push(await uploadToCloudinary(f));
    return out;
  }

  /* ---------------- file input previews ---------------- */
  const onFilesPicked = (e) => {
    const raw = Array.from(e.target.files || []);
    if (raw.length === 0) return;

    const filtered = raw.slice(0, 10).filter((f) => (f.size || 0) <= 5 * 1024 * 1024);
    const previews = filtered.map((f) => ({
      id: uid(),
      file: f,
      url: URL.createObjectURL(f),
      name: f.name,
      size: f.size,
      type: f.type,
    }));

    setForm((f) => ({ ...f, files: filtered }));
    setFilePreviews(previews);
  };
  const removePreview = (id) => {
    setFilePreviews((ps) => {
      const keep = ps.filter((p) => p.id !== id);
      const removed = ps.find((p) => p.id === id);
      if (removed?.url) URL.revokeObjectURL(removed.url);
      setForm((f) => ({ ...f, files: f.files.filter((x) => x !== removed?.file) }));
      return keep;
    });
  };

  /* ---------------- submit ---------------- */
  const handleSubmit = async (status = "draft") => {
    try {
      setSaving(true);

      // safety re-fetch next number
      let nextOrderNumber = form.salesOrderNo || "SO-0001";
      try {
        const res = await fetch(`${API_BASE}/api/sales-orders/next-order-number`);
        if (!res.ok) throw new Error("Failed to fetch next order number");
        const data = await res.json();
        nextOrderNumber = data.nextOrderNumber || nextOrderNumber;
      } catch (e) {
        console.error("Failed to fetch next order number", e);
      }

      // upload files (client → Cloudinary)
      let filesMeta = [];
      if (form.files && form.files.length > 0) {
        filesMeta = await uploadAllFiles(form.files);
      }

      // items payload
      const itemsPayload = rows.map(({ id, maxQty, ...r }) => ({
        itemId: r.itemId || null,
        freeText: r.freeText || "",
        quantity: Number(r.quantity ?? 0),
        rate: Number(r.rate ?? 0),
        discount: Number(r.discount ?? 0),
        taxId: r.taxId || undefined,
      }));

      // optional client-side qty guard
      for (const r of rows) {
        if (typeof r.maxQty === "number" && r.quantity > r.maxQty) {
          throw new Error(`Quantity for one item exceeds available stock (max ${r.maxQty}).`);
        }
      }

      const payload = {
        ...form,
        // normalize IDs/dates that mongoose casts as ObjectId/Date
        customerId: idOrUndef(form.customerId),
        salespersonId: form.salespersonId || "",
        priceListId: form.priceListId || "",
        salesOrderDate: normalizeDate(form.salesOrderDate),
        expectedShipmentDate: normalizeDate(form.expectedShipmentDate),
        status,
        salesOrderNo: nextOrderNumber,
        items: itemsPayload,
        shippingTaxId: idOrUndef(form.shippingTaxId),
        totals: {
          subTotal: Number(calc.subTotal.toFixed(2)),
          taxTotal: Number(calc.taxTotal.toFixed(2)),
          shippingCharge: Number(form.shippingCharge || 0),
          adjustment: Number(form.adjustment || 0),
          roundOff: Number(form.roundOff || 0),
          grandTotal: Number(calc.grand.toFixed(2)),
          currency,
        },
        filesMeta, // server ignores this if it prefers uploading itself; harmless
      };
      delete payload.files;

      if (onSubmit) {
        await onSubmit(payload);
      } else {
        const res = await fetch(`${API_BASE}/api/sales-orders`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          let reason = "Failed to save the sales order";
          try { const j = await res.json(); reason = j?.error || reason; } catch {}
          throw new Error(reason);
        }
      }

      alert("Sales Order saved successfully!");
      filePreviews.forEach((p) => p.url && URL.revokeObjectURL(p.url));
      setFilePreviews([]);
      setForm((f) => ({ ...f, files: [] }));
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

      {/* Customer */}
      <CustomerSection
        form={form}
        setForm={setForm}
        selectedCustomer={selectedCustomer}
        setSelectedCustomer={setSelectedCustomer}
      />

      {/* Header fields */}
      <SalesOrderHeader form={form} setForm={setForm} paymentTerms={paymentTerms} />

      <hr className="my-4 border-gray-200" />

      {/* Delivery + Salesperson */}
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
              <option key={d.value || d} value={d.value || d}>
                {d.label || d}
              </option>
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
              <option key={s._id || s.value} value={s._id || s.value}>
                {s.name || s.label}
              </option>
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
            <option key={pl._id} value={pl._id}>
              {pl.name}
            </option>
          ))}
        </select>
        <button type="button" className="ml-1 text-gray-500">▾</button>
      </div>

      {/* Items table */}
      <ItemsTable
        rows={rows}
        setRows={setRows}
        calcRows={calc.calcRows}
        taxes={taxes}
        priceListId={form.priceListId}
        asNumberOrZero={asNumberOrZero}
      />

      {/* Notes + Summary */}
      <section className="flex flex-row flex-wrap content-start items-start gap-[20px]">
        <div className="mb-4 w-auto flex-1">
          <button
            type="button"
            onClick={() => setRows((rs) => [...rs, newRow()])}
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
              onChange={(e) => setForm((f) => ({ ...f, shippingCharge: asNumberOrZero(e.target.value) }))}
              className="w-44 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button type="button" className="text-left text-sm text-indigo-600 underline" onClick={() => setShowShipTax((v) => !v)}>
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
      <Attachments onFilesPicked={onFilesPicked} filePreviews={filePreviews} removePreview={removePreview} />

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
            <div>Total Amount: {currency} {fmtMoney(calc.grand)}</div>
            <div className="text-xs text-gray-500">Total Quantity: {calc.totalQty}</div>
          </div>
        </div>
      </div>
    </form>
  );
}
