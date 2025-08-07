import React from "react";

const HoverInfo = ({ text }) => {
  return (
    <div className="relative flex items-center group">
      {/* Display "ⓘ" text */}
      <span className="text-blue-500 cursor-pointer">ⓘ</span>

      {/* Tooltip on hover */}
      <div className="absolute left-10 top-0 -ml-6 z-10 hidden w-72 rounded-md bg-gray-800 p-3 text-sm text-white shadow-lg group-hover:block">
        {text}
        <div className="absolute left-1/2 top-0 -ml-1 h-3 w-3 rotate-45 bg-gray-800"></div>
      </div>
    </div>
  );
};

export default HoverInfo;
