import React, { useEffect, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const canAccess = (role) => role === "ADMIN" || role === "MANAGER";

export default function TimeKeeping() {
  const { user } = useAuth();
  const [rows, setRows] = useState([]);
  const [msg, setMsg] = useState("");
  const [busyId, setBusyId] = useState("");

  // audit
  const [events, setEvents] = useState([]);

  const loadPresence = async () => {
    const { data } = await api.get("/timekeeping/presence");
    setRows(data || []);
  };

  const loadAudit = async () => {
    const { data } = await api.get("/timekeeping/audit?limit=100");
    setEvents(data || []);
  };

  useEffect(() => {
    if (user && canAccess(user.role)) {
      loadPresence();
      loadAudit();
    }
  }, [user]);

  if (!user) return <div className="p-6">Loading…</div>;
  if (!canAccess(user.role)) return <div className="p-6 text-red-600">Managers & Admins only.</div>;

  const toggle = async (row) => {
    if (!row.canToggle) return;
    setMsg("");
    setBusyId(row._id);
    try {
      const res = await api.post("/timekeeping/switch", { userId: row._id, on: !row.isOn });
      await loadPresence();
      await loadAudit();
      const status = res.data?.status || (row.isOn ? "off" : "on");
      setMsg(`${row.name} is ${status.toUpperCase()}.`);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to toggle");
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Time Keeping (ON/OFF)</h1>
        <p className="text-sm text-slate-600">All actions are timestamped by the server and fully audited.</p>
      </header>

      <section className="bg-white rounded-xl shadow border p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm text-slate-700">{msg}</div>
          <div className="flex gap-2">
            <button onClick={loadPresence} className="rounded border px-3 py-1.5 text-sm">Refresh</button>
            <button onClick={loadAudit} className="rounded border px-3 py-1.5 text-sm">Refresh Activity</button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 border text-left">Employee</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Last Clock-In</th>
                <th className="p-2 border">Control</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id}>
                  <td className="p-2 border">
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs text-slate-500">{r.email}</div>
                  </td>
                  <td className="p-2 border text-center">{r.role}</td>
                  <td className="p-2 border text-center">
                    <span
                      className={
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs " +
                        (r.isOn ? "bg-green-100 text-green-700" : "bg-slate-200 text-slate-700")
                      }
                    >
                      {r.isOn ? "ON (Inside)" : "OFF (Outside)"}
                    </span>
                  </td>
                  <td className="p-2 border text-center">
                    {r.lastClockIn ? new Date(r.lastClockIn).toLocaleString() : "—"}
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      disabled={!r.canToggle || busyId === r._id}
                      onClick={() => toggle(r)}
                      className={
                        "rounded px-3 py-1.5 text-sm border " +
                        (r.canToggle
                          ? r.isOn
                            ? "bg-red-600 text-white border-red-600 hover:bg-red-700"
                            : "bg-green-600 text-white border-green-600 hover:bg-green-700"
                          : "opacity-50 cursor-not-allowed")
                      }
                    >
                      {busyId === r._id ? "…" : r.isOn ? "Turn OFF" : "Turn ON"}
                    </button>
                  </td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <td colSpan="5" className="p-4 text-center text-slate-500">No employees to show.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Managers can control <b>Inventory</b> and <b>Sales</b> only. Admins can control anyone.
        </p>
      </section>

      {/* Recent activity (audit) */}
      <section className="bg-white rounded-xl shadow border p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Recent Activity</h2>
          <a
            href={`${import.meta.env?.VITE_API_BASE || "http://localhost:5000"}/api/timekeeping/audit/export?limit=5000`}
            className="text-sm underline"
          >
            Export CSV
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 border">Time</th>
                <th className="p-2 border">Event</th>
                <th className="p-2 border">Employee</th>
                <th className="p-2 border">By</th>
                <th className="p-2 border">IP</th>
                <th className="p-2 border">UA</th>
                <th className="p-2 border">Entry</th>
                <th className="p-2 border">Hash</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id}>
                  <td className="p-2 border">{new Date(e.ts).toLocaleString()}</td>
                  <td className="p-2 border text-center">{e.event}</td>
                  <td className="p-2 border">
                    <div className="font-medium">{e.subjectUserId?.name}</div>
                    <div className="text-xs text-slate-500">{e.subjectUserId?.email} ({e.subjectUserId?.role})</div>
                  </td>
                  <td className="p-2 border">
                    <div className="font-medium">{e.actorUserId?.name}</div>
                    <div className="text-xs text-slate-500">{e.actorUserId?.email} ({e.actorUserId?.role})</div>
                  </td>
                  <td className="p-2 border">{e.ip || "—"}</td>
                  <td className="p-2 border">{(e.userAgent || "").slice(0, 42)}{(e.userAgent || "").length > 42 ? "…" : ""}</td>
                  <td className="p-2 border text-xs">{e.entryId || "—"}</td>
                  <td className="p-2 border text-xs">{(e.hash || "").slice(0, 16)}…</td>
                </tr>
              ))}
              {!events.length && (
                <tr>
                  <td colSpan="8" className="p-4 text-center text-slate-500">No recent activity.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
