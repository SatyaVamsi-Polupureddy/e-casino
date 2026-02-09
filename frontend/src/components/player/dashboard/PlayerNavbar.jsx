import React from "react";
import { Bell, User } from "lucide-react";

const PlayerNavbar = ({ profile, activeOtp, openSidebar }) => {
  const balance = (profile?.balance || 0) + (profile?.bonus_balance || 0);

  return (
    <nav className="fixed top-0 w-full z-40 bg-[#050124] backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-2xl font-display font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-500 [text-shadow:_0_0_10px_rgb(168_85_247_/_80%),_0_0_25px_rgb(6_182_212_/_50%)]">
          CASINO
        </span>
      </div>
      <div className="flex items-center gap-6">
        <div className="text-right hidden md:block">
          <div className="text-xs text-gray-400 font-bold uppercase">
            Total Funds
          </div>
          <div className="text-lg font-bold text-yellow-500 font-mono">
            ${balance.toFixed(2)}
          </div>
        </div>
        <button
          onClick={() => openSidebar("notifications")}
          className={`relative p-2 rounded-full border border-white/20 hover:border-yellow-400 transition-all ${
            activeOtp
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
              : "bg-white/5 border-transparent text-gray-400 hover:text-white "
          }`}
        >
          <Bell size={16} className={activeOtp ? "animate-swing" : ""} />
          {activeOtp && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
        <div
          onClick={() => openSidebar("menu")}
          className="w-9 h-9 rounded-full bg-[#040029] to-black border border-white/20 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-yellow-400 transition-colors shadow-lg"
        >
          <User size={16} />
        </div>
      </div>
    </nav>
  );
};

export default PlayerNavbar;
