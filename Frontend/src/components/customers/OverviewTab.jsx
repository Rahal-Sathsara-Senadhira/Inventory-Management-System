// src/components/customers/OverviewTab.jsx
import React, { useEffect, useRef, useState } from "react";

const ToggleSection = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(true);
  const contentRef = useRef(null);
  const [maxHeight, setMaxHeight] = useState("0px");

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (isOpen) {
      setMaxHeight(`${el.scrollHeight}px`);
    } else {
      setMaxHeight(`${el.scrollHeight}px`);
      requestAnimationFrame(() => setMaxHeight("0px"));
    }
  }, [isOpen]);

  return (
    <div className="">
      <div
        className="flex items-center justify-between cursor-pointer py-2 uppercase text-sm text-gray-600 border-b"
        onClick={() => setIsOpen((p) => !p)}
      >
        <span>{title}</span>
        <svg
          className={`w-3 h-3 transform transition-transform duration-200 text-gray-500 ${
            isOpen ? "rotate-180" : ""
          }`}
          viewBox="0 0 374.98 227.51"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M187.46 227.51c-10.23 0-20.46-3.9-28.27-11.71L11.73 68.45C-3.9 52.83-3.91 27.51 11.71 11.88c15.62-15.63 40.94-15.64 56.57-.02l119.18 119.09L306.69 11.72c15.62-15.62 40.95-15.62 56.57 0 15.62 15.62 15.62 40.95 0 56.57L215.75 215.8c-7.81 7.81-18.05 11.72-28.28 11.72z" />
        </svg>
      </div>

      <div
        ref={contentRef}
        className="transition-all duration-500 ease-in-out overflow-hidden"
        style={{ maxHeight, opacity: isOpen ? 1 : 0.5 }}
      >
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
};

function AddressBlock({ title, a = {} }) {
  const lines = [
    a?.addressNo,
    a?.street1,
    a?.street2,
    [a?.city, a?.district].filter(Boolean).join(", "),
    a?.zipCode,
    a?.country,
  ].filter((s) => String(s || "").trim().length > 0);

  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <address className="text-sm text-gray-700 not-italic">
        {(lines.length ? lines : ["—"]).map((l, i) => (
          <div key={i}>{l}</div>
        ))}
        <br />
        <div>Phone: {a?.phone || "—"}</div>
        <div>Fax: {a?.fax || "—"}</div>
      </address>
    </div>
  );
}

const OverviewTab = ({ customer, finance, loading, error }) => {
  const type = customer?.type?.toLowerCase() || "—";

  const tableRows = Object.entries(finance?.byCurrency || {}).map(([currency, v]) => ({
    currency,
    receivables: Number(v?.receivables || 0),
  }));

  const totalReceivables = tableRows.reduce((s, r) => s + r.receivables, 0);
  const unusedCredits = Number(customer?.unused_credits ?? 0);

  const nameStr =
    customer?.name ||
    [customer?.salutation, customer?.firstName, customer?.lastName]
      .filter(Boolean)
      .join(" ") ||
    customer?.company_name ||
    "—";

  return (
    <div className="flex flex-col lg:flex-row lg:h-[calc(100vh-100px)] gap-6 overflow-hidden">
      {/* Left side */}
      <div className=" lg:overflow-y-auto pr-2 w-full lg:w-[300px] xl:w-[400px] bg-slate-100 px-4 py-6">
        {/* Primary Contact */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Primary Contact</h2>
          <hr className="mb-2" />
          {loading ? (
            <div className="text-sm text-gray-500">Loading…</div>
          ) : error ? (
            <div className="text-sm text-red-600">Error: {error}</div>
          ) : (
            <div className="text-sm text-gray-700 space-y-1">
              <div>Name: {nameStr}</div>
              <div>Email: {customer?.customerEmail || "—"}</div>
              <div>Work Phone: {customer?.workPhone || "—"}</div>
              <div>Mobile: {customer?.mobile || "—"}</div>
            </div>
          )}
        </div>

        {/* Remarks (not in schema) */}
        <ToggleSection title="Remarks">
          <p className="text-gray-700 text-sm">
            — {/* If you want this editable, add `remarks: String` to Customer. */}
          </p>
        </ToggleSection>

        {/* Address */}
        <ToggleSection title="Address">
          <div className="space-y-4">
            <AddressBlock title="Billing Address" a={customer?.billingAddress} />
            <AddressBlock title="Shipping Address" a={customer?.shippingAddress} />
          </div>
        </ToggleSection>

        {/* Other Details */}
        <ToggleSection title="Other Details">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center">
              <label className="sm:w-1/3 text-gray-500 text-sm">Customer Type</label>
              <div className="sm:w-2/3 flex items-center gap-2 bg-gray-100 px-3 py-1 rounded text-sm">
                <span className="flex-1">{type}</span>
                <button className="text-gray-500 hover:text-gray-700" title="Edit">✏️</button>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row">
              <label className="sm:w-1/3 text-gray-500 text-sm">Payment Due Period</label>
              <div className="sm:w-2/3 text-sm text-gray-700">—{/* add Customer.paymentTerm to support */}</div>
            </div>

            <div className="flex flex-col sm:flex-row">
              <label className="sm:w-1/3 text-gray-500 text-sm">Default Currency</label>
              <div className="sm:w-2/3 text-sm text-gray-700">—{/* add Customer.defaultCurrency to support */}</div>
            </div>
          </div>
        </ToggleSection>
      </div>

      {/* Right side */}
      <div className="flex-1 lg:overflow-y-auto pl-2 px-4 py-6">
        <ToggleSection title="Financial Summary">
          {loading && <div className="text-sm text-gray-500">Loading…</div>}
          {error && <div className="text-sm text-red-600">Error: {error}</div>}

          {/* Receivables */}
          <p className="mt-2 text-base font-medium mb-2">Receivables</p>
          <div className="overflow-auto">
            <table className="min-w-full text-sm border-t">
              <thead className="bg-gray-100 uppercase text-gray-500 text-xs">
                <tr>
                  <th className="text-left py-2 px-3">Currency</th>
                  <th className="text-right py-2 px-3">Outstanding Receivables</th>
                  <th className="text-right py-2 px-3">Unused Credits</th>
                </tr>
              </thead>
              <tbody>
                {tableRows.length === 0 ? (
                  <tr className="border-t">
                    <td className="py-2 px-3">—</td>
                    <td className="py-2 px-3 text-right">0.00</td>
                    <td className="py-2 px-3 text-right">
                      {customer ? Number(customer.unused_credits || 0).toFixed(2) : "0.00"}
                    </td>
                  </tr>
                ) : (
                  tableRows.map((r) => (
                    <tr key={r.currency} className="border-t">
                      <td className="py-2 px-3">{r.currency}</td>
                      <td className="py-2 px-3 text-right">{r.receivables.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right">{unusedCredits.toFixed(2)}</td>
                    </tr>
                  ))
                )}
                <tr className="border-t border-b font-medium">
                  <td className="py-2 px-3">TOTAL</td>
                  <td className="py-2 px-3 text-right">{totalReceivables.toFixed(2)}</td>
                  <td className="py-2 px-3 text-right">{unusedCredits.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Items to be packed/shipped – requires fulfillment models */}
          <ul className="flex flex-wrap gap-6 mt-6 text-sm text-gray-700">
            <li>Items to be packed:&nbsp;<span className="text-gray-500 font-medium">—</span></li>
            <li>Items to be shipped:&nbsp;<span className="text-gray-500 font-medium">—</span></li>
          </ul>

          <div className="mt-6 text-center text-sm text-gray-400">
            {tableRows.length === 0 ? "No receivables derived from orders." : null}
          </div>
        </ToggleSection>
      </div>
    </div>
  );
};

export default OverviewTab;
