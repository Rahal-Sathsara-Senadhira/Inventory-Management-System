import React from "react";

const features = [
  {
    title: "Easily Manage Product and Sales",
    desc: "Simplify your product management across items, variants and transactions.",
    badge: "POS",
  },
  {
    title: "Accepts All Latest Payment Types",
    desc: "Support QRIS, your own concept & modern digital payments in a single system.",
    badge: "Payments",
  },
  {
    title: "Easily Accessible Sales Reports",
    desc: "Create sales & inventory reports anytime. Teams can access in real-time.",
    badge: "Reports",
  },
];

const Card = ({ f, i }) => (
  <div
    key={i}
    className="rounded-2xl border border-gray-200 p-6 shadow-sm hover:shadow-lg transition bg-white"
  >
    <div className="inline-flex items-center gap-2 text-xs font-semibold px-2 py-1 rounded bg-[#E8FFF3] text-[#138A4E]">
      {f.badge}
    </div>
    <h3 className="mt-4 font-bold text-lg text-[#0B1C10]">{f.title}</h3>
    <p className="mt-2 text-sm text-gray-600">{f.desc}</p>

    <div className="mt-6 h-36 rounded-xl bg-gray-100 grid place-items-center text-gray-400 text-sm">
      illustration
    </div>
  </div>
);

const FeaturesThree = () => {
  return (
    <section className="bg-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-14">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-[#0B1C10]">
          Manage Your Offline Business With <span className="text-[#138A4E]">Zentory</span> Application
        </h2>

        <div className="grid md:grid-cols-3 gap-6 mt-8">
          {features.map((f, i) => (
            <Card key={i} f={f} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesThree;
