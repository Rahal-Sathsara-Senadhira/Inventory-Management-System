import React, { useState } from "react";

const CustomSelect = ({ options, placeholder, onChange }) => {
  const [selected, setSelected] = useState("");

  const handleChange = (e) => {
    const value = e.target.value;
    setSelected(value);
    if (onChange) onChange(value);
  };

  return (
    <select
      value={selected}
      onChange={handleChange}
      className="block w-full p-1 border min-w-28 border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-400 bg-white "
    >
      <option className="text-gray-200" value="" disabled hidden>
        {placeholder}
      </option>
      {options.map((opt) => (
        <option className="text-gray-700" key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
};

export default CustomSelect;
