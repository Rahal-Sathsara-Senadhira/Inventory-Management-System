import { Menu } from "@headlessui/react";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

const API_BASE = import.meta.env?.VITE_API_BASE || "http://localhost:5000";

const ActionsDropdown = ({ itemId, onDeleted }) => {
  const handleDelete = async () => {
    if (!itemId) return alert("Missing item id.");
    if (!window.confirm("Are you sure you want to delete this item?")) return;

    try {
      const res = await fetch(`${API_BASE}/api/items/${itemId}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return alert(`Failed to delete: ${err.error || res.statusText}`);
      }
      alert("Item deleted successfully");
      // Call only if provided
      if (typeof onDeleted === "function") onDeleted(itemId);
    } catch (e) {
      console.error("Error deleting item:", e);
      alert("Error deleting item");
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50">
        Actions
        <ChevronDownIcon className="w-5 h-5 ml-2" aria-hidden="true" />
      </Menu.Button>
      <Menu.Items className="absolute right-0 z-10 mt-2 w-56 origin-top-right bg-white border border-gray-200 divide-y divide-gray-100 rounded-md shadow-lg focus:outline-none">
        <div className="py-1">
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => console.log("Clone")}
                className={`${active ? "bg-gray-100" : ""} w-full text-left px-4 py-2 text-sm text-gray-700`}
              >
                📄 Clone
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => console.log("Mark as Inactive")}
                className={`${active ? "bg-gray-100" : ""} w-full text-left px-4 py-2 text-sm text-gray-700`}
              >
                🚫 Mark as Inactive
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={handleDelete}
                className={`${active ? "bg-red-100 text-red-700" : "text-red-600"} w-full text-left px-4 py-2 text-sm`}
              >
                🗑 Delete
              </button>
            )}
          </Menu.Item>
          <Menu.Item>
            {({ active }) => (
              <button
                onClick={() => console.log("Add to Group")}
                className={`${active ? "bg-gray-100" : ""} w-full text-left px-4 py-2 text-sm text-gray-700`}
              >
                ➕ Add to Group
              </button>
            )}
          </Menu.Item>
        </div>
      </Menu.Items>
    </Menu>
  );
};

export default ActionsDropdown;
