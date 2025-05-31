import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const HomeNavbar = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(true); // Simulate login
  const [showDropdown, setShowDropdown] = useState(false);

  const handleInventoryClick = () => {
    setShowDropdown((prev) => !prev);
  };

  const handleNavigation = (path) => {
    setShowDropdown(false);
    navigate(path);
  };

  return (
    <div className="relative p-4 bg-gray-100">
      <h2 className="text-xl font-bold">HomeNavbar</h2>

      {token ? (
        <div className="inline-block relative">
          <button
            onClick={handleInventoryClick}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Inventory
          </button>
          {showDropdown && (
            <div className="absolute top-full mt-1 left-0 bg-white shadow-md border rounded w-48 z-10">
              <button
                onClick={() => handleNavigation("/inventory/electronics/dashboard")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Electronics
              </button>
              <button
                onClick={() => handleNavigation("/inventory/furniture/dashboard")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Furniture
              </button>
              <button
                onClick={() => handleNavigation("/inventory/clothing/dashboard")}
                className="block w-full text-left px-4 py-2 hover:bg-gray-100"
              >
                Clothing
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => navigate("/Login")}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Sign up
        </button>
      )}
    </div>
  );
};

export default HomeNavbar;
