import React, { useEffect, useMemo, useState } from "react";
import api from "../../api/client";
import { useAuth } from "../../context/AuthContext";

const ROLES = ["ADMIN", "MANAGER", "INVENTORY", "SALES"];

export default function Employees() {
  const { user } = useAuth();

  // guards
  if (!user) return <div className="p-6">Loading…</div>;
  if (user.role !== "ADMIN") {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold text-red-600">Admins only</h1>
        <p className="text-sm text-slate-600">
          You don’t have permission to manage employees.
        </p>
      </div>
    );
  }

  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [q, setQ] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    role: "SALES",
    password: "",
  });

  const load = async () => {
    const { data } = await api.get("/auth/users");
    setList(data || []);
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return list;
    return list.filter(
      (u) =>
        String(u.name).toLowerCase().includes(t) ||
        String(u.email).toLowerCase().includes(t) ||
        String(u.role).toLowerCase().includes(t)
    );
  }, [q, list]);

  const createUser = async (e) => {
    e.preventDefault();
    setMsg("");
    if (!form.name || !form.email || !form.password) {
      setMsg("Name, email and a temporary password are required.");
      return;
    }
    setBusy(true);
    try {
      await api.post("/auth/users", form);
      setForm({ name: "", email: "", role: "SALES", password: "" });
      await load();
      setMsg("User created. They must change the password on first login.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to create user");
    } finally {
      setBusy(false);
    }
  };

  const changeRole = async (id, role) => {
    setMsg("");
    try {
      await api.patch(`/auth/users/${id}`, { role });
      await load();
      setMsg("Role updated.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to update role");
    }
  };

  const toggleActive = async (id, isActive) => {
    setMsg("");
    if (id === user._id && isActive) {
      // prevent self-deactivate client side (server also blocks)
      setMsg("You cannot deactivate your own account.");
      return;
    }
    try {
      await api.patch(`/auth/users/${id}`, { isActive: !isActive });
      await load();
      setMsg(!isActive ? "User activated." : "User deactivated.");
    } catch (err) {
      setMsg(err?.response?.data?.error || "Failed to update status");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Employees</h1>
          <p className="text-sm text-slate-600">
            Add team members and manage roles & access.
          </p>
        </div>
      </header>

      {/* Create form */}
      <section className="bg-white rounded-xl shadow border p-4">
        <h2 className="text-lg font-semibold mb-3">Add Employee</h2>
        {msg && <div className="mb-3 text-sm text-slate-700">{msg}</div>}
        <form onSubmit={createUser} className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            className="border rounded px-3 py-2"
            placeholder="Full name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="email"
            className="border rounded px-3 py-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <select
            className="border rounded px-3 py-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <input
            type="password"
            className="border rounded px-3 py-2"
            placeholder="Temporary password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <button
            disabled={busy}
            className="rounded bg-slate-900 text-white px-4 py-2 hover:bg-slate-800 disabled:opacity-60"
          >
            {busy ? "Creating…" : "Add user"}
          </button>
        </form>
        <p className="mt-2 text-xs text-slate-500">
          New users are marked <b>mustChangePassword</b> and will be asked to set a new password after first login.
        </p>
      </section>

      {/* Search + table */}
      <section className="bg-white rounded-xl shadow border p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <h2 className="text-lg font-semibold">Team</h2>
          <input
            className="border rounded px-3 py-2 w-64"
            placeholder="Search name, email, role…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-slate-50">
              <tr>
                <th className="p-2 border text-left">Name</th>
                <th className="p-2 border text-left">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Last Login</th>
                <th className="p-2 border">Created</th>
                <th className="p-2 border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-2 border">
                    <div className="font-medium">{u.name}</div>
                  </td>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border text-center">
                    <select
                      disabled={u._id === user._id && u.role === "ADMIN"} // prevent demoting self (optional)
                      value={u.role}
                      onChange={(e) => changeRole(u._id, e.target.value)}
                      className="border rounded px-2 py-1"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-2 border text-center">
                    <span
                      className={
                        "inline-flex rounded-full px-2 py-0.5 text-xs " +
                        (u.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-700")
                      }
                    >
                      {u.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td className="p-2 border text-center">
                    {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : "—"}
                  </td>
                  <td className="p-2 border text-center">
                    {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-2 border text-center">
                    <button
                      className="underline"
                      onClick={() => toggleActive(u._id, u.isActive)}
                      disabled={u._id === user._id && u.isActive} // don't allow self-deactivate
                      title={
                        u._id === user._id && u.isActive
                          ? "You cannot deactivate your own account"
                          : ""
                      }
                    >
                      {u.isActive ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))}
              {!filtered.length && (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-slate-500">
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
