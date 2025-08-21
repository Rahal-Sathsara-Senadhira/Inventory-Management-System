// src/components/PresentSummaryCard.jsx
import { useEffect, useState } from "react";
import api from "../api/client";

export default function PresentSummaryCard() {
  const [rows, setRows] = useState([]);
  useEffect(() => { api.get("/timekeeping/presence").then(r => setRows(r.data||[])); }, []);
  const inside = rows.filter(r => r.isOn);
  const byRole = inside.reduce((m, r) => (m[r.role]=(m[r.role]||0)+1, m), {});
  return (
    <div className="rounded-xl border bg-white p-4 shadow">
      <div className="text-sm text-slate-500">Inside now</div>
      <div className="mt-1 text-3xl font-bold">{inside.length}</div>
      <div className="mt-2 text-xs text-slate-600">
        {Object.entries(byRole).map(([role, n]) => <span key={role} className="mr-3">{role}: {n}</span>)}
      </div>
    </div>
  );
}
