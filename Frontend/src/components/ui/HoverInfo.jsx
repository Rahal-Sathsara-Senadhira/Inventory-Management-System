// src/components/HoverInfo.jsx

import React from "react";
import { Info } from "lucide-react"; // You can use another icon if you want

const HoverInfo = ({ text }) => {
  return (
    <div className="relative flex items-center group">
      <Info className="w-4 h-4 text-gray-500 cursor-pointer ml-2" />

      <div className=" ml-3 absolute left-5 top-0 z-10 hidden w-72 rounded-md bg-gray-800 p-3 text-sm text-white shadow-lg group-hover:block">
        {text}
        <div className="absolute left-0 top-2 -ml-1 h-3 w-3 rotate-45 bg-gray-800"></div>
      </div>
    </div>
  );
};

export default HoverInfo;
