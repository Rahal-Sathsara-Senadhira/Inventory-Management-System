import React from "react";

const rows = [
  "Unlimited Transaction",
  "Multi Outlet",
  "Report Featured",
  "Inventory Management",
  "Direct report & item review",
  "Employee Management System",
  "CRM and Promotion Features",
  "POS/Printer & Toll Integration",
];

const plans = [
  { name: "Basic", price: 20, best: false },
  { name: "Basic", price: 20, best: true }, // center highlighted like mock
  { name: "Basic", price: 20, best: false },
];

const Pricing = () => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-16">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1C10]">
          Choose The Right Plan For Your Productivity
        </h2>

        <div className="mt-8 grid md:grid-cols-3 gap-6">
          {plans.map((p, idx) => (
            <div
              key={idx}
              className={`rounded-2xl border ${
                p.best ? "border-[#138A4E] shadow-xl" : "border-gray-200 shadow"
              } bg-white p-6 flex flex-col`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold">{p.name}</span>
                {p.best && (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#E8FFF3] text-[#138A4E]">
                    Best
                  </span>
                )}
              </div>
              <div className="mt-2">
                <span className="text-3xl font-extrabold">${p.price}</span>
                <span className="text-xs text-gray-500"> / month</span>
              </div>

              <ul className="mt-6 space-y-3 text-sm">
                {rows.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className={`mt-1 h-4 w-4 rounded-full border ${p.best ? "bg-[#1ED760]" : "bg-gray-200"}`} />
                    <span className="text-gray-700">{r}</span>
                  </li>
                ))}
              </ul>

              <button
                className={`mt-6 w-full rounded-md py-2 font-semibold ${
                  p.best
                    ? "bg-[#138A4E] text-white hover:opacity-90"
                    : "bg-gray-100 text-[#0B1C10] hover:bg-gray-200"
                }`}
              >
                Choose Plan
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
