import React from "react";

const items = [
  { big: "4.8", small: "App Rating", note: "★★★★★" },
  { big: "89.9%", small: "Engagement Orders", note: "Loyalty Customers" },
  { big: "2158", small: "Trusted Retailers", note: "Businesses Worldwide" },
];

const StatsStrip = () => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 grid sm:grid-cols-3 gap-6">
        {items.map((it, i) => (
          <div
            key={i}
            className="rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow transition"
          >
            <div className="text-3xl font-extrabold text-[#0B1C10]">{it.big}</div>
            <div className="text-sm text-gray-500">{it.small}</div>
            <div className="mt-2 text-xs text-gray-400">{it.note}</div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatsStrip;
