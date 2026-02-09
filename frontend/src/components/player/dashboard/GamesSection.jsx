import React from "react";
import { Gamepad2 } from "lucide-react";
import Game3DCarousel from "../Game3DCarousel";

const GamesSection = ({ games, profile, onPlay }) => {
  return (
    <div id="games-grid">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-display text-white flex items-center gap-2">
          <Gamepad2 className="text-yellow-500" /> Arcade Games
        </h2>
      </div>

      {games.length > 0 ? (
        <Game3DCarousel games={games} profile={profile} onPlay={onPlay} />
      ) : (
        <div className="text-center p-12 bg-white/5 rounded-xl border border-white/10">
          <Gamepad2 size={48} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-bold text-gray-400">No games found</h3>
        </div>
      )}
    </div>
  );
};

export default GamesSection;
