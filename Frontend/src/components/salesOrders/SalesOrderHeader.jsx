import React from "react";

export default function SalesOrderHeader({
  form,
  setForm,
  paymentTerms = [],
}) {
  return (
    <section className="flex flex-wrap gap-4">
      <div className="flex w-full flex-col md:basis-[48%]">
        <label className="mb-1 text-sm font-medium text-red-500">
          Sales Order#*
        </label>
        <div className="flex items-center gap-2">
          <input
            value={form.salesOrderNo || ""}
            onChange={(e) =>
              setForm((f) => ({ ...f, salesOrderNo: e.target.value }))
            }
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

      <div className="flex w-full flex-col md:basis-[48%]">
        <label className="mb-1 text-sm text-gray-600">Reference#</label>
        <input
          value={form.referenceNo}
          onChange={(e) =>
            setForm((f) => ({ ...f, referenceNo: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex w-full flex-col md:basis-[48%]">
        <label className="mb-1 text-sm font-medium text-red-500">
          Sales Order Date*
        </label>
        <input
          type="date"
          required
          value={form.salesOrderDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, salesOrderDate: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex w-full flex-col md:basis-[48%]">
        <label className="mb-1 text-sm text-gray-600">
          Expected Shipment Date
        </label>
        <input
          type="date"
          value={form.expectedShipmentDate}
          onChange={(e) =>
            setForm((f) => ({ ...f, expectedShipmentDate: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div className="flex w-full flex-col md:basis-[48%]">
        <label className="mb-1 text-sm text-gray-600">Payment Terms</label>
        <select
          value={form.paymentTerm}
          onChange={(e) =>
            setForm((f) => ({ ...f, paymentTerm: e.target.value }))
          }
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {paymentTerms.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
    </section>
  );
}
