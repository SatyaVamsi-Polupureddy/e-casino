import React from "react";
import { Volume2, VolumeX, Zap, Trophy, RotateCcw } from "lucide-react";
import GameResultDisplay from "./GameResultDisplay";

const GameCanvas = ({
  game,
  spinning,
  result,
  videoRef,
  videoUrl,
  backgroundUrl,
  muted,
  setMuted,
  setResult,
}) => {
  return (
    <div className="flex-1 relative flex items-center justify-center bg-[#040029] overflow-hidden group">
      <div
        className={`absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-black to-black transition-opacity duration-1000 ${
          spinning ? "opacity-50" : "opacity-20"
        }`}
      ></div>

      <div className="absolute inset-4 md:inset-8 flex items-center justify-center">
        <div className="relative w-full h-full max-w-5xl max-h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-[#040029]">
          {/* Dynamic Assets */}
          {spinning ? (
            <video
              ref={videoRef}
              key={videoUrl}
              src={videoUrl}
              className="w-full h-full object-cover"
              muted={muted}
              loop
              autoPlay
              playsInline
            />
          ) : (
            <img
              src={backgroundUrl}
              className="w-full h-full object-contain opacity-50 transition-opacity duration-1000"
              alt="Game Background"
            />
          )}

          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>

          <button
            onClick={() => setMuted(!muted)}
            className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
          >
            {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>

          {/* Title Overlay (Idle) */}
          {!spinning && !result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-500">
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl mb-2 text-center px-4">
                {game?.game_name || game?.title}
              </h1>
              <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-900/20 text-yellow-400 text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-md">
                <Zap size={10} fill="currentColor" /> {game?.game_type}
              </div>
            </div>
          )}

          {/* RESULT OVERLAY */}
          {!spinning && result && (
            <div className="absolute inset-0 z-30 flex flex-col pt-2 items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
              <GameResultDisplay
                type={game?.game_type}
                data={result.game_data}
              />
              {result.outcome === "WIN" ? (
                <>
                  <Trophy
                    size={60}
                    className="text-yellow-400 mt-2 animate-bounce drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]"
                  />
                  <div className="text-6xl px-4 font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 italic tracking-tighter drop-shadow-2xl">
                    BIG WIN
                  </div>
                  <div className="text-3xl font-mono text-green-400 font-bold mt-2 text-shadow-glow">
                    +${(result.win_amount || 0).toFixed(2)}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-5xl font-black text-gray-600 mb-2">
                    TRY AGAIN
                  </div>
                  <div className="text-lg text-gray-500 font-medium">
                    Better luck next time
                  </div>
                </>
              )}
              <button
                onClick={() => setResult(null)}
                className="my-4 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-bold text-sm uppercase tracking-widest transition-all hover:scale-105"
              >
                <span className="flex items-center gap-2">
                  <RotateCcw size={14} /> Continue
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GameCanvas;
