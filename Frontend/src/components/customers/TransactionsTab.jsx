import CollapsibleSection from "./CollapsableSection";

export default function TransactionTab() {
  return (
    <div className=" bg-white">
      <CollapsibleSection title="Invoices">
        {/* Replace this with your invoice table or UI */}
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

      <CollapsibleSection title="Sales Orders" />
      <CollapsibleSection title="Packages" />
      <CollapsibleSection title="Bills" />
      <CollapsibleSection title="Credit Notes" />
    </div>
  );
}
