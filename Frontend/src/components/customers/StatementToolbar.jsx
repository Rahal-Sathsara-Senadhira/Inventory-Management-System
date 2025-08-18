// src/components/customers/StatementToolbar.jsx
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function StatementToolbar({ printRef }) {
  const handlePrint = () => window.print();

  const handlePDF = async () => {
    const scale = 2;
    const canvas = await html2canvas(printRef.current, { scale, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save("statement.pdf");
  };

  const handleExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Statement");
    sheet.columns = [
      { header: "Item", key: "item", width: 25 },
      { header: "Qty", key: "qty", width: 15 },
      { header: "Rate", key: "rate", width: 10 },
      { header: "Amount", key: "amount", width: 10 },
    ];
    sheet.addRow({ item: "Item3", qty: "1.00 Pcs", rate: 25.0, amount: 25.0 });
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    saveAs(blob, "statement.xlsx");
  };

  return (
    <div className="flex items-center justify-between gap-2 mx-4">
      <div className="space-x-2">
        <button className="border px-3 py-1 rounded" onClick={() => alert("Filter logic here")}>
          This Month
        </button>
        <button className="border px-3 py-1 rounded" onClick={() => alert("Another filter logic here")}>
          Filter By: All
        </button>
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
