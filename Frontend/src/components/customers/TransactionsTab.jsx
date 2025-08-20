import { Link, useParams } from "react-router-dom";
import CollapsibleSection from "./CollapsableSection";

const money = (n) => `$ ${Number(n || 0).toFixed(2)}`;
const safeDate = (d) => (d ? new Date(d).toLocaleDateString() : "—");

export default function TransactionTab({ customerId, orders = [] }) {
  const { type } = useParams();

  return (
    <div className="bg-white">
      {/* Keep your original sections untouched */}
      <CollapsibleSection title="Invoices">
        <p className="text-gray-600">Invoices content goes here.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Customer Payments">
        <p className="text-gray-600">Customer payments content goes here.</p>
      </CollapsibleSection>

      <CollapsibleSection title="Retainer Invoices">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Invoice #</th>
              <th className="px-4 py-2">Reference #</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Balance Due</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { date: "15 Apr 2025", num: "aperiam", amount: "$29740", status: "Paid" },
              { date: "15 Apr 2025", num: "expedita", amount: "$29740", status: "Paid" },
              { date: "15 Apr 2025", num: "tenetur", amount: "$29740", status: "Paid" },
            ].map((item, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2">{item.date}</td>
                <td className="px-4 py-2 text-blue-600 hover:underline cursor-pointer">{item.num}</td>
                <td className="px-4 py-2">-</td>
                <td className="px-4 py-2 font-medium text-black">{item.amount}</td>
                <td className="px-4 py-2 text-green-700 font-semibold">$0</td>
                <td className="px-4 py-2 text-green-600">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </CollapsibleSection>

      {/* ✅ Populate Bills using existing sales orders for this customer */}
      <CollapsibleSection title="Bills">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Bill #</th>
              <th className="px-4 py-2">Vendor</th>
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Balance Due</th>
              <th className="px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 && (
              <tr>
                <td className="px-4 py-3 text-gray-500" colSpan={6}>
                  No bills found for this customer.
                </td>
              </tr>
            )}

            {orders.map((o) => {
              const date = o.salesOrderDate || o.createdAt;
              const grand = Number(o?.totals?.grandTotal || 0);
              const paid = Number(o?.amountPaid || 0);
              const balance = Math.max(grand - paid, 0);
              const status = o?.paymentStatus ||
                (balance === 0 ? "paid" : paid > 0 ? "partially paid" : "unpaid");
              const billNo = o?.invoiceNo || o?.salesOrderNo || o?.uid || (o?._id ?? "—");

              return (
                <tr key={o._id} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{safeDate(date)}</td>

                  {/* Link to your existing view page for this order */}
                  <td className="px-4 py-2">
                    <Link
                      className="text-blue-600 hover:underline"
                      to={`/inventory/${type}/salesOrders/${o._id}`}
                    >
                      {billNo}
                    </Link>
                  </td>

                  {/* “Vendor” column kept to preserve your existing table headers */}
                  <td className="px-4 py-2">—</td>

                  <td className="px-4 py-2 font-medium text-black">{money(grand)}</td>
                  <td className="px-4 py-2">{money(balance)}</td>
                  <td className="px-4 py-2 capitalize">{status.replace("_", " ")}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CollapsibleSection>

      {/* Keep your original placeholders below */}
      <CollapsibleSection title="Sales Orders" />
      <CollapsibleSection title="Packages" />
      <CollapsibleSection title="Credit Notes" />
    </div>
  );
}
