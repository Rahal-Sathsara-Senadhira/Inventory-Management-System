import React from "react";
import HomeNavbar from "../../../components/HomeNavbar";
import HeroSection from "./HeroSection";
import StatsStrip from "./StatsStrip";
import GrowthSection from "./GrowthSection";
import FeaturesThree from "./FeaturesThree";
import Pricing from "./Pricing";
import Footer from "./Footer";
import ShowcaseSection from "./ShowcaseSection";
import NewsletterStrip from "./NewsletterStrip";

const Home = () => {
  return (
    <div className="bg-white overflow-x-hidden">
      <HomeNavbar />
      {/* Hero */}
      <div className="pt-16 bg-[#0B1C10] inset-0 bg-gradient-to-r ">
        <HeroSection />
      </div>

      {/* Stats */}
      <StatsStrip />

      {/* Full Service Growth */}
      <GrowthSection />

      {/* 3 feature cards */}
      <FeaturesThree />

      {/* Pricing */}
      <Pricing />

      <ShowcaseSection />
      <NewsletterStrip />

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
