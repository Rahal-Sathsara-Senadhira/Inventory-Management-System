import { NavLink } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useState } from "react";
import { FaHome, FaBoxes, FaCartPlus, FaChevronDown } from "react-icons/fa";

const Sidebar = () => {
  const { type } = useParams(); // e.g., 'main'
  const [openInventory, setOpenInventory] = useState(false);
  const [openSales, setOpenSales] = useState(false);
  const [openOrders, setOpenOrders] = useState(false);

  return (
    <div className="w-64 h-screen bg-[#1e293b] text-white flex flex-col sticky">
      <div className="p-4 font-bold text-xl border-b border-slate-700">
        📦 Inventory
      </div>

      <div className="flex-1 overflow-y-auto pb-20">
        <NavLink
          to={`/inventory/${type}/dashboard`}
          className={({ isActive }) =>
            `flex items-center gap-2 p-3 hover:bg-slate-700 ${
              isActive ? "bg-slate-800" : ""
            }`
          }
        >
          <FaHome />
          Home
        </NavLink>

        {/* Inventory Group */}
        <div>
          <button
            className="flex items-center justify-between w-full p-3 hover:bg-slate-700"
            onClick={() => setOpenInventory(!openInventory)}
          >
            <div className="flex items-center gap-2">
              <FaBoxes /> Inventory
            </div>
            <FaChevronDown
              className={`transition-transform ${
                openInventory ? "rotate-180" : ""
              }`}
            />
          </button>

          {openInventory && (
            <div className="pl-6 space-y-1">
              <NavLink
                to={`/inventory/${type}/items`}
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-slate-700 ${
                    isActive ? "bg-slate-800" : ""
                  }`
                }
              >
                Items
              </NavLink>
              <div className="p-2 text-sm text-slate-400">Composite Items</div>
              <div className="p-2 text-sm text-slate-400">Item Groups</div>
              <NavLink
                to={`/inventory/${type}/itemGroups`}
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-slate-700 ${
                    isActive ? "bg-slate-800" : ""
                  }`
                }
              >
                Item Groups
              </NavLink>
            </div>
          )}
        </div>

        {/* Add other sections like Sales, Purchases, etc. */}

        {/* Sales Group */}
        <div>
          <button
            className="flex items-center justify-between w-full p-3 hover:bg-slate-700"
            onClick={() => setOpenSales(!openSales)}
          >
            <div className="flex items-center gap-2">
              <FaBoxes /> Sales
            </div>
            <FaChevronDown
              className={`transition-transform ${
                openSales ? "rotate-180" : ""
              }`}
            />
          </button>

          {openSales && (
            <div className="pl-6 space-y-1">
              <NavLink
                to={`/inventory/${type}/customers`}
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-slate-700 ${
                    isActive ? "bg-slate-800" : ""
                  }`
                }
              >
                Customers
              </NavLink>
              <NavLink
                to={`/inventory/${type}/salesOrders`}
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-slate-700 ${
                    isActive ? "bg-slate-800" : ""
                  }`
                }
              >
                Sales Orders
              </NavLink>
              <div className="p-2 text-sm text-slate-400">Composite Items</div>
              <div className="p-2 text-sm text-slate-400">Item Groups</div>
              <NavLink
                to={`/inventory/${type}/itemGroups`}
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-slate-700 ${
                    isActive ? "bg-slate-800" : ""
                  }`
                }
              >
                Item Groups
              </NavLink>
            </div>
          )}
        </div>

        {/* Orders Group */}
        <div>
          <button
            className="flex items-center justify-between w-full p-3 hover:bg-slate-700"
            onClick={() => setOpenOrders(!openOrders)}
          >
            <div className="flex items-center gap-2">
              <FaBoxes /> Orders
            </div>
            <FaChevronDown
              className={`transition-transform ${
                openOrders ? "rotate-180" : ""
              }`}
            />
          </button>

          {openOrders && (
            <div className="pl-6 space-y-1">
              <NavLink
                to={`/inventory/${type}/packages`}
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-slate-700 ${
                    isActive ? "bg-slate-800" : ""
                  }`
                }
              >
                Packages
              </NavLink>
              <NavLink
                to={`/inventory/${type}/delivered-packages`}
                className={({ isActive }) =>
                  `block p-2 rounded hover:bg-slate-700 ${
                    isActive ? "bg-slate-800" : ""
                  }`
                }
              >
                Delivered Packages
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
