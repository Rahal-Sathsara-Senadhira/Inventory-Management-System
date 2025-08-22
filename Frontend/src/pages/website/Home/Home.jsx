import React from "react";
import HomeNavbar from "../../../components/HomeNavbar";
import HeroSection from "./HeroSection";
import StatsStrip from "./StatsStrip";
import GrowthSection from "./GrowthSection";
import FeaturesThree from "./FeaturesThree";
import Pricing from "./Pricing";
import Footer from "./Footer";

const Home = () => {
  return (
    <div className="bg-white">
      <HomeNavbar />
      {/* Hero */}
      <div className="pt-20">
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

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;
