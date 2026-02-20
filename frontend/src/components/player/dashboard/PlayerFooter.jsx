import React from "react";
import {
  Twitter,
  Instagram,
  Facebook,
  ShieldCheck,
  AlertOctagon,
  Mail,
} from "lucide-react";

const PlayerFooter = ({ onContactClick }) => {
  // Helper to scroll to ID
  const scrollToSection = (e, id) => {
    e.preventDefault();
    const element = document.getElementById(id);
    if (element) {
      // Adjust offset for fixed header (approx 100px)
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition =
        elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });
    }
  };

  return (
    <footer className="mt-20 border-t border-white/10 bg-[#040029] relative z-10 text-center">
      <div className="max-w-[1400px] mx-auto px-6 py-12 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-6">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1 flex flex-col items-center">
            <h2 className="text-2xl font-display text-yellow-500 tracking-wider mb-4">
              ROYAL
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6 max-w-xs mx-auto">
              The premier destination for high-stakes gaming and weekly
              jackpots. Experience the thrill of provably fair crypto gaming.
            </p>
            {/* Centered Social Icons */}
            <div className="flex gap-4 justify-center">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Platform Column */}
          <div className="flex flex-col items-center">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              Platform
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 flex flex-col items-center">
              <li>
                <button
                  onClick={(e) => scrollToSection(e, "games-grid")}
                  className="hover:text-yellow-500 transition-colors"
                >
                  Arcade Games
                </button>
              </li>
              <li>
                <button
                  onClick={(e) => scrollToSection(e, "jackpots-grid")}
                  className="hover:text-yellow-500 transition-colors"
                >
                  Live Jackpots
                </button>
              </li>
            </ul>
          </div>

          {/* Support Column */}
          <div className="flex flex-col items-center">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              Support
            </h3>
            <ul className="space-y-3 text-sm text-gray-400 flex flex-col items-center">
              <li>
                <button
                  onClick={onContactClick}
                  className="hover:text-yellow-500 transition-colors"
                >
                  Help Center
                </button>
              </li>
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  Terms of Service
                </span>
              </li>
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="hover:text-yellow-500 transition-colors cursor-pointer">
                  Responsible Gaming
                </span>
              </li>
            </ul>
          </div>

          {/* Security Column */}
          <div className="flex flex-col items-center">
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              Security
            </h3>
            <div className="flex flex-col gap-4 items-center">
              <div className="flex items-center gap-3 text-sm text-gray-400 justify-center">
                {/* <ShieldCheck className="text-green-500" size={20} /> */}
                <span>KYC check</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400 justify-center">
                {/* <AlertOctagon className="text-red-500" size={20} /> */}
                <span>18+ Play Responsibly</span>
              </div>

              <button
                onClick={onContactClick}
                className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-500 hover:text-black border border-yellow-500/30 px-4 py-3 rounded hover:bg-yellow-500/90 transition-colors w-fit hover:cursor-pointer mx-auto"
              >
                <Mail size={16} /> Contact Support
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8">
          <p className="text-xs text-gray-600 w-full text-center">
            © 2026 Royal Casino. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default PlayerFooter;
