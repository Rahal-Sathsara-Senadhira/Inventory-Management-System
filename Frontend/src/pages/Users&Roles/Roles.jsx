import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const ROLE_LIST = ["ADMIN", "MANAGER", "INVENTORY", "SALES"];
const DEFAULT_CURRENCIES = ["LKR", "USD", "EUR", "INR"];

const CAPABILITIES = {
  ADMIN: [
    "Users: create/update/deactivate",
    "Items: full CRUD",
    "Orders/Sales: full",
    "Reports/Settings: full",
    "Timekeeping/Payroll: full",
  ],
  MANAGER: [
    "Items: CRUD",
    "Orders: approve",
    "Sales: create/read/update",
    "Reports: view",
    "Timekeeping/Payroll: manage",
  ],
  INVENTORY: ["Items: create/update/read", "Stock: adjust", "Orders: read"],
  SALES: ["Customers: read", "Sales: create/read", "Orders: create/read"],
};

const canView = (role) => role === "ADMIN" || role === "MANAGER";
const canEdit = (role) => role === "ADMIN";

export default function Roles() {
  const { user } = useAuth();
  const [rates, setRates] = useState([]); // [{role, hourlyRate, currency, updatedAt}]
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState({}); // {ROLE: boolean}

  useEffect(() => {
    if (!user || !canView(user.role)) return;
    (async () => {
      try {
        // also seeds defaults on the server if empty
        const { data } = await api.get("/timekeeping/rates");
        // Ensure all roles visible, even if not returned (defensive)
        const byRole = Object.fromEntries((data || []).map((r) => [r.role, r]));
        const merged = ROLE_LIST.map((r) => byRole[r] || { role: r, hourlyRate: 0, currency: "LKR" });
        setRates(merged);
      } catch (e) {
        setMsg(e?.response?.data?.error || "Failed to load rates");
      }
    })();
  }, [user]);

  if (!user) return <div className="p-6">Loading…</div>;
  if (!canView(user.role)) return <div className="p-6 text-red-600">Managers & Admins only.</div>;

  const updateField = (role, key, value) => {
    setRates((prev) =>
      prev.map((r) => (r.role === role ? { ...r, [key]: key === "hourlyRate" ? Number(value) : value } : r))
    );
  };

  const save = async (role) => {
    setMsg("");
    const row = rates.find((r) => r.role === role);
    if (!row) return;
    if (typeof row.hourlyRate !== "number" || row.hourlyRate < 0) {
      setMsg("Hourly rate must be a non-negative number.");
      return;
    }
    setSaving((s) => ({ ...s, [role]: true }));
    try {
      const { data } = await api.post("/timekeeping/rates", {
        role,
        hourlyRate: row.hourlyRate,
        currency: row.currency || "LKR",
      });
      // reflect any server normalization
      setRates((prev) => prev.map((r) => (r.role === role ? { ...r, ...data } : r)));
      setMsg(`Saved rate for ${role}.`);
    } catch (e) {
      setMsg(e?.response?.data?.error || "Failed to save rate");
    } finally {
      setSaving((s) => ({ ...s, [role]: false }));
    }
  };

  const totalRoles = useMemo(() => rates.length, [rates]);

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Roles & Hourly Rates</h1>
        <p className="text-sm text-slate-600">
          {canEdit(user.role) ? "Admins can edit rates. Managers can view." : "View only"}
        </p>
      </header>

      {msg && <div className="text-sm text-slate-700">{msg}</div>}

      {/* Rates table */}
      <section className="bg-white rounded-xl shadow border p-4">
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 border text-left">Role</th>
                <th className="p-2 border">Hourly Rate</th>
                <th className="p-2 border">Currency</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rates.map((r) => (
                <tr key={r.role}>
                  <td className="p-2 border font-medium">{r.role}</td>
                  <td className="p-2 border text-center">
                    {canEdit(user.role) ? (
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        className="border rounded px-2 py-1 w-28 text-right"
                        value={Number.isFinite(r.hourlyRate) ? r.hourlyRate : 0}
                        onChange={(e) => updateField(r.role, "hourlyRate", e.target.value)}
                      />
                    ) : (
                      <span>{Number(r.hourlyRate || 0).toFixed(2)}</span>
                    )}
                  </td>
                  <td className="p-2 border text-center">
                    {canEdit(user.role) ? (
                      <select
                        className="border rounded px-2 py-1"
                        value={r.currency || "LKR"}
                        onChange={(e) => updateField(r.role, "currency", e.target.value)}
                      >
                        {DEFAULT_CURRENCIES.map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span>{r.currency || "LKR"}</span>
                    )}
                  </td>
                  <td className="p-2 border text-center">
                    {canEdit(user.role) ? (
                      <button
                        onClick={() => save(r.role)}
                        disabled={!!saving[r.role]}
                        className="underline disabled:opacity-60"
                      >
                        {saving[r.role] ? "Saving…" : "Save"}
                      </button>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {!totalRoles && (
                <tr>
                  <td colSpan="4" className="p-4 text-center text-slate-500">
                    No roles found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <p className="mt-2 text-xs text-slate-500">
          These rates are used to calculate salaries on the <b>Worked Hours</b> page.
        </p>
      </section>

      {/* Capability reference */}
      <section className="bg-white rounded-xl shadow border p-4">
        <h2 className="text-lg font-semibold mb-3">Role Capabilities (reference)</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {ROLE_LIST.map((role) => (
            <div key={role} className="border rounded-lg p-3">
              <div className="font-semibold mb-2">{role}</div>
              <ul className="list-disc pl-5 text-sm text-slate-700">
                {CAPABILITIES[role].map((c) => (
                  <li key={c}>{c}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
