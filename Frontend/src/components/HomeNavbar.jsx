import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { assets } from "../assets/assets";

const HomeNavbar = () => {
  const navigate = useNavigate();
  const [token, setToken] = useState(true); // Simulate login
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleNavigation = (path) => {
    setShowDropdown(false);
    setMenuOpen(false);
    navigate(path);
  };

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/30 backdrop-blur-md shadow-md border-b border-white/40"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <div
          className="cursor-pointer"
          onClick={() => navigate("/")}
        >
          <img src={assets.Dark_MainLogo} alt="" className="w-32"/>
        </div>

        <div className="md:hidden">
          <button onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        <div className="hidden md:flex items-center gap-6">
          <button onClick={() => handleNavigation("/")} className="text-gray-700 hover:text-blue-600">Home</button>
          <button onClick={() => handleNavigation("/about")} className="text-gray-700 hover:text-blue-600">About</button>
          <button onClick={() => handleNavigation("/contact")} className="text-gray-700 hover:text-blue-600">Contact</button>

          {token ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="bg-background-lightGreen-500 text-white px-4 py-2 rounded hover:bg-background-lightGreen-300"
              >
                Inventory
              </button>
              {showDropdown && (
                <div className="absolute mt-2 left-0 bg-white shadow-md border rounded w-48 z-10">
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
              onClick={() => navigate("/login")}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
            >
              Sign Up
            </button>
          )}
        </div>
      </div>

      {menuOpen && (
        <div className="md:hidden px-4 pb-4 space-y-2 bg-white/60 backdrop-blur-md">
          <button onClick={() => handleNavigation("/")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Home</button>
          <button onClick={() => handleNavigation("/about")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">About</button>
          <button onClick={() => handleNavigation("/contact")} className="block w-full text-left px-4 py-2 hover:bg-gray-100">Contact</button>

          {token ? (
            <>
              <button
                onClick={() => handleNavigation("/inventory/electronics/dashboard")}
                className="block w-full text-left px-4 py-2 bg-blue-100 rounded"
              >
                Electronics
              </button>
              <button
                onClick={() => handleNavigation("/inventory/furniture/dashboard")}
                className="block w-full text-left px-4 py-2 bg-blue-100 rounded"
              >
                Furniture
              </button>
              <button
                onClick={() => handleNavigation("/inventory/clothing/dashboard")}
                className="block w-full text-left px-4 py-2 bg-blue-100 rounded"
              >
                Clothing
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate("/login")}
              className="block w-full bg-green-600 text-white px-4 py-2 rounded"
            >
              Sign Up
            </button>
          )}
        </div>
      )}
    </nav>
  );
};

export default HomeNavbar;
