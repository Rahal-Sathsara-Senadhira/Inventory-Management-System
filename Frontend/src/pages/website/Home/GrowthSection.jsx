import React from "react";
import { assets } from "../../../assets/assets";

const GrowthSection = () => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6">
        <h2 className="text-2xl sm:text-5xl pt-14 font-bold text-[#FF8000]">
          Full Service Business Growth <br />
          and Development
        </h2>
      </div>

      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-14 grid md:grid-cols-2 gap-10 items-start">
        {/* image / collage */}
        <div className="relative">
          <div className="absolute -inset-6 bg-[#7FC344]/10 rounded-2xl blur-2xl" />
          <img
            src={assets.GrowthSection}
            alt="Team working"
            className="relative z-[1] rounded-2xl "
          />
        </div>

        {/* copy */}
        <div className="">
          <div className="space-y-5 mt-6 text-gray-600">
            <p className="font-semibold text-[#0B1C10] text-lg">
              Nothing Impossible, One App to Manage All
            </p>
            <p className="text-base w-3/4 mt-0" style={{margin:0}}>
              Complete features for unlimited outlets and employees. All
              integrated in one hand. One App.
            </p>

            <p className="font-semibold text-[#0B1C10] text-lg" >
              You focus on selling. We manage everything for you.
            </p>

            <p className="text-base" style={{margin:0}}>Anti hustle. Suitable for all.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default GrowthSection;
