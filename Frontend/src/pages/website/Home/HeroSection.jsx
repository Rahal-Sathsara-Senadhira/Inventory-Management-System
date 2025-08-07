import React from "react";
import { assets } from "../../../assets/assets";

const HeroSection = () => {
  return (
    <section className="bg-[#0A192F] text-white relative overflow-hidden pt-24 pb-16">
      <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between relative z-10">
        {/* Text Area */}
        <div className="md:w-1/2 space-y-6">
          <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
            One Cashier App <br className="hidden sm:block" />
            For All Types Of Business
          </h1>
          <p className="text-gray-300 max-w-md">
            A cloud-based online cashier application that can take your business potential to the highest level, both online and offline.
          </p>
          <button className="mt-4 bg-green-500 text-white font-semibold px-6 py-3 rounded hover:bg-green-600 transition">
            Free Download
          </button>

          {/* Brand logos */}
          <div className="flex gap-4 mt-6">
            {["🔥", "🍜", "🍔", "🐓", "🍦"].map((logo, i) => (
              <div key={i} className="bg-white text-black rounded-full w-12 h-12 flex items-center justify-center shadow-md text-xl">
                {logo}
              </div>
            ))}
          </div>
        </div>

        {/* Image Area */}
        <div className="md:w-1/2 mt-10 md:mt-0 relative">
          <img
            src={assets.HeroImage}
            alt="App Screenshot"
            className="w-full max-w-md mx-auto rounded-lg shadow-2xl -rotate-2"
          />
        </div>
      </div>

      {/* Optional: Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent z-0" />
    </section>
  );
};

export default HeroSection;
