import { useParams, useNavigate } from "react-router-dom";
import { useMemo, useRef } from "react";
import BillPreview from "../../components/bills/BillPreview";
import BillToolbar from "../../components/bills/BillToolbar";
import useBillData from "../../hooks/useBillData";
import { FaArrowLeft } from "react-icons/fa";

export default function BillDetails() {
  const { billId } = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);
  const { loading, error, bill, vendor, org } = useBillData(billId);

  const title = useMemo(() => {
    if (loading) return "Loading bill…";
    if (error) return "Error loading bill";
    return bill?.billNo ? `Bill ${bill.billNo}` : "Bill";
  }, [loading, error, bill]);

  return (
    <div className="bg-white rounded shadow">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-2">
          <button className="btn btn-secondary p-2" onClick={() => navigate(-1)}>
            <FaArrowLeft className="w-4 h-4" />
          </button>
          <h2 className="text-xl font-semibold">{title}</h2>
        </div>
        <BillToolbar printRef={printRef} bill={bill} />
      </div>

      <div ref={printRef}>
        <BillPreview loading={loading} error={error} bill={bill} vendor={vendor} org={org} />
      </div>
    </div>
  );
}
