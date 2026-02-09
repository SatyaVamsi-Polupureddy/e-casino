import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GoldButton from "../ui/GoldButton";
import InputField from "../ui/InputField";
import adminService from "../../services/adminService";
import { Gamepad2 } from "lucide-react";

const PlatformGamesTab = () => {
  const [games, setGames] = useState([]);
  const [form, setForm] = useState({
    title: "",
    game_type: "SLOT",
    default_thumbnail_url: "",
    video_url: "",
    provider: "",
  });

  useEffect(() => {
    fetchGames();
  }, []);
  const fetchGames = () =>
    adminService
      .getPlatformGames()
      .then((res) =>
        setGames(
          res.data.sort((a, b) =>
            a.is_active === b.is_active ? 0 : a.is_active ? -1 : 1,
          ),
        ),
      )
      .catch(console.error);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.addPlatformGame(form);
      toast.success("Game Added");
      fetchGames();
      setForm({
        title: "",
        game_type: "SLOT",
        default_thumbnail_url: "",
        video_url: "",
        provider: "",
      });
    } catch (e) {
      toast.error("Error");
    }
  };

  const toggleStatus = async (id, status) => {
    try {
      await adminService.togglePlatformGame(id, !status);
      toast.success("Status Updated");
      fetchGames();
    } catch (e) {
      toast.error("Error");
    }
  };

  return (
    <div className="max-w-6xl mx-auto mt-4">
      <div className="bg-[#040029] p-6 rounded border border-yellow-500/30 mb-8">
        <h2 className="text-2xl font-display text-yellow-500 mb-4 flex items-center gap-2">
          <Gamepad2 /> Add Platform Game
        </h2>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-white"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select
              className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-gray-300"
              value={form.game_type}
              onChange={(e) => setForm({ ...form, game_type: e.target.value })}
            >
              <option value="SLOT" className="bg-[#040029]">
                SLOT
              </option>
              <option value="TABLE" className="bg-[#040029]">
                TABLE
              </option>
              <option value="LIVE" className="bg-[#040029]">
                LIVE
              </option>
              <option value="CRASH" className="bg-[#040029]">
                CRASH
              </option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <InputField
              // className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="Thumbnail URL"
              value={form.default_thumbnail_url}
              onChange={(e) =>
                setForm({ ...form, default_thumbnail_url: e.target.value })
              }
              required
            />
            <InputField
              // className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="Provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            />
          </div>
          <InputField
            // className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
            placeholder="Video URL (Optional)"
            value={form.video_url}
            onChange={(e) => setForm({ ...form, video_url: e.target.value })}
          />
          <GoldButton fullWidth type="submit">
            Add to Library
          </GoldButton>
        </form>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {games.map((g) => (
          <div
            key={g.platform_game_id}
            className={`p-4 rounded-xl border flex gap-4 ${g.is_active ? "bg-[#040029] border-white/10 hover:border-yellow-500" : "bg-black/40 border-red-900/30 opacity-60"}`}
          >
            <img
              src={g.default_thumbnail_url || ""}
              alt=""
              className="w-20 h-20 rounded bg-black object-cover"
            />
            <div className="flex-1">
              <h4 className="font-bold text-white">{g.title}</h4>
              <span className="text-[10px] bg-white/10 px-2 rounded text-gray-300">
                {g.game_type}
              </span>
              <div className="mt-2">
                <button
                  onClick={() => toggleStatus(g.platform_game_id, g.is_active)}
                  className={`text-xs hover:cursor-pointer px-3 py-1 rounded font-bold ${g.is_active ? "text-green-400 bg-green-900/20" : "text-red-400 bg-red-900/20"}`}
                >
                  {g.is_active ? "Active" : "Inactive"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PlatformGamesTab;
