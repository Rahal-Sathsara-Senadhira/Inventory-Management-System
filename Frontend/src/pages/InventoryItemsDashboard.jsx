import React, { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

const mockItems = [
  {
    id: 1,
    name: "Area Rug",
    sku: "CHAIR-BLK-001",
    type: "Goods",
    description: "A soft, high-quality area rug to add comfort and style.",
    rate: 9464.0,
    image:
      "https://m.media-amazon.com/images/I/81ZCxYcUZLL._AC_UF894,1000_QL80_.jpg",
  },
  {
    id: 2,
    name: "Executive Office Desk",
    sku: "Item 2 sku",
    type: "Goods",
    description: "A spacious executive desk with storage drawers.",
    rate: 6985.0,
    image:
      "https://officeshop.ae/wp-content/uploads/2022/08/modern-executive-desk.jpg",
  },
  {
    id: 3,
    name: "Sofa",
    sku: "Item 3 sku",
    type: "Goods",
    description: "A comfortable, modern sofa with plush cushions.",
    rate: 4492.0,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80",
  },
  {
    id: 4,
    name: "Executive Office Desk",
    sku: "Item 5 sku",
    type: "Goods",
    description: "A spacious executive desk with storage drawers.",
    rate: 8251.0,
    image:
      "https://images.unsplash.com/photo-1586201375761-83865001e31b?w=200&q=80",
  },
  {
    id: 5,
    name: "Sofa",
    sku: "Item 8 sku",
    type: "Goods",
    description: "A comfortable, modern sofa with plush cushions.",
    rate: 6160.0,
    image:
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=200&q=80",
  },
  {
    id: 6,
    name: "Storage Cabinet",
    sku: "Item 7 sku",
    type: "Goods",
    description: "A versatile storage cabinet with adjustable shelves.",
    rate: 9643.0,
    image:
      "https://images.unsplash.com/photo-1582582425280-7581cf4c1a04?w=200&q=80",
  },
];

const InventoryItemsDashboard = () => {
  const [items, setItems] = useState(mockItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "", direction: "" });
  const [showModal, setShowModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    sku: "",
    type: "",
    description: "",
    rate: "",
    image: "",
  });

  const navigate = useNavigate();
  const { type } = useParams();

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
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];

    if (typeof aValue === "string") {
      return sortConfig.direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else {
      return sortConfig.direction === "asc" ? aValue - bValue : bValue - aValue;
    }
  });

  const filteredItems = sortedItems.filter((item) => {
    const query = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(query) ||
      item.sku?.toLowerCase().includes(query)
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
      sku: "",
      type: "",
      description: "",
      rate: "",
      image: "",
    });
  };

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">All Items</h1>
        <Link to={`/inventory/${type}/items/add-items`}>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-md shadow"
          >
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
            {currentItems.length > 0 ? (
              currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 py-4">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  </td>
                  <td className="px-6 py-4 font-medium text-blue-600 cursor-pointer hover:underline">
                    {item.name}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{item.sku}</td>
                  <td className="px-6 py-4 text-gray-700">{item.type}</td>
                  <td className="px-6 py-4 text-gray-600 truncate max-w-xs">
                    {item.description}
                  </td>
                  <td className="px-6 py-4 text-right text-green-600 font-semibold">
                    ${item.rate.toFixed(2)}
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

export default InventoryItemsDashboard;
