import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export default function BillToolbar({ printRef, bill }) {
  const handlePrint = () => window.print();

  const handlePDF = async () => {
    const scale = 2;
    const canvas = await html2canvas(printRef.current, { scale, useCORS: true });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`${bill?.billNo || "bill"}.pdf`);
  };

  const handleExcel = async () => {
    if (!bill) return;
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet("Bill");
    sheet.columns = [
      { header: "#", key: "idx", width: 6 },
      { header: "Item", key: "item", width: 30 },
      { header: "Qty", key: "qty", width: 10 },
      { header: "Rate", key: "rate", width: 12 },
      { header: "Amount", key: "amt", width: 14 },
    ];
    (bill.items || []).forEach((ln, i) => {
      sheet.addRow({
        idx: i + 1,
        item: ln.freeText || ln.itemName || ln.itemId,
        qty: ln.quantity,
        rate: ln.rate,
        amt: (ln.quantity || 0) * (ln.rate || 0) - ((ln.discount || 0) / 100) * (ln.quantity || 0) * (ln.rate || 0),
      });
    });
    const buf = await wb.xlsx.writeBuffer();
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
           `${bill?.billNo || "bill"}.xlsx`);
  };

  return (
    <div className="flex items-center gap-2">
      <button className="border px-3 py-1 rounded" onClick={handlePrint}>🖨 Print</button>
      <button className="border px-3 py-1 rounded" onClick={handlePDF}>📄 PDF</button>
      <button className="border px-3 py-1 rounded" onClick={handleExcel}>📊 Excel</button>
      <button className="bg-blue-500 text-white px-4 py-1 rounded">📧 Send Email</button>
    </div>
  );
}
