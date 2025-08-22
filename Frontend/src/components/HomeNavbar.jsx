import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { assets } from "../assets/assets";

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "About", to: "/about" },
  { label: "Support", to: "/contact" },
];

const HomeNavbar = () => {
  const navigate = useNavigate();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Glassy header when scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleNavigation = (to) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/70 backdrop-blur-xl border-b border-black/5"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => handleNavigation("/")}
            className="shrink-0 outline-none"
            aria-label="Go to home"
          >
            <img src={assets.Dark_MainLogo} alt="Zentory" className="w-32" />
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            {/* {NAV_ITEMS.map((item) => (
              <button
                key={item.to}
                onClick={() => handleNavigation(item.to)}
                className="text-gray-700 hover:text-[#138A4E] font-medium"
              >
                {item.label}
              </button>
            ))} */}

            {/* Login button */}
            <button
              onClick={() => handleNavigation("/login")}
              className="px-4 py-2 rounded-md bg-[#1ED760] text-[#0B1C10] font-semibold hover:opacity-90"
            >
              Login
            </button>
          </div>

          {/* Mobile burger */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen((s) => !s)}
              aria-label="Toggle navigation menu"
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-black/5 bg-white/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.to}
                onClick={() => handleNavigation(item.to)}
                className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-gray-800"
              >
                {item.label}
              </button>
            ))}

            {/* Login button for mobile */}
            <button
              onClick={() => handleNavigation("/login")}
              className="mt-2 block w-full px-4 py-2 rounded-md bg-[#1ED760] text-[#0B1C10] font-semibold hover:opacity-90"
            >
              Login
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};

export default HomeNavbar;
