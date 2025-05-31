import React, { useState, useRef, useEffect } from "react";
import { FaBell, FaUserCircle, FaUsersCog, FaCog, FaChevronDown } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";

const storeOptions = ["electronics", "clothing", "groceries", "books"];

const Navbar = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef();

  const handleStoreSelect = (selectedStore) => {
    navigate(`/inventory/${selectedStore}/dashboard`);
    setShowDropdown(false);
  };

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="w-full bg-white shadow-md px-6 py-3 flex items-center justify-between">
      {/* Left side - Search */}
      <div className="flex items-center w-full">
        <input
          type="text"
          placeholder="Search..."
          className="w-1/4 focus:w-1/3 min-w-40 transition-all duration-300 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6 text-gray-600 relative" ref={dropdownRef}>
        {/* Store Name Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-1 font-semibold text-lg text-gray-800 capitalize hover:text-blue-500 transition"
          >
            {type} <FaChevronDown />
          </button>

          {showDropdown && (
            <div className="absolute right-0 mt-2 w-40 bg-white border shadow-lg rounded-md z-50">
              {storeOptions.map((store) => (
                <div
                  key={store}
                  onClick={() => handleStoreSelect(store)}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer capitalize"
                >
                  {store}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Icons */}
        <button className="hover:text-blue-500 transition duration-200">
          <FaBell size={20} />
        </button>
        <button className="hover:text-blue-500 transition duration-200">
          <FaUsersCog size={20} />
        </button>
        <button className="hover:text-blue-500 transition duration-200">
          <FaCog size={20} />
        </button>
        <button className="hover:text-blue-500 transition duration-200">
          <FaUserCircle size={24} />
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
