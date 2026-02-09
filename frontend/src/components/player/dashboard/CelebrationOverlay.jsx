import React from "react";
import Confetti from "react-confetti";

const CelebrationOverlay = ({ show, windowSize, latestWinner }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <Confetti
        width={windowSize.width}
        height={windowSize.height}
        numberOfPieces={400}
        recycle={false}
      />
      <div className="text-center animate-bounce bg-black/50 p-8 rounded-3xl backdrop-blur-sm border border-yellow-500/50">
        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]">
          YOU WON!
        </h1>
        <p className="text-2xl text-white font-bold mt-4 shadow-black drop-shadow-md">
          The Jackpot is Yours!
        </p>
        <p className="text-yellow-400 font-mono mt-2 text-xl">
          +${latestWinner?.total_pool_amount}
        </p>
      </div>
    </div>
  );
};

export default CelebrationOverlay;
