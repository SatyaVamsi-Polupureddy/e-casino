import React from "react";
import { Trophy, Lock, Calendar, DollarSign, Users } from "lucide-react";
import GoldButton from "../../ui/GoldButton";

const JackpotsSection = ({ jackpots, kycStatus, onEnter, openSidebar }) => {
  return (
    <div id="jackpots-grid" className="pb-10">
      <h2 className="text-2xl font-display text-white mb-6 flex items-center gap-2">
        <Trophy className="text-yellow-500" /> Active Jackpots
      </h2>
      {jackpots.length === 0 ? (
        <div className="text-center p-12 bg-white/5 rounded-xl border border-white/10">
          <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-400">
            No Active Jackpots
          </h3>
        </div>
      ) : (
        <div
          className={`grid gap-6 ${jackpots.length === 1 ? "max-w-2xl mx-auto w-full" : ""}`}
          style={{
            gridTemplateColumns:
              jackpots.length === 1
                ? "1fr"
                : "repeat(auto-fit, minmax(280px, 1fr))",
          }}
        >
          {jackpots.map((jackpot) => (
            <div
              key={jackpot.jackpot_event_id}
              className={`bg-[#040029] border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/70 transition-all flex flex-col justify-between h-[280px] ${
                kycStatus !== "APPROVED" ? "opacity-75 grayscale-[0.5]" : ""
              }`}
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all"></div>

              {/* KYC LOCK OVERLAY */}
              {kycStatus !== "APPROVED" && (
                <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-[#040029]/80 backdrop-blur-sm z-30">
                  <Lock className="text-red-500" size={32} />
                  <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                    KYC Required
                  </span>
                  <button
                    onClick={() => openSidebar("menu")}
                    className="mt-2 text-xs font-bold text-white underline hover:text-yellow-400 cursor-pointer z-40"
                  >
                    Verify Now
                  </button>
                </div>
              )}

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-yellow-900/20 border border-yellow-500/30 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    Live
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-gray-500 uppercase font-bold">
                      Prize Pool
                    </div>
                    <div className="text-2xl font-mono font-bold text-yellow-500 text-shadow-glow">
                      ${jackpot.total_pool_amount}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold">
                      <Calendar size={12} /> Draw
                    </span>
                    <span className="font-bold text-white">
                      {new Date(jackpot.game_date).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                    <span className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold">
                      <DollarSign size={12} /> Entry
                    </span>
                    <span className="font-bold text-white">
                      ${jackpot.entry_amount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm pb-2">
                    <span className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold">
                      <Users size={12} /> Players
                    </span>
                    <span className="font-bold text-white">
                      {jackpot.participant_count}
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative z-10 mt-4">
                <GoldButton fullWidth onClick={() => onEnter(jackpot)}>
                  Enter Jackpot
                </GoldButton>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JackpotsSection;
