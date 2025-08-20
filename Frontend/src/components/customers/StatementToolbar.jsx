import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function StatementToolbar({
  printRef,
  mode,
  from,
  to,
  onSetMode,
  onPreset,
  onRangeChange,
  loading,
  groups = [],
  currency = "USD",
}) {
  const handlePrint = () => window.print();

  const handlePDF = async () => {
    const scale = 2;
    const canvas = await html2canvas(printRef.current, { scale, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    const name = `statement_${mode}_${from || "from"}_${to || "to"}.pdf`;
    pdf.save(name);
  };

  const handleExcel = async () => {
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Statement");

    // Header rows
    sheet.addRow([`Statement (${mode})`]);
    sheet.addRow([`From ${from || "—"} To ${to || "—"}`]);
    sheet.addRow([]);

    // Table header
    sheet.addRow(["Group", "Date", "Order #", "Items", "Total", "Paid", "Balance", "Currency"]).font = { bold: true };

    // Data
    groups.forEach((g) => {
      // group total row (bold)
      const gRow = sheet.addRow([g.label, "", "", "", g.totals.grand, g.totals.paid, g.totals.balance, g.currency]);
      gRow.font = { bold: true };

      g.orders.forEach((o) => {
        const date = o.salesOrderDate || o.createdAt;
        const total = Number(o?.totals?.grandTotal || 0);
        const paid = Number(o?.amountPaid || 0);
        const bal = Math.max(total - paid, 0);
        const orderNo = o?.invoiceNo || o?.salesOrderNo || o?.uid || o?._id || "—";
        const itemsCount = Array.isArray(o?.items) ? o.items.length : 0;
        sheet.addRow([ "", date ? new Date(date).toLocaleDateString() : "—", orderNo, itemsCount, total, paid, bal, g.currency ]);
      });

      sheet.addRow([]); // spacer
    });

    // auto width-ish
    sheet.columns = (sheet.columns || []).map((c, i) => ({ ...c, width: [18, 12, 18, 8, 12, 12, 12, 10][i] || 12 }));

    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `statement_${mode}_${from || "from"}_${to || "to"}.xlsx`);
  };

  return (
    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mx-4">
      <div className="flex flex-wrap items-center gap-2">
        {/* Quick presets: these set BOTH range and grouping */}
        <span className="text-sm text-gray-600 mr-1">Quick:</span>
        <button disabled={loading} className="border px-3 py-1 rounded" onClick={() => onPreset("daily")}>Daily</button>
        <button disabled={loading} className="border px-3 py-1 rounded" onClick={() => onPreset("weekly")}>Weekly</button>
        <button disabled={loading} className="border px-3 py-1 rounded" onClick={() => onPreset("monthly")}>Monthly</button>
        <button disabled={loading} className="border px-3 py-1 rounded" onClick={() => onPreset("yearly")}>Yearly</button>

        {/* Grouping selector (does not change date range) */}
        <span className="ml-3 text-sm text-gray-600">Group by</span>
        <select
          className="border px-2 py-1 rounded"
          value={mode}
          onChange={(e) => onSetMode(e.target.value)}
          disabled={loading}
        >
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>

        {/* Custom range */}
        <span className="ml-3 text-sm text-gray-600">Range</span>
        <input
          type="date"
          className="border px-2 py-1 rounded"
          value={from || ""}
          onChange={(e) => onRangeChange({ from: e.target.value })}
          disabled={loading}
        />
        <span>–</span>
        <input
          type="date"
          className="border px-2 py-1 rounded"
          value={to || ""}
          onChange={(e) => onRangeChange({ to: e.target.value })}
          disabled={loading}
        />
      </div>

      <div className="space-x-2">
        <button onClick={handlePrint} className="border px-3 py-1 rounded">🖨 Print</button>
        <button onClick={handlePDF} className="border px-3 py-1 rounded">📄 PDF</button>
        <button onClick={handleExcel} className="border px-3 py-1 rounded">📊 Excel</button>
        <button className="bg-blue-500 text-white px-4 py-1 rounded">📧 Send Email</button>
      </div>
    </div>
  );
}
