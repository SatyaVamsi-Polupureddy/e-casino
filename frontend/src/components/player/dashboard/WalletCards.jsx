import React from "react";
import { CreditCard, DollarSign, Gift } from "lucide-react";

const WalletCards = ({ profile, openSidebar }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Real Balance */}
      <div
        className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-all cursor-pointer"
        onClick={() => openSidebar("deposit")}
      >
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
          <DollarSign size={80} />
        </div>
        <div className="relative z-10">
          <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <CreditCard size={14} /> Real Balance
          </div>
          <div className="text-4xl font-mono font-bold text-white shadow-glow">
            ${profile?.balance?.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Bonus Balance */}
      <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
          <Gift size={80} />
        </div>
        <div className="relative z-10">
          <div className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
            <Gift size={14} /> Bonus Credits
          </div>
          <div className="text-4xl font-mono font-bold text-white">
            ${profile?.bonus_balance?.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletCards;
