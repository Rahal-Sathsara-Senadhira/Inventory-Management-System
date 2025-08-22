// src/pages/website/Home/ShowcaseSection.jsx
import React from "react";
import { assets } from "../../../assets/assets";

const ShowcaseSection = () => {
  return (
    <section id="showcase" className="relative bg-white overflow-visible">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 pt-12 text-center">
        <h2 className="text-3xl md:text-4xl font-extrabold text-[#0B1C10]">
          Management System for Various Types of Business
        </h2>
        <p className="mt-2 text-gray-500">
          Whatever your business, experience how easy it is to manage
          purchases and sales
        </p>
      </div>

      {/* Cropped tablet (top half only) */}
      <div className="max-w-6xl mx-auto px-4 lg:px-6 py-10">
        <div className="rounded-[28px] overflow-hidden">
          {/* The wrapper height is set to ~half of a 16:9 image (32/9 = 2× wider). 
              If your tablet image isn’t 16:9, adjust the ratio below. */}
          <div className="relative aspect-[18/9]"> 
            <img
              src={assets.HeroImage}
              alt="Product preview"
              className="absolute inset-0 w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ShowcaseSection;
