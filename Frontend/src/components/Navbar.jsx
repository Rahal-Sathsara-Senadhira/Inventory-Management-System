// src/components/Navbar.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  FaBell,
  FaUserCircle,
  FaUsersCog,
  FaCog,
  FaChevronDown,
  FaSignOutAlt,
  FaClock,
  FaMoneyCheckAlt,
} from "react-icons/fa";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const storeOptions = ["electronics", "clothing", "groceries", "books"];

const Navbar = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [search, setSearch] = useState("");
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showBell, setShowBell] = useState(false);

  const storeRef = useRef(null);
  const userRef = useRef(null);
  const bellRef = useRef(null);

  const storeLabel = (type || "electronics").toLowerCase();

  const handleStoreSelect = (selectedStore) => {
    navigate(`/inventory/${selectedStore}/dashboard`);
    setShowStoreDropdown(false);
  };

  // search: submit on Enter
  const onSearchKey = (e) => {
    if (e.key === "Enter") {
      const q = search.trim();
      // Navigate to items with a simple query param (safe even if the page ignores it)
      navigate(`/inventory/${storeLabel}/items${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    }
  };

  // Close any dropdowns if clicked outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (storeRef.current && !storeRef.current.contains(e.target)) setShowStoreDropdown(false);
      if (userRef.current && !userRef.current.contains(e.target)) setShowUserMenu(false);
      if (bellRef.current && !bellRef.current.contains(e.target)) setShowBell(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") {
        setShowStoreDropdown(false);
        setShowUserMenu(false);
        setShowBell(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  const go = useCallback(
    (path) => navigate(`/inventory/${storeLabel}/${path}`),
    [navigate, storeLabel]
  );

  const isAdmin = user?.role === "ADMIN";
  const isManager = user?.role === "MANAGER";
  const canTimekeep = isAdmin || isManager;

  const onLogout = () => {
    // Clear auth (via your context) and send to login
    if (logout) logout();
    navigate("/login", { replace: true });
  };

  return (
    <nav className="w-full bg-white shadow-md px-4 md:px-6 py-3 flex items-center justify-between">
      {/* Left: Search */}
      <div className="flex items-center w-full">
        <input
          type="text"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={onSearchKey}
          className="w-1/2 md:w-1/3 lg:w-1/4 min-w-40 transition-all duration-300 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Right: Menus & Icons */}
      <div className="flex items-center gap-4 md:gap-6 text-gray-700 relative">
        {/* Store Switcher */}
        <div className="relative" ref={storeRef}>
          <button
            onClick={() => setShowStoreDropdown((s) => !s)}
            className="flex items-center gap-1 font-semibold text-lg text-gray-900 capitalize hover:text-blue-600 transition"
            title="Switch store"
            aria-haspopup="menu"
            aria-expanded={showStoreDropdown}
          >
            {storeLabel} <FaChevronDown />
          </button>

          {showStoreDropdown && (
            <div
              className="absolute right-0 mt-2 w-44 bg-white border shadow-lg rounded-md z-50 overflow-hidden"
              role="menu"
            >
              {storeOptions.map((store) => (
                <button
                  key={store}
                  onClick={() => handleStoreSelect(store)}
                  className="w-full text-left px-4 py-2 hover:bg-blue-50 cursor-pointer capitalize"
                  role="menuitem"
                >
                  {store}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications (placeholder dropdown) */}
        <div className="relative" ref={bellRef}>
          <button
            className="hover:text-blue-600 transition duration-200"
            onClick={() => setShowBell((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={showBell}
            title="Notifications"
          >
            <FaBell size={18} />
          </button>
          {showBell && (
            <div className="absolute right-0 mt-2 w-72 bg-white border shadow-lg rounded-md z-50 p-3">
              <div className="font-semibold mb-2">Notifications</div>
              <div className="text-sm text-slate-600">No new notifications.</div>
            </div>
          )}
        </div>

        {/* Employees (Admin only) */}
        <button
          className={`transition duration-200 ${isAdmin ? "hover:text-blue-600" : "opacity-50 cursor-not-allowed"}`}
          onClick={() => isAdmin && go("employees")}
          title={isAdmin ? "Employees" : "Admins only"}
        >
          <FaUsersCog size={18} />
        </button>

        {/* Roles / Settings (Admins & Managers can open Roles page) */}
        <button
          className={`transition duration-200 ${canTimekeep ? "hover:text-blue-600" : "opacity-50 cursor-not-allowed"}`}
          onClick={() => canTimekeep && go("roles")}
          title={canTimekeep ? "Roles & Rates" : "Admins/Managers only"}
        >
          <FaCog size={18} />
        </button>

        {/* User menu */}
        <div className="relative" ref={userRef}>
          <button
            className="hover:text-blue-600 transition duration-200 flex items-center gap-2"
            onClick={() => setShowUserMenu((s) => !s)}
            aria-haspopup="menu"
            aria-expanded={showUserMenu}
            title="Account"
          >
            <FaUserCircle size={22} />
            <span className="hidden md:inline text-sm font-medium">
              {user?.name || "Account"}
            </span>
          </button>

          {showUserMenu && (
            <div
              className="absolute right-0 mt-2 w-60 bg-white border shadow-lg rounded-md z-50 overflow-hidden"
              role="menu"
            >
              <div className="px-4 py-3 border-b">
                <div className="font-semibold truncate">{user?.name || "User"}</div>
                <div className="text-xs text-slate-500">{user?.email || ""}</div>
                {user?.role && (
                  <div className="mt-1 inline-flex items-center gap-2 text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Role: {user.role}
                  </div>
                )}
              </div>

              <div className="py-1">
                {/* Quick links visible to Admin/Manager */}
                <button
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 ${canTimekeep ? "" : "hidden"}`}
                  onClick={() => {
                    setShowUserMenu(false);
                    go("time-keeping");
                  }}
                  role="menuitem"
                >
                  <FaClock /> Time Keeping
                </button>
                <button
                  className={`w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-blue-50 ${canTimekeep ? "" : "hidden"}`}
                  onClick={() => {
                    setShowUserMenu(false);
                    go("worked-hours");
                  }}
                  role="menuitem"
                >
                  <FaMoneyCheckAlt /> Worked Hours & Payroll
                </button>

                {/* Divider */}
                <div className="my-1 border-t" />

                <button
                  className="w-full flex items-center gap-2 px-4 py-2 text-left hover:bg-red-50 text-red-600"
                  onClick={onLogout}
                  role="menuitem"
                >
                  <FaSignOutAlt /> Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
