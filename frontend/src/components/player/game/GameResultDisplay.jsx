import React from "react";

const GameResultDisplay = ({ type, data }) => {
  if (!data) return null;

  if (type === "SLOT") {
    const symbols = data.symbols || ["❓", "❓", "❓"];
    return (
      <div className="flex gap-2 mb-6 bg-black/60 p-4 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] animate-in zoom-in">
        {symbols.map((s, i) => (
          <div
            key={i}
            className="w-16 h-16 md:w-24 md:h-24 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-4xl md:text-6xl border border-white/10"
          >
            {s}
          </div>
        ))}
      </div>
    );
  }

  if (type === "COIN") {
    const val = data.flip || "HEADS";
    const isHeads = val === "HEADS";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center border-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-4 ${isHeads ? "border-yellow-400 bg-yellow-500/20" : "border-gray-400 bg-gray-500/20"}`}
        >
          <span
            className={`text-5xl font-black ${isHeads ? "text-yellow-400" : "text-gray-300"}`}
          >
            {isHeads ? "H" : "T"}
          </span>
        </div>
      </div>
    );
  }

  if (type === "DICE") {
    const val = data.roll || "?";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div className="w-32 h-32 bg-white text-black rounded-2xl border-4 border-gray-300 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.4)] mb-4 transform rotate-6">
          <span className="text-8xl font-black">{val}</span>
        </div>
      </div>
    );
  }

  if (type === "WHEEL") {
    const val = data.segment || "?";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div className="w-32 h-32 rounded-full border-4 border-cyan-500 bg-black flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)] mb-4">
          <span className="text-6xl font-black text-cyan-400">{val}</span>
        </div>
      </div>
    );
  }

  if (type === "HIGHLOW") {
    const val = data.card || "?";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div className="w-28 h-40 bg-white text-black rounded-xl border-4 border-gray-200 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] mb-4 relative">
          <span className="absolute top-2 left-2 text-2xl font-bold">
            {val}
          </span>
          <span className="text-7xl font-black">{val}</span>
          <span className="absolute bottom-2 right-2 text-2xl font-bold transform rotate-180">
            {val}
          </span>
        </div>
      </div>
    );
  }

  return null;
};

export default GameResultDisplay;
