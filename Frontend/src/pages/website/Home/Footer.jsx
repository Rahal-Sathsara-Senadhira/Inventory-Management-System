import React from "react";

const Footer = () => {
  return (
    <footer className="bg-[#0B1C10] text-white">
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div>
            <div className="text-lg font-bold">Zentory</div>
            <p className="mt-3 text-sm text-white/70">
              Whatever your business, experience how easy it is to manage purchases and sales.
            </p>
          </div>

          <div>
            <h4 className="font-semibold">Menu</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Cooperation With Zentory</li>
              <li>Privacy Policy</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">About Us</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>About Zentory</li>
              <li>Our Team</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold">Support</h4>
            <ul className="mt-3 space-y-2 text-sm text-white/70">
              <li>Help</li>
              <li>Tutorial Video</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-xs text-white/60">
          Copyright © {new Date().getFullYear()} Rafil Solutions. All rights reserved
        </div>
      </div>
    </footer>
  );
};

export default Footer;
