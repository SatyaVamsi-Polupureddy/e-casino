import { useState } from "react";
import toast from "react-hot-toast";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";

const LibraryGameCard = ({ game, onAdd }) => {
  const [min, setMin] = useState(game.game_type === "SLOT" ? 0.1 : 1);
  const [max, setMax] = useState(100);

  const handleAddClick = () => {
    if (parseFloat(min) < 0 || parseFloat(max) < 0) {
      toast.error("Limits cannot be negative");
      return;
    }
    onAdd(game.platform_game_id, min, max);
  };

  return (
    <div className="bg-[#040029] border border-white/20 p-4 rounded-xl group hover:border-casino-gold transition-all flex flex-col h-full">
      <div className="relative aspect-video mb-3 overflow-hidden rounded-lg bg-[#111]">
        <img
          src={game.default_thumbnail_url}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80 group-hover:opacity-100"
          alt={game.title}
        />
        <div className="absolute top-2 right-2  bg-black/70 px-2 py-1 rounded text-[10px] font-bold uppercase backdrop-blur-md border border-white/10">
          {game.game_type}
        </div>
      </div>

      {/* Game Name */}
      <div className="flex-1">
        <h3 className="font-bold text-white mb-3 text-lg leading-tight">
          {game.title}
        </h3>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold">
              Min ($)
            </label>
            <InputField
              type="number"
              min="0"
              step="0.1"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold">
              Max ($)
            </label>
            <InputField
              type="number"
              min="0"
              step="1"
              value={max}
              onChange={(e) => setMax(e.target.value)}
            />
          </div>
        </div>
      </div>

      <GoldButton fullWidth onClick={handleAddClick}>
        Add to Site
      </GoldButton>
    </div>
  );
};

export default LibraryGameCard;
