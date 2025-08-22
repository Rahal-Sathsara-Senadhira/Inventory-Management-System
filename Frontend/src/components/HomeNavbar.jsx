import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { assets } from "../assets/assets";

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "Features", hash: "features" }, // scroll on home
  { label: "Pricing", hash: "pricing" },   // scroll on home
];

const HomeNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  // Glassy header when scrolling
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // If we land with a hash (e.g., from navigation), scroll to it
  useEffect(() => {
    const id = location.hash?.replace("#", "");
    if (id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [location]);

  const scrollOrNavigate = (hash) => {
    setMenuOpen(false);
    // If already on home, smooth scroll to section
    if (location.pathname === "/" && hash) {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
    }
    // Otherwise go to home with hash (Home.jsx effect will scroll)
    if (hash) {
      navigate({ pathname: "/", hash: `#${hash}` });
    } else {
      navigate("/");
    }
  };

  const handleNavigation = (to) => {
    setMenuOpen(false);
    navigate(to);
  };

  return (
    <nav
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-black/5 backdrop-blur-xl border-b bg-white/70"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <div className="h-16 flex items-center justify-between">
          {/* Logo */}
          <button
            onClick={() => scrollOrNavigate("")}
            className="shrink-0 outline-none"
            aria-label="Go to home"
          >
            <img src={scrolled?assets.Light_MainLogo : assets.Dark_MainLogo} alt="Zentory" className="w-32" />
          </button>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => scrollOrNavigate("")}
              className={`${scrolled?"text-[#0B1C10]":"text-white"} font-medium`}
            >
              Home
            </button>
            <button
              onClick={() => scrollOrNavigate("features")}
              className={`${scrolled?"text-[#0B1C10]":"text-white"} font-medium`}
            >
              Features
            </button>
            <button
              onClick={() => scrollOrNavigate("pricing")}
              className={`${scrolled?"text-[#0B1C10]":"text-white"} font-medium`}
            >
              Pricing
            </button>

            {/* Login button */}
            <button
              onClick={() => handleNavigation("/login")}
              className="px-4 py-2 rounded-md bg-[#7FC344] text-white font-semibold hover:opacity-90"
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
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className={`w-6 h-6${scrolled?"":"text-white"}`} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="md:hidden border-t border-black/5 bg-white/95 backdrop-blur-xl">
          <div className="max-w-7xl mx-auto px-4 lg:px-6 py-3 space-y-1">
            <button
              onClick={() => scrollOrNavigate("")}
              className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-gray-800"
            >
              Home
            </button>
            <button
              onClick={() => scrollOrNavigate("features")}
              className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-gray-800"
            >
              Features
            </button>
            <button
              onClick={() => scrollOrNavigate("pricing")}
              className="block w-full text-left px-4 py-2 rounded-md hover:bg-gray-50 text-gray-800"
            >
              Pricing
            </button>

            {/* Login button for mobile */}
            <button
              onClick={() => handleNavigation("/login")}
              className="mt-2 block w-full px-4 py-2 rounded-md bg-[#7FC344] text-white font-semibold hover:opacity-90"
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
