import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import LibraryGameCard from "./LibraryGameCard";
import {
  Settings,
  Gamepad2,
  Plus,
  PauseCircle,
  PlayCircle,
} from "lucide-react";

const GameManagementTab = () => {
  const [library, setLibrary] = useState([]);
  const [myGames, setMyGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [libRes, myRes] = await Promise.all([
        api.get("/tenant-admin/games/library"),
        api.get("/tenant-admin/games/my-games"),
      ]);
      setLibrary(libRes.data);
      setMyGames(myRes.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load games");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (gameId, min, max) => {
    try {
      await api.post("/tenant-admin/games/add", {
        platform_game_id: gameId,
        min_bet: parseFloat(min),
        max_bet: parseFloat(max),
        custom_name: "",
      });
      toast.success("Game Added Successfully!");
      fetchData();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.detail || "Error adding game");
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (parseFloat(editForm.min) < 0 || parseFloat(editForm.max) < 0)
      return toast.error("Limits cannot be negative.");

    try {
      await api.put("/tenant-admin/games/update", {
        tenant_game_id: editForm.id,
        min_bet: parseFloat(editForm.min),
        max_bet: parseFloat(editForm.max),
        is_active: editForm.active,
      });
      toast.success("Settings Updated");
      setEditForm(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Update failed");
    }
  };

  // Remove already installed games
  const installedGameIds = new Set(myGames.map((g) => g.platform_game_id));
  const availableGames = library.filter(
    (game) => !installedGameIds.has(game.platform_game_id),
  );

  if (loading)
    return (
      <div className="text-casino-gold animate-pulse p-8">
        Loading Game Library...
      </div>
    );

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
      {/*LIVE GAMES */}
      <div>
        <h2 className="text-xl font-display text-casino-gold mb-6 flex items-center gap-2">
          <Gamepad2 /> My Live Games ({myGames.length})
        </h2>
        <div className="space-y-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
          {myGames.length === 0 && (
            <div className="p-8 border border-dashed border-white/20 rounded-xl text-center text-gray-500 bg-white/5">
              No games active. Add some from the library!
            </div>
          )}
          {myGames.map((game) => (
            <div
              key={game.tenant_game_id}
              className={`p-4 rounded-xl flex items-center gap-4 transition-all border ${
                game.is_active
                  ? "bg-gradient-to-r from-white/5 to-transparent border-white/10 hover:border-casino-gold"
                  : "bg-red-900/10 border-red-900/30 opacity-75"
              }`}
            >
              <img
                src={game.default_thumbnail_url}
                className="w-20 h-20 rounded-lg object-cover shadow-lg bg-black"
                alt={game.game_name}
              />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  <h3 className="font-bold text-white text-lg truncate px-2">
                    {game.title}
                  </h3>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs bg-black/50 px-2 py-0.5 rounded text-gray-400 font-mono">
                    {game.game_type}
                  </span>
                  <span className="text-xs text-casino-gold font-mono">
                    ${game.min_bet} - ${game.max_bet}
                  </span>
                </div>
              </div>

              <div className="flex flex-col  items-end gap-2 ">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    game.is_active
                      ? "bg-green-500/20 text-green-400 border border-green-500/20"
                      : "bg-red-500/20 text-red-400 border border-red-500/20"
                  }`}
                >
                  {game.is_active ? "Active" : "Disabled"}
                </span>
                <button
                  onClick={() =>
                    setEditForm({
                      id: game.tenant_game_id,
                      min: game.min_bet,
                      max: game.max_bet,
                      active: game.is_active,
                      title: game.game_name || game.custom_name,
                    })
                  }
                  className="p-2 rounded bg-transparent  text-gray-400 hover:text-white transition-colors hover:cursor-pointer"
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* library */}
      <div>
        <h2 className="text-xl font-display text-white mb-6 flex items-center gap-2">
          <Plus /> Game Library ({availableGames.length})
        </h2>

        {availableGames.length === 0 ? (
          <div className="p-12 border border-dashed border-white/10 rounded-xl text-center">
            <p className="text-gray-500 text-lg">
              All available games are installed!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[800px] overflow-y-auto pr-2 custom-scrollbar">
            {availableGames.map((game) => (
              <LibraryGameCard
                key={game.platform_game_id}
                game={game}
                onAdd={handleAdd}
              />
            ))}
          </div>
        )}
      </div>

      {/* EDIT MODAL */}
      {editForm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div
            className="absolute inset-0"
            onClick={() => setEditForm(null)}
          ></div>
          <form
            onSubmit={handleUpdate}
            className="relative bg-[#040029] p-8 rounded-2xl border border-casino-gold w-full max-w-sm shadow-2xl animate-in zoom-in duration-200"
          >
            <h3 className="text-xl font-bold text-casino-gold mb-1 flex items-center gap-2">
              <Settings size={20} /> Edit Game
            </h3>
            <p className="text-gray-500 text-sm mb-6 truncate font-medium">
              {editForm.title}
            </p>

            <div className="space-y-5 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">
                    Min Bet
                  </label>
                  <InputField
                    type="number"
                    min="0"
                    step="0.1"
                    value={editForm.min}
                    onChange={(e) =>
                      setEditForm({ ...editForm, min: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">
                    Max Bet
                  </label>
                  <InputField
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.max}
                    onChange={(e) =>
                      setEditForm({ ...editForm, max: e.target.value })
                    }
                  />
                </div>
              </div>

              <div
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  editForm.active
                    ? "bg-green-400/10 border-green-500/30 hover:bg-green-500/20"
                    : "bg-red-400/10 border-red-500/30 hover:bg-red-500/20"
                }`}
                onClick={() =>
                  setEditForm({ ...editForm, active: !editForm.active })
                }
              >
                <div className="flex items-center gap-3">
                  {editForm.active ? (
                    <PlayCircle className="text-green-400" />
                  ) : (
                    <PauseCircle className="text-red-400" />
                  )}
                  <span
                    className={`font-bold ${editForm.active ? "text-green-400" : "text-red-400"}`}
                  >
                    {editForm.active ? "Game Active" : "Game Disabled"}
                  </span>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${editForm.active ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-red-500"}`}
                ></div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditForm(null)}
                className="flex-1 py-3 bg-black/40 text-gray-400 rounded-lg hover:bg-white/10 font-bold transition-colors border border-white/20 hover:cursor-pointer"
              >
                Cancel
              </button>
              <GoldButton type="submit" className="flex-1">
                Save
              </GoldButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default GameManagementTab;
