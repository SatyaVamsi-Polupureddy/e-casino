import React from "react";
import { ArrowLeft, Bell, User } from "lucide-react";

const GameHeader = ({
  onLeave,
  realBalance,
  bonusBalance,
  selectedWallet,
  setSelectedWallet,
  profileData,
  openSidebar,
}) => {
  return (
    <div className="h-14 px-4 flex items-center justify-between z-50 bg-[#040029] backdrop-blur-md border-b border-white/5 shrink-0">
      <button
        onClick={onLeave}
        className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all"
      >
        <div className="p-1.5 rounded-md bg-white/5 border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all">
          <ArrowLeft size={16} />
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-cyan-400">
          Lobby
        </span>
      </button>

      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-none mb-0.5">
            Active Wallet
          </div>
          <div className="relative">
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="bg-[#050124] border border-white/20 text-white text-xs font-bold py-1 px-2 rounded outline-none cursor-pointer hover:border-cyan-500 focus:border-yellow-500 transition-colors appearance-none pr-6"
            >
              <option value="REAL">REAL: ${realBalance.toFixed(2)}</option>
              <option value="BONUS">BONUS: ${bonusBalance.toFixed(2)}</option>
            </select>
          </div>
        </div>
        <button
          onClick={() => openSidebar("notifications")}
          className={`relative p-2 rounded-full border transition-all ${
            profileData?.active_otp
              ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
              : "bg-white/5 border-transparent text-gray-400 hover:text-white"
          }`}
        >
          <Bell
            size={16}
            className={profileData?.active_otp ? "animate-swing" : ""}
          />
          {profileData?.active_otp && (
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
          )}
        </button>
        <div
          onClick={() => openSidebar("menu")}
          className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/20 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-yellow-400 transition-colors shadow-lg"
        >
          <User size={16} />
        </div>
      </div>
    </div>
  );
};

export default GameHeader;
