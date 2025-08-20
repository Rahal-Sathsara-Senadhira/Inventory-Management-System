const fmtMoney = (n, cur="USD") => {
  const x = Number(n || 0);
  return isNaN(x) ? `0.00 ${cur}` : `${x.toFixed(2)} ${cur}`;
};
const safeDate = (d) => d ? new Date(d).toLocaleDateString() : "—";

export default function BillPreview({ loading, error, bill, vendor, org }) {
  if (loading) return <div className="p-6">Loading…</div>;
  if (error)   return <div className="p-6 text-red-600">Error: {error}</div>;
  if (!bill)   return <div className="p-6">No bill found.</div>;

  const currency = bill?.totals?.currency || org?.defaultCurrency || "USD";

  // compute line totals safely
  const lines = (bill.items || []).map((ln, i) => {
    const qty = Number(ln.quantity || 0);
    const rate = Number(ln.rate || 0);
    const disc = Number(ln.discount || 0); // %
    const gross = qty * rate;
    const discAmt = (disc/100)*gross;
    const net = gross - discAmt;
    return {
      idx: i + 1,
      name: ln.freeText || ln.itemName || (ln.itemId?`Item ${ln.itemId}`:"Item"),
      qty, rate, net
    };
  });

  const subTotal = lines.reduce((s, l) => s + l.net, 0);
  const taxTotal = Number(bill?.totals?.taxTotal || 0);
  const shipping  = Number(bill?.totals?.shippingCharge || bill?.shippingCharge || 0);
  const adjustment = Number(bill?.totals?.adjustment || bill?.adjustment || 0);
  const roundOff = Number(bill?.totals?.roundOff || bill?.roundOff || 0);
  const grandTotal = Number(bill?.totals?.grandTotal ?? (subTotal + taxTotal + shipping + adjustment + roundOff));
  const amountPaid = Number(bill?.amountPaid || 0);
  const balanceDue = Math.max(grandTotal - amountPaid, 0);

  return (
    <div className="bg-white p-6 print:p-6 m-6 print:m-0 shadow-md rounded-md text-sm">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold text-lg">{org?.name || "My Organization"}</h3>
          <p className="text-gray-700 whitespace-pre-line">
            {(org?.address && `${org.address}\n`) || ""}
            {org?.country || ""}
          </p>
        </div>
        <div className="text-right">
          <h3 className="text-2xl font-bold text-stone-700">BILL</h3>
          <p className="text-sm text-gray-700">Bill# {bill?.billNo || bill?.uid || "—"}</p>
          <p className="text-xs text-gray-500">Reference# {bill?.referenceNo || "—"}</p>
          <div className="mt-2">
            <p className="text-xs text-gray-600">Balance Due</p>
            <p className="text-2xl font-bold text-red-600">{fmtMoney(balanceDue, currency)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mt-6">
        <div className="space-y-1">
          <p><span className="font-semibold text-stone-700">Bill Date:</span> {safeDate(bill?.billDate || bill?.createdAt)}</p>
          <p><span className="font-semibold text-stone-700">Due Date:</span> {safeDate(bill?.dueDate)}</p>
          <p><span className="font-semibold text-stone-700">Terms:</span> {bill?.paymentTerm || "Due on Receipt"}</p>
        </div>
        <div className="space-y-1">
          <p className="text-xs text-gray-500">Bill From</p>
          <p className="text-blue-600 font-semibold">{vendor?.displayName || vendor?.name || "Vendor"}</p>
          <p className="text-gray-700 whitespace-pre-line">
            {vendor?.address?.street1 || ""}{vendor?.address?.street1 ? "\n" : ""}
            {vendor?.address?.city || ""}{vendor?.address?.city ? "\n" : ""}
            {vendor?.address?.country || ""}
          </p>
        </div>
      </div>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-stone-500 text-white text-left text-xs">
            <th className="p-2 w-10">#</th>
            <th className="p-2">Item & Description</th>
            <th className="p-2 text-center w-24">Qty</th>
            <th className="p-2 text-right w-28">Rate</th>
            <th className="p-2 text-right w-32">Amount</th>
          </tr>
        </thead>
        <tbody>
          {lines.length === 0 && (
            <tr className="border-b">
              <td className="p-2" colSpan={5}>No items</td>
            </tr>
          )}
          {lines.map((l) => (
            <tr key={l.idx} className="border-b">
              <td className="p-2">{l.idx}</td>
              <td className="p-2">{l.name}</td>
              <td className="p-2 text-center">{l.qty}</td>
              <td className="p-2 text-right">{fmtMoney(l.rate, currency)}</td>
              <td className="p-2 text-right">{fmtMoney(l.net, currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end mt-4 text-sm">
        <div className="w-80 space-y-1">
          <div className="flex justify-between p-2"><span>Sub Total</span><span>{fmtMoney(subTotal, currency)}</span></div>
          <div className="flex justify-between p-2"><span>Tax</span><span>{fmtMoney(taxTotal, currency)}</span></div>
          {!!shipping && <div className="flex justify-between p-2"><span>Shipping</span><span>{fmtMoney(shipping, currency)}</span></div>}
          {!!adjustment && <div className="flex justify-between p-2"><span>Adjustment</span><span>{fmtMoney(adjustment, currency)}</span></div>}
          {!!roundOff && <div className="flex justify-between p-2"><span>Round Off</span><span>{fmtMoney(roundOff, currency)}</span></div>}
          <div className="flex justify-between font-semibold p-2 border-t"><span>Total</span><span>{fmtMoney(grandTotal, currency)}</span></div>
          <div className="flex justify-between p-2"><span>Amount Paid</span><span>{fmtMoney(amountPaid, currency)}</span></div>
          <div className="flex justify-between items-center text-stone-700 bg-stone-200 font-bold text-lg p-2">
            <span>Balance Due</span><span>{fmtMoney(balanceDue, currency)}</span>
          </div>
        </div>
      </div>

      {bill?.notes && (
        <div className="mt-6">
          <p className="text-sm text-gray-600 whitespace-pre-line">{bill.notes}</p>
        </div>
      )}
    </div>
  );
}
