import React from "react";
import { assets } from "../../../assets/assets";

const GrowthSection = () => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-14 grid md:grid-cols-2 gap-10 items-center">
        {/* image / collage */}
        <div className="relative">
          <div className="absolute -inset-6 bg-[#1ED760]/10 rounded-2xl blur-2xl" />
          <img
            src={assets.HeroImage}
            alt="Team working"
            className="relative z-[1] rounded-2xl shadow-xl"
          />
        </div>

        {/* copy */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1C10]">
            Full Service Business Growth and Development
          </h2>

          <div className="space-y-5 mt-6 text-gray-600">
            <p className="font-semibold text-[#0B1C10]">
              Nothing Impossible, One App to Manage All
            </p>
            <p className="text-sm">
              Complete features for unlimited outlets and employees. All integrated in one
              hand. One App.
            </p>

            <p className="font-semibold text-[#0B1C10]">
              You focus on selling. We manage everything for you.
            </p>

            <p className="text-sm">Anti hustle. Suitable for all.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrowthSection;
