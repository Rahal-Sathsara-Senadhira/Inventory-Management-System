// src/pages/Users&Roles/WorkedHours.jsx
import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const canAccess = (role) => role === "ADMIN" || role === "MANAGER";

function iso(d) { return new Date(d).toISOString().slice(0, 10); }
function sevenDaysAgo() { const t = new Date(); t.setDate(t.getDate() - 6); return iso(t); }

export default function WorkedHours() {
  const { user } = useAuth();
  const [from, setFrom] = useState(sevenDaysAgo());
  const [to, setTo] = useState(iso(new Date()));
  const [summary, setSummary] = useState([]);
  const [payments, setPayments] = useState([]);
  const [method, setMethod] = useState("CASH");
  const [reference, setReference] = useState("");
  const [msg, setMsg] = useState("");

  const today = iso(new Date());
  const periodFinished = to < today; // only allow paying completed periods

  const load = async () => {
    const sum = await api.post("/payroll/run", { from, to });
    setSummary(sum.data || []);
    const params = new URLSearchParams({ from, to }).toString();
    const pays = await api.get(`/payroll/payments?${params}`);
    setPayments(pays.data || []);
  };

  useEffect(() => {
    if (!user || !canAccess(user.role)) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, from, to]);

  if (!user) return <div className="p-6">Loading…</div>;
  if (!canAccess(user.role)) return <div className="p-6 text-red-600">Managers & Admins only.</div>;

  // who is already paid for this exact From/To period
  const paidSet = useMemo(() => {
    const s = new Set();
    for (const p of payments) {
      const id = String(p?.employeeId?._id || p?.employeeId || "");
      if (id) s.add(id);
    }
    return s;
  }, [payments]);

  const remaining = useMemo(
    () => (summary || []).filter((r) => !paidSet.has(String(r.userId))).length,
    [summary, paidSet]
  );

  const totalGross = useMemo(
    () => (summary || []).reduce((s, r) => s + (r.amount || 0), 0),
    [summary]
  );

  const payOne = async (row) => {
    setMsg("");
    if (!periodFinished) {
      setMsg("You can only pay once the selected period has finished.");
      return;
    }
    try {
      const res = await api.post("/payroll/pay", {
        from, to, userId: row.userId, method, reference
      });
      const created = res.data?.count || 0;
      if (created > 0) setMsg(`Paid ${row.name} ${row.amount} ${row.currency}`);
      else setMsg(`${row.name} is already paid for this period.`);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to pay");
    }
  };

  const payAll = async () => {
    if (!periodFinished) {
      setMsg("You can only pay once the selected period has finished.");
      return;
    }
    if (remaining === 0) return;
    if (!window.confirm(`Create payments for ${remaining} employee(s)?`)) return;
    setMsg("");
    try {
      const res = await api.post("/payroll/pay", { from, to, method, reference });
      setMsg(`Created ${res.data?.count || 0} payments.`);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to create payments");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Worked Hours & Payroll</h1>
        <p className="text-sm text-slate-600">Summaries by day/week/month and create payments.</p>
      </header>

      {/* Period + payment options */}
      <section className="bg-white rounded-xl shadow border p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500">From</label>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500">To</label>
            <input
              type="date"
              className="border rounded px-3 py-2"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>
          <div className="ml-auto">
            <label className="block text-xs text-slate-500">Method</label>
            <select
              className="border rounded px-3 py-2"
              value={method}
              onChange={(e) => setMethod(e.target.value)}
            >
              <option value="CASH">Cash</option>
              <option value="BANK">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Reference</label>
            <input
              className="border rounded px-3 py-2"
              placeholder="Txn ID / note"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <button
            onClick={payAll}
            disabled={remaining === 0 || !periodFinished}
            className="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-50"
            title={!periodFinished ? "Wait until the period ends" : remaining === 0 ? "All paid" : ""}
          >
            {!periodFinished ? "Wait until period ends" : remaining === 0 ? "All Paid" : `Pay ${remaining}`}
          </button>
        </div>
        {msg && <div className="mt-3 text-sm text-slate-700">{msg}</div>}
      </section>

      {/* Summary */}
      <section className="bg-white rounded-xl shadow border p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 border text-left">Employee</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Hours</th>
                <th className="p-2 border">Rate</th>
                <th className="p-2 border">Amount</th>
                <th className="p-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((r) => {
                const isPaid = paidSet.has(String(r.userId));
                return (
                  <tr key={r.userId}>
                    <td className="p-2 border">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-slate-500">{r.email}</div>
                    </td>
                    <td className="p-2 border text-center">{r.role}</td>
                    <td className="p-2 border text-center">{r.totalHours.toFixed(2)}</td>
                    <td className="p-2 border text-center">{r.hourlyRate} {r.currency}/h</td>
                    <td className="p-2 border text-center font-medium">{r.amount.toFixed(2)} {r.currency}</td>
                    <td className="p-2 border text-center">
                      <button
                        className="underline disabled:opacity-50"
                        onClick={() => payOne(r)}
                        disabled={isPaid || !periodFinished}
                        title={
                          !periodFinished
                            ? "Wait until the period ends"
                            : isPaid
                            ? "Already paid for this period"
                            : "Create payment"
                        }
                      >
                        {!periodFinished ? "Locked" : isPaid ? "Paid" : "Pay"}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!summary.length && (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-slate-500">No data for the selected period.</td>
                </tr>
              )}
            </tbody>
            {summary.length > 0 && (
              <tfoot>
                <tr>
                  <td className="p-2 border font-semibold" colSpan={4}>Total</td>
                  <td className="p-2 border font-semibold text-center">
                    {totalGross.toFixed(2)} {summary[0]?.currency || "LKR"}
                  </td>
                  <td className="p-2 border"></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </section>

      {/* Payments list */}
      <section className="bg-white rounded-xl shadow border p-4">
        <h2 className="text-lg font-semibold mb-3">Payments</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 border text-left">Employee</th>
                <th className="p-2 border">Period</th>
                <th className="p-2 border">Hours</th>
                <th className="p-2 border">Rate</th>
                <th className="p-2 border">Gross</th>
                <th className="p-2 border">Paid At</th>
                <th className="p-2 border">Method</th>
                <th className="p-2 border">Ref</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id}>
                  <td className="p-2 border">
                    <div className="font-medium">{p.employeeId?.name}</div>
                    <div className="text-xs text-slate-500">{p.employeeId?.email}</div>
                  </td>
                  <td className="p-2 border text-center">
                    {(p.periodFromStr || new Date(p.periodFrom).toLocaleDateString())}
                    {" → "}
                    {(p.periodToStr || new Date(p.periodTo).toLocaleDateString())}
                  </td>
                  <td className="p-2 border text-center">{Number(p.totalHours).toFixed(2)}</td>
                  <td className="p-2 border text-center">{p.hourlyRate} {p.currency}/h</td>
                  <td className="p-2 border text-center">{Number(p.grossPay).toFixed(2)} {p.currency}</td>
                  <td className="p-2 border text-center">{new Date(p.paidAt).toLocaleString()}</td>
                  <td className="p-2 border text-center">{p.method}</td>
                  <td className="p-2 border text-center">{p.reference || "—"}</td>
                </tr>
              ))}
              {!payments.length && (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-slate-500">No payments found for this range.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
