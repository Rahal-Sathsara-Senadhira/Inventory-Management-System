// src/components/customers/StatementPreview.jsx

/* ---------- Currency helpers (robust to "$", "Rs", etc.) ---------- */
function normalizeCurrency(cur) {
  const c = String(cur || "").trim();
  const map = {
    "$": "USD",
    "US$": "USD",
    "USD": "USD",
    "Rs": "LKR",
    "LKR": "LKR",
    "€": "EUR",
    "EUR": "EUR",
    "£": "GBP",
    "GBP": "GBP",
    "₹": "INR",
    "INR": "INR",
    "AUD": "AUD",
    "CAD": "CAD",
  };
  if (map[c]) return map[c];
  if (/^[A-Za-z]{3}$/.test(c)) return c.toUpperCase();
  return "USD";
}

const nf = (amount, currency = "USD") => {
  const code = normalizeCurrency(currency);
  const n = Number(amount || 0);
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      currencyDisplay: "symbol",
    }).format(n);
  } catch {
    // Fallback if Intl fails for any reason
    const sym = code === "USD" ? "$" : code + " ";
    return `${sym}${n.toFixed(2)}`;
  }
};

const safeDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

function Stat({ label, value, emphasize }) {
  return (
    <div
      className={`min-w-[10rem] rounded-xl px-4 py-3 ring-1 ${
        emphasize ? "bg-red-50 ring-red-200" : "bg-slate-50 ring-slate-200"
      }`}
    >
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div
        className={`mt-1 text-lg font-semibold ${
          emphasize ? "text-red-700" : "text-slate-800"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Chip({ children }) {
  return (
    <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
      {children}
    </span>
  );
}

export default function StatementPreview({
  loading,
  error,
  mode,
  from,
  to,
  groups = [],
  currency = "USD",
}) {
  if (loading) {
    return <div className="bg-white p-6 m-6 rounded-xl shadow">Loading…</div>;
  }
  if (error) {
    return (
      <div className="bg-white p-6 m-6 rounded-xl shadow text-red-600">
        Error: {error}
      </div>
    );
  }

  const normalizedCurrency = normalizeCurrency(currency);

  // overall totals
  const totalsAll = groups.reduce(
    (acc, g) => {
      acc.grand += g?.totals?.grand || 0;
      acc.paid += g?.totals?.paid || 0;
      acc.balance += g?.totals?.balance || 0;
      return acc;
    },
    { grand: 0, paid: 0, balance: 0 }
  );

  return (
    <div className="mx-auto max-w-5xl bg-gradient-to-br from-white to-slate-50 p-6 md:p-8 m-6 rounded-2xl shadow ring-1 ring-slate-200/60 print:m-0 print:shadow-none print:ring-0 print:bg-white">
      {/* Top header */}
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="text-2xl font-bold text-slate-800">Customer Statement</div>
          <div className="mt-1 flex items-center gap-3 text-sm text-slate-600">
            <Chip>{mode}</Chip>
            <span>
              From <strong>{from || "—"}</strong> to{" "}
              <strong>{to || "—"}</strong>
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <Stat label="Total" value={nf(totalsAll.grand, normalizedCurrency)} />
          <Stat label="Paid" value={nf(totalsAll.paid, normalizedCurrency)} />
          <Stat
            label="Balance Due"
            value={nf(totalsAll.balance, normalizedCurrency)}
            emphasize
          />
        </div>
      </div>

      {/* Divider */}
      <div className="my-6 h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Groups */}
      {groups.length === 0 ? (
        <div className="text-slate-600">No orders found for this range.</div>
      ) : (
        groups.map((g, gi) => {
          const groupCurrency = normalizeCurrency(g?.currency || normalizedCurrency);
          return (
            <section
              key={gi}
              className="mb-8 rounded-xl ring-1 ring-slate-200 overflow-hidden bg-white"
            >
              {/* Group header */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 px-4 py-3 ring-1 ring-inset ring-slate-200/60">
                <div className="text-base font-semibold text-slate-800">
                  {g.label}
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  <div className="text-slate-600">
                    Total:{" "}
                    <span className="font-semibold text-slate-800">
                      {nf(g?.totals?.grand, groupCurrency)}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Paid:{" "}
                    <span className="font-semibold text-slate-800">
                      {nf(g?.totals?.paid, groupCurrency)}
                    </span>
                  </div>
                  <div className="text-slate-600">
                    Balance:{" "}
                    <span className="font-semibold text-red-600">
                      {nf(g?.totals?.balance, groupCurrency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100/80 text-left text-slate-600">
                    <tr className="border-b border-slate-200">
                      <th className="px-4 py-2 font-medium">Date</th>
                      <th className="px-4 py-2 font-medium">Order #</th>
                      <th className="px-4 py-2 font-medium">Items</th>
                      <th className="px-4 py-2 text-right font-medium">Total</th>
                      <th className="px-4 py-2 text-right font-medium">Paid</th>
                      <th className="px-4 py-2 text-right font-medium">Balance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {g.orders.map((o) => {
                      const total = Number(o?.totals?.grandTotal || 0);
                      const paid = Number(o?.amountPaid || 0);
                      const bal = Math.max(total - paid, 0);
                      const orderNo =
                        o?.invoiceNo ||
                        o?.salesOrderNo ||
                        o?.uid ||
                        o?._id ||
                        "—";
                      const items = Array.isArray(o?.items) ? o.items : [];

                      return (
                        <tr
                          key={o._id}
                          className="odd:bg-white even:bg-slate-50/40 align-top"
                        >
                          <td className="px-4 py-2 text-slate-700">
                            {safeDate(o?.salesOrderDate || o?.createdAt)}
                          </td>
                          <td className="px-4 py-2">
                            <span className="font-medium text-slate-800">
                              {orderNo}
                            </span>
                            <div className="mt-1">
                              {bal === 0 ? (
                                <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200">
                                  paid
                                </span>
                              ) : paid > 0 ? (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
                                  partially paid
                                </span>
                              ) : (
                                <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 ring-1 ring-rose-200">
                                  unpaid
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-2">
                            {items.length === 0 ? (
                              <span className="text-slate-500">—</span>
                            ) : (
                              <ul className="list-disc space-y-0.5 pl-5 text-slate-700">
                                {items.map((ln, i) => {
                                  const name =
                                    ln.freeText ||
                                    ln.itemName ||
                                    (ln.itemId ? `Item ${ln.itemId}` : "Item");
                                  const qty = Number(ln.quantity || 0);
                                  const rate = Number(ln.rate || 0);
                                  const disc = Number(ln.discount || 0);
                                  const gross = qty * rate;
                                  const net = gross - (disc / 100) * gross;
                                  return (
                                    <li key={i}>
                                      <span className="font-medium">{name}</span>{" "}
                                      <span className="text-slate-500">
                                        — {qty} × {rate.toFixed(2)}
                                      </span>
                                      <span className="text-slate-500">
                                        {disc ? ` (−${disc}% )` : ""}
                                      </span>
                                      <span className="ml-1 text-slate-700">
                                        = {net.toFixed(2)}
                                      </span>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-800">
                            {nf(total, groupCurrency)}
                          </td>
                          <td className="px-4 py-2 text-right text-slate-800">
                            {nf(paid, groupCurrency)}
                          </td>
                          <td className="px-4 py-2 text-right font-semibold text-slate-900">
                            {nf(bal, groupCurrency)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })
      )}

      {/* Footer note */}
      <div className="mt-6 text-[12px] text-slate-500">
        Generated on{" "}
        <span className="font-medium text-slate-700">
          {safeDate(new Date())}
        </span>{" "}
        · Currency:{" "}
        <span className="font-medium text-slate-700">
          {normalizedCurrency}
        </span>
      </div>
    </div>
  );
}
