import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const canAccess = (role) => role === "ADMIN" || role === "MANAGER";

export default function TimeKeeping() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [entries, setEntries] = useState([]);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // filters
  const todayISO = new Date().toISOString().slice(0, 10);
  const [from, setFrom] = useState(todayISO);
  const [to, setTo] = useState(todayISO);
  const [filterUser, setFilterUser] = useState("");

  // form
  const [form, setForm] = useState({
    userId: "",
    clockIn: "",
    clockOut: "",
    note: "",
  });

  useEffect(() => {
    if (!user) return;
    if (!canAccess(user.role)) return;
    (async () => {
      const [emps, _] = await Promise.all([
        api.get("/timekeeping/employees"),
        api.get("/timekeeping/rates"), // ensures defaults exist; no need to store
      ]);
      setEmployees(emps.data || []);
    })();
  }, [user]);

  const loadEntries = async () => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    if (filterUser) params.set("userId", filterUser);
    const { data } = await api.get(`/timekeeping/entries?${params.toString()}`);
    setEntries(data || []);
  };

  useEffect(() => {
    if (!user || !canAccess(user.role)) return;
    loadEntries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, from, to, filterUser]);

  if (!user) return <div className="p-6">Loading…</div>;
  if (!canAccess(user.role)) return <div className="p-6 text-red-600">Managers & Admins only.</div>;

  const submit = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.userId || !form.clockIn || !form.clockOut) {
      setMsg("Employee, clock-in and clock-out are required.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/timekeeping/entries", form);
      setForm({ userId: "", clockIn: "", clockOut: "", note: "" });
      await loadEntries();
      setMsg("Entry added.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to add entry");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    await api.delete(`/timekeeping/entries/${id}`);
    await loadEntries();
  };

  const hours = (row) => {
    const a = new Date(row.clockIn);
    const b = new Date(row.clockOut);
    const h = Math.max(0, (b - a) / 36e5);
    return (Math.round((h + Number.EPSILON) * 100) / 100).toFixed(2);
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Time Keeping</h1>
        <p className="text-sm text-slate-600">Record when employees enter/leave the warehouse.</p>
      </header>

      {/* Filters */}
      <section className="bg-white rounded-xl shadow border p-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-slate-500">From</label>
            <input type="date" className="border rounded px-3 py-2" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500">To</label>
            <input type="date" className="border rounded px-3 py-2" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
          <div>
            <label className="block text-xs text-slate-500">Employee</label>
            <select className="border rounded px-3 py-2" value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
              <option value="">All</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>
                  {e.name} — {e.role}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Add entry */}
      <section className="bg-white rounded-xl shadow border p-4">
        <h2 className="text-lg font-semibold mb-3">Add Entry</h2>
        {msg && <div className="mb-3 text-sm text-slate-700">{msg}</div>}
        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            className="border rounded px-3 py-2"
            value={form.userId}
            onChange={(e) => setForm({ ...form, userId: e.target.value })}
          >
            <option value="">Select employee…</option>
            {employees.map((e) => (
              <option key={e._id} value={e._id}>
                {e.name} — {e.role}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            className="border rounded px-3 py-2"
            value={form.clockIn}
            onChange={(e) => setForm({ ...form, clockIn: e.target.value })}
            placeholder="Clock in"
          />
          <input
            type="datetime-local"
            className="border rounded px-3 py-2"
            value={form.clockOut}
            onChange={(e) => setForm({ ...form, clockOut: e.target.value })}
            placeholder="Clock out"
          />
          <input
            className="border rounded px-3 py-2"
            placeholder="Note (optional)"
            value={form.note}
            onChange={(e) => setForm({ ...form, note: e.target.value })}
          />
          <button disabled={busy} className="rounded bg-slate-900 text-white px-4 py-2 disabled:opacity-60">
            {busy ? "Saving…" : "Add Entry"}
          </button>
        </form>
      </section>

      {/* Entries table */}
      <section className="bg-white rounded-xl shadow border p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 border text-left">Employee</th>
                <th className="p-2 border text-left">Role</th>
                <th className="p-2 border">Clock In</th>
                <th className="p-2 border">Clock Out</th>
                <th className="p-2 border">Hours</th>
                <th className="p-2 border">Note</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((row) => (
                <tr key={row._id}>
                  <td className="p-2 border">{row.userId?.name}</td>
                  <td className="p-2 border text-center">{row.userId?.role}</td>
                  <td className="p-2 border text-center">{new Date(row.clockIn).toLocaleString()}</td>
                  <td className="p-2 border text-center">{new Date(row.clockOut).toLocaleString()}</td>
                  <td className="p-2 border text-center">{hours(row)}</td>
                  <td className="p-2 border">{row.note || "—"}</td>
                  <td className="p-2 border text-center">
                    <button className="underline" onClick={() => remove(row._id)}>Delete</button>
                  </td>
                </tr>
              ))}
              {!entries.length && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-500">No entries.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
