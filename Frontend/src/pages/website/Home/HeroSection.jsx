import React from "react";
import { assets } from "../../../assets/assets";

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-[#0B1C10] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-16 pb-12 grid md:grid-cols-2 gap-10 items-center">
        {/* Left copy */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
            One Management<br className="hidden sm:block" />
            Tool For All Type<br className="hidden sm:block" />
            Of Business
          </h1>

          <p className="text-white/70 max-w-xl">
            A cloud based application that can take your business potential to
            the highest level.
          </p>

          <div className="flex items-center gap-3">
            <button className="px-6 py-3 rounded-md bg-[#1ED760] text-[#0B1C10] font-semibold hover:opacity-90 transition">
              Get Start
            </button>
            <div className="flex items-center gap-2 text-sm text-white/70">
              <span>Trusted by brands:</span>
              <div className="flex gap-2">
                {["🍔", "🍕", "🍜"].map((x, i) => (
                  <div
                    key={i}
                    className="bg-white text-black rounded-full w-9 h-9 grid place-items-center shadow"
                  >
                    {x}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right image */}
        <div className="relative">
          <div className="absolute -inset-12 md:-inset-16 bg-[#1ED760]/10 rounded-full blur-3xl" />
          <img
            src={assets.HeroImage}
            alt="App preview"
            className="relative z-[1] w-full max-w-lg mx-auto rounded-xl shadow-2xl -rotate-8"
          />
        </div>
      </div>

      {/* subtle shine */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </section>
  );
};

export default HeroSection;
