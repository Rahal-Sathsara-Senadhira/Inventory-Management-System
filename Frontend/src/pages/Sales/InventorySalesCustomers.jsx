import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { customers } from "../../assets/assets";

const InventorySalesCustomers = () => {
  const { type } = useParams();
  const [items, setItems] = useState(customers);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const [newItem, setNewItem] = useState({
    name: "",
    company_name: "",
    email: "",
    work_phone: "",
    receivables: "",
    unused_credits: "",
  });

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (!sortConfig.key) return 0;
    const aValue = a[sortConfig.key] ?? "";
    const bValue = b[sortConfig.key] ?? "";

    if (typeof aValue === "string" && typeof bValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortConfig.direction === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    }
  });

  const filteredItems = sortedItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.company_name?.toLowerCase().includes(query)
    );
  });

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  const handleAddItem = () => {
    const newItemWithId = {
      ...newItem,
      id: Date.now(),
      rate: parseFloat(newItem.rate),
    };
    setItems([newItemWithId, ...items]);
    setShowModal(false);
    setNewItem({
      name: "",
      company_name: "",
      email: "",
      work_phone: "",
      receivables: "",
      unused_credits: "",
    });
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Customers</h1>
        <Link to={`/inventory/${type}/customers/add-customers`}>
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("name")}
              >
                Name
              </th>
              <th
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("company_name")}
              >
                COMPANY NAME
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                EMAIL
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                WORK PHONE
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("receivables")}
              >
                RECEIVABLES
              </th>
              <th
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase cursor-pointer"
                onClick={() => handleSort("unused_credits")}
              >
                UNUSED CREDITS
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-100">
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.cus_id} className="hover:bg-gray-50" onClick={() => navigate(`/inventory/${type}/customers/${item.cus_id}`)}>
                  <td className="px-6 py-4 font-medium text-blue-600 cursor-pointer hover:underline">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    {item.company_name?item.company_name:"Individual"}
                    
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.email}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                    {item.phone}
                  </td>
                  <td className="px-6 py-4 text-right  font-semibold">
                    ${item.receivables.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 text-right  font-semibold">
                    ${item.unused_credits.toFixed(2)}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-md p-6 w-full max-w-md space-y-4 shadow-xl">
            <h2 className="text-xl font-semibold">Add New Item</h2>
            <input
              type="text"
              placeholder="Name"
              className="w-full px-4 py-2 border rounded"
              value={newItem.name}
              onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            />
            <input
              type="text"
              placeholder="SKU"
              className="w-full px-4 py-2 border rounded"
              value={newItem.sku}
              onChange={(e) => setNewItem({ ...newItem, sku: e.target.value })}
            />
            <input
              type="text"
              placeholder="Type"
              className="w-full px-4 py-2 border rounded"
              value={newItem.type}
              onChange={(e) => setNewItem({ ...newItem, type: e.target.value })}
            />
            <input
              type="text"
              placeholder="Description"
              className="w-full px-4 py-2 border rounded"
              value={newItem.description}
              onChange={(e) =>
                setNewItem({ ...newItem, description: e.target.value })
              }
            />
            <input
              type="number"
              placeholder="Rate"
              className="w-full px-4 py-2 border rounded"
              value={newItem.rate}
              onChange={(e) => setNewItem({ ...newItem, rate: e.target.value })}
            />
            <input
              type="text"
              placeholder="Image URL"
              className="w-full px-4 py-2 border rounded"
              value={newItem.image}
              onChange={(e) =>
                setNewItem({ ...newItem, image: e.target.value })
              }
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                className="px-4 py-2 rounded bg-blue-600 text-white"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventorySalesCustomers;
