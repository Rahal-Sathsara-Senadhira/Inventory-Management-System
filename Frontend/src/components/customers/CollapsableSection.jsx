import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

export default function CollapsibleSection({ title, children }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border rounded-lg border-gray-200 m-3">
      <button
        className="w-full flex rounded-lg items-center py-3 px-4 bg-gray-50  hover:bg-gray-50 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
        <span className="font-medium text-gray-800">{title}</span>
         
      </button>
      <div
        className={`transition-all duration-300 overflow-hidden ${
          isOpen ? "max-h-screen p-4" : "max-h-0 p-0"
        }`}
      >
        {isOpen && <div className="bg-white rounded-md">{children}</div>}
      </div>
    </div>
  );
}
