import React from "react";

const GameControls = ({
  game,
  prediction,
  setPrediction,
  bet,
  setBet,
  spinning,
  handlePlay,
}) => {
  return (
    <div className="bg-[#040029] border-t border-white/10 p-4 shrink-0 relative z-30">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-4 lg:gap-8 justify-between">
        <div className="flex-1 flex gap-4 items-end w-full md:w-auto">
          {/* Prediction Input */}
          <div className="flex-1 max-w-[200px]">
            <label className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest mb-1 block">
              Prediction / Mode
            </label>

            {game?.game_type === "HIGHLOW" && (
              <div className="flex rounded-lg bg-[#040029] p-1 border border-white/20 h-12">
                <button
                  onClick={() => setPrediction("HIGH")}
                  className={`flex-1 rounded font-bold text-xs transition-all ${
                    prediction === "HIGH"
                      ? "bg-green-500/20 text-green-400 shadow-inner"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  HIGH
                </button>
                <button
                  onClick={() => setPrediction("LOW")}
                  className={`flex-1 rounded font-bold text-xs transition-all ${
                    prediction === "LOW"
                      ? "bg-red-500/20 text-red-400 shadow-inner"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  LOW
                </button>
              </div>
            )}
            {game?.game_type === "COIN" && (
              <div className="flex rounded-lg bg-[#040029] p-1 border border-white/20 h-12">
                <button
                  onClick={() => setPrediction("HEADS")}
                  className={`flex-1 rounded font-bold text-xs transition-all ${
                    prediction === "HEADS"
                      ? "bg-yellow-500/20 text-yellow-400"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  HEADS
                </button>
                <button
                  onClick={() => setPrediction("TAILS")}
                  className={`flex-1 rounded font-bold text-xs transition-all ${
                    prediction === "TAILS"
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-500 hover:text-white"
                  }`}
                >
                  TAILS
                </button>
              </div>
            )}
            {(game?.game_type === "DICE" || game?.game_type === "WHEEL") && (
              <div className="relative h-12">
                <select
                  className="w-full h-full bg-[#040029] border border-white/20 text-white font-mono text-sm px-3 rounded-lg outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
                  value={prediction}
                  onChange={(e) => setPrediction(e.target.value)}
                >
                  {Array.from(
                    { length: game?.game_type === "DICE" ? 6 : 20 },
                    (_, i) => i + 1,
                  ).map((num) => (
                    <option key={num} value={num}>
                      Number {num}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {(!game?.game_type || game?.game_type === "SLOT") && (
              <div className="h-12 bg-[#040029] border border-white/20 rounded-lg flex items-center justify-center text-gray-500 text-xs font-bold uppercase">
                Auto-Match
              </div>
            )}
          </div>

          {/* Bet Input */}
          <div className="flex-1 max-w-[150px]">
            <label className="text-[9px] text-purple-500 font-bold uppercase tracking-widest mb-1 flex justify-between">
              <span>Wager</span>
              <span className="text-gray-600">Max ${game?.max_bet}</span>
            </label>
            <div className="relative h-12">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-bold">
                $
              </span>
              <input
                type="number"
                className="w-full h-full bg-[#040029] border border-white/30 pl-7 pr-3 rounded-lg text-white text-lg font-mono font-bold outline-none focus:border-purple-500/70 transition-all"
                placeholder="0"
                value={bet}
                onChange={(e) => setBet(e.target.value)}
              />
            </div>
          </div>
        </div>

        <button
          onClick={handlePlay}
          disabled={!bet || spinning}
          className="w-full md:w-auto h-16 px-10 bg-white text-black font-black text-xl tracking-[0.2em] rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none transition-all clip-path-polygon flex items-center justify-center"
          style={{
            clipPath:
              "polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%)",
          }}
        >
          {spinning ? (
            <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
          ) : (
            "PLAY"
          )}
        </button>
      </div>
    </div>
  );
};

export default GameControls;
