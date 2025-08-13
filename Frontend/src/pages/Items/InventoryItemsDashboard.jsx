import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE = import.meta.env?.VITE_API_BASE || ""; // e.g. http://localhost:5000
const ITEMS_PER_PAGE = 5;
const PLACEHOLDER_IMG = "https://via.placeholder.com/96x96.png?text=Item";

const toAbs = (p) =>
  !p ? "" : /^https?:\/\//i.test(p) ? p : `${API_BASE}${p}`;

export default function InventoryItemsDashboard() {
  const navigate = useNavigate();
  const { type } = useParams();

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [currentPage, setCurrentPage] = useState(1);

  // Load items from backend
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const res = await fetch(`${API_BASE}/api/items`);
        if (!res.ok) throw new Error("Failed to load items");
        const data = await res.json();
        const arr = Array.isArray(data) ? data : data.items || [];

        const mapped = arr.map((it) => ({
          id: it._id,
          name: it.name,
          sku: it.sku || "",
          type: it.type || "Goods",
          description: it.description || it.brand || it.manufacturer || "",
          rate: Number(it.price ?? 0),
          image: toAbs(it.imageUrl) || PLACEHOLDER_IMG,
        }));

        if (alive) setItems(mapped);
      } catch (e) {
        if (alive) setErr(e.message || "Could not load items");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => (alive = false);
  }, []);

  const handleSort = (key) => {
    setSortConfig((s) => ({
      key,
      direction: s.key === key && s.direction === "asc" ? "desc" : "asc",
    }));
  };

  const sorted = useMemo(() => {
    if (!sortConfig.key) return items;
    const clone = [...items];
    const { key, direction } = sortConfig;
    return clone.sort((a, b) => {
      const av = a[key], bv = b[key];
      if (typeof av === "string")
        return direction === "asc"
          ? av.localeCompare(bv || "")
          : (bv || "").localeCompare(av || "");
      return direction === "asc" ? av - bv : bv - av;
    });
  }, [items, sortConfig]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return sorted;
    return sorted.filter(
      (it) =>
        (it.name || "").toLowerCase().includes(q) ||
        (it.sku || "").toLowerCase().includes(q)
    );
  }, [sorted, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  const pageItems = filtered.slice(start, start + ITEMS_PER_PAGE);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(1);
  }, [totalPages, currentPage]);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Items</h1>
        <Link to={`/inventory/${type}/items/add-items`}>
          <button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md shadow">
            + New
          </button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full md:w-1/3 px-4 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {err && <div className="mb-4 text-sm text-red-600">{err}</div>}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th />
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Name
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("sku")}
              >
                SKU
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Description
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("rate")}
              >
                Rate
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : pageItems.length ? (
              pageItems.map((item) => (
                <tr
                  key={item.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => navigate(`/inventory/${type}/items/${item.id}`)}
                >
                  <td className="px-2 py-4">
                    <img
                      src={item.image || PLACEHOLDER_IMG}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                      onError={(e) => (e.currentTarget.src = PLACEHOLDER_IMG)}
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-600 hover:underline">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.sku}</td>
                  <td className="px-6 py-4 text-gray-700">{item.type}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-right text-green-600 font-semibold">
                    ${Number(item.rate || 0).toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-6 text-center text-gray-500">
                  No items found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-4 space-x-2">
        {Array.from({ length: totalPages }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded ${
              currentPage === i + 1
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
