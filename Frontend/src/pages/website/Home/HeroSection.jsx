// src/pages/website/Home/HeroSection.jsx
import React from "react";
import { assets } from "../../../assets/assets";

const HeroSection = () => {
  return (
    <section className="relative bg-[#0B1C10] text-white overflow-visible min-h-[80vh] md:min-h-screen">
      <div className="relative max-w-7xl mx-auto px-4 lg:px-6 pt-16 md:pt-20 pb-16 md:pb-28 grid md:grid-cols-2 gap-10 items-center z-10">
        {/* Left copy */}
        <div className="space-y-6">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight">
            One Management<br />Tool For All Type<br />Of Business
          </h1>

          <p className="text-white/70 max-w-xl text-base sm:text-lg">
            A cloud based application that can take your business potential to the highest level.
          </p>

          <button className="inline-flex items-center justify-center px-6 py-3 rounded-md bg-[#7FC344] text-white font-semibold hover:opacity-90">
            Get Start
          </button>

          <div className="flex gap-3 pt-2 sm:pt-4">
            {["🍔","🍕","🍗"].map((x,i)=>(
              <div key={i} className="w-10 h-10 sm:w-11 sm:h-11 grid place-items-center rounded-full bg-white text-black shadow">
                {x}
              </div>
            ))}
          </div>
        </div>

        {/* spacer only (keeps height on md+) */}
        <div className="hidden md:block" />
      </div>

      {/* glow */}
      <div className="hidden md:block absolute right-[-14rem] top-[-8rem] -z-10 w-[38rem] h-[38rem] bg-white/5 blur-3xl rounded-full" />

      {/* Tablet peeking in (only part visible on md+) */}
      <img
        src={assets.HeroImage}
        alt="App preview"
        className="
          hidden md:block pointer-events-none absolute
          right-[-9rem] top-[3.5rem] z-20
          w-[46rem] lg:w-[52rem]
          rotate-[-14deg] drop-shadow-2xl rounded-2xl
        "
      />

      {/* Mobile: show full tablet below copy */}
      <div className="md:hidden mt-6 px-4">
        <img
          src={assets.HeroImage}
          alt="App preview"
          className="w-full max-w-xl mx-auto rounded-2xl rotate-[-8deg] shadow-2xl"
        />
      </div>
    </section>
  );
};

export default HeroSection;
