import React from "react";

const Star = (props) => (
  <svg viewBox="0 0 20 20" fill="currentColor" {...props}>
    <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 15.7 4.7 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z"/>
  </svg>
);

const StatsStrip = () => {
  return (
    <section className="relative z-0 -mt-8 md:-mt-16 bg-[#7FC344] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-10 md:py-12">
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold">
          More Than 2000+ <br className="hidden sm:block" />
          Entrepreneurs Use Zentory
        </h2>
        <p className="mt-2 text-white/90 text-sm md:text-base">
          Boost revenue, gain insight that help you grow and scale faster
        </p>

        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-8 md:gap-10">
          {/* Rating */}
          <div>
            <div className="text-4xl sm:text-5xl md:text-6xl">4.8</div>
            <div className="flex items-center gap-1 mt-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-300" />
              ))}
            </div>
            <div className="text-sm mt-1 opacity-90">Reviews</div>
          </div>

          {/* Engagement */}
          <div>
            <div className="text-4xl sm:text-5xl md:text-6xl">89.9%</div>
            <div className="text-sm md:text-base font-semibold mt-2">Engagement Orders</div>
            <div className="text-sm mt-1 opacity-90">Loyalty Customers</div>
          </div>

          {/* Retailers */}
          <div>
            <div className="text-4xl sm:text-5xl md:text-6xl">2158</div>
            <div className="text-sm md:text-base font-semibold mt-2">Trusted Retailers</div>
            <div className="text-sm mt-1 opacity-90">Businesses Worldwide</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
