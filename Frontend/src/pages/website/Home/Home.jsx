import React from "react";
import HomeNavbar from "../../../components/HomeNavbar";
import HeroSection from "./HeroSection";

const Home = () => {
  return (
    <div>
      <HomeNavbar />
      <div className="pt-20 bg-background-green">
        <HeroSection />
      </div>
    </div>
  );
};

export default Home;
