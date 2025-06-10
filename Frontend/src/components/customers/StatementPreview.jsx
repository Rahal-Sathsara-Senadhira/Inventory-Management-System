export default function StatementPreview() {
  return (
    <div className="bg-white p-6 shadow-md m-6 rounded-md text-lg">
      <h2 className="text-center font-semibold text-2xl mb-2">
        Customer Statement for Manuel Jacobs
      </h2>
      <p className="text-center text-base text-gray-500 mb-4">
        From 2023-07-11 To 2024-04-08
      </p>

      <div className="flex justify-between">
        <div>
          <h3 className="font-semibold">My Local Organization</h3>
          <p>123, New Street<br />CA 12345<br />U.S.A.</p>
        </div>

        <div className="text-right">
          <h3 className="text-2xl font-bold text-stone-700">BILL</h3>
          <p className="text-sm text-gray-700">Bill# Bill-456</p>
          <p className="text-lg font-semibold mt-2 text-stone-700">Balance Due</p>
          <p className="text-2xl text-red-600 font-bold">$25.00</p>
        </div>
      </div>

      <div className="mt-6">
        <p><strong className="text-stone-700">Bill Date:</strong> 23 Mar 2017</p>
        <p><strong className="text-stone-700">Due Date:</strong> 23 Mar 2017</p>
        <p><strong className="text-stone-700">Terms:</strong> Due on Receipt</p>
      </div>

      <div className="mt-6">
        <p className="text-sm text-gray-500">Bill From</p>
        <p className="text-blue-500 font-semibold">Vendor 2</p>
      </div>

      <table className="mt-4 w-full border-collapse">
        <thead>
          <tr className="bg-stone-500 text-white text-left text-sm">
            <th className="p-2">#</th>
            <th className="p-2">Item & Description</th>
            <th className="p-2 text-center">Qty</th>
            <th className="p-2 text-right">Rate</th>
            <th className="p-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr className="border-b">
            <td className="p-2">1</td>
            <td className="p-2">Item3</td>
            <td className="p-2 text-center">1.00 Pcs</td>
            <td className="p-2 text-right">25.00</td>
            <td className="p-2 text-right">25.00</td>
          </tr>
        </tbody>
      </table>

      <div className="flex justify-end mt-4 text-sm">
        <div className="w-72 space-y-1 ">
          <div className="flex justify-between p-2">
            <span>Sub Total</span>
            <span>$25.00</span>
          </div>
          <div className="flex justify-between font-semibold p-2">
            <span>Total</span>
            <span>$25.00</span>
          </div>
          <div className="flex justify-between items-center text-stone-700 bg-stone-200 font-bold text-lg pt-2 border-t p-2">
            <span>Balance Due</span>
            <span>$25.00</span>
          </div>
        </div>
      </div>
    </div>
  );
}
