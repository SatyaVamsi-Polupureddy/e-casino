import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import { DollarSign, Trophy, Award } from "lucide-react";

const JackpotManagementTab = () => {
  const [jackpots, setJackpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    entry_fee: "",
    event_date: "",
    currency_code: "USD",
  });

  // Calculate Today's Date in YYYY-MM-DD format (Local Timezone)
  const today = new Date().toLocaleDateString("en-CA");

  useEffect(() => {
    fetchJackpots();
  }, []);

  const fetchJackpots = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenant-admin/jackpot/list");
      const sorted = res.data.sort((a, b) => {
        if (a.status === "OPEN" && b.status !== "OPEN") return -1;
        if (a.status !== "OPEN" && b.status === "OPEN") return 1;
        return new Date(a.game_date) - new Date(b.game_date);
      });

      setJackpots(sorted);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.entry_fee || !form.event_date)
      return toast.error("Fill all fields");
    try {
      await api.post("/tenant-admin/jackpot/create", form);
      toast.success("Jackpot Created!");
      setForm({ entry_fee: "", event_date: "", currency_code: "USD" });
      fetchJackpots();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const handleDrawWinner = async (eventId) => {
    if (
      !confirm("Are you sure? This will close the jackpot and pick a winner.")
    )
      return;
    try {
      const res = await api.post(`/tenant-admin/jackpot/draw/${eventId}`);
      toast.success(
        `Winner: Player ${res.data.winner_id} won $${res.data.amount}!`,
      );
      fetchJackpots();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed to draw winner");
    }
  };

  return (
    <div className="p-4 md:p-8">
      <h2 className="text-3xl font-display text-white mb-6">
        Jackpot Management
      </h2>

      {/* 1. CREATE */}
      <div className="bg-[#040029] p-6 rounded-xl border border-white/20 mb-10">
        <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <Trophy size={20} /> Schedule New Jackpot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Draw Date
            </label>

            <input
              type="date"
              min={today}
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 transition-colors"
              value={form.event_date}
              onKeyDown={(e) => e.preventDefault()} // Disable typing
              onClick={(e) => e.target.showPicker && e.target.showPicker()} // Open calendar on click
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Entry Fee ($)
            </label>
            <InputField
              type="number"
              value={form.entry_fee}
              onChange={(e) => setForm({ ...form, entry_fee: e.target.value })}
            />
          </div>
          <GoldButton onClick={handleCreate} className="mb-5 py-3 self-end">
            Schedule Event
          </GoldButton>
        </div>
      </div>

      {/* JACKPOTS LIST */}
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading events...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {jackpots.map((j) => (
            <div
              key={j.jackpot_event_id}
              className={`bg-black/40 border p-6 rounded-xl relative flex flex-col justify-between ${
                j.status === "OPEN"
                  ? "border-white/10 hover:border-yellow-500/50"
                  : "border-gray-800 bg-black/50 opacity-60 grayscale"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span
                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                      j.status === "OPEN"
                        ? "bg-green-500/20 text-green-400 animate-pulse"
                        : "bg-gray-700 text-gray-400"
                    }`}
                  >
                    {j.status}
                  </span>
                  <span className="text-xs text-gray-500 font-mono">
                    {new Date(j.game_date).toLocaleDateString()}
                  </span>
                </div>
                <h4 className="text-3xl font-mono font-bold text-white mb-2 text-shadow-glow">
                  ${j.total_pool_amount}
                </h4>
                <div className="flex items-center gap-4 text-xs text-gray-400 mb-6">
                  <span className="flex items-center gap-1">
                    <DollarSign size={12} /> Entry: ${j.entry_amount}
                  </span>
                </div>
              </div>

              {j.status === "OPEN" ? (
                <GoldButton
                  onClick={() => handleDrawWinner(j.jackpot_event_id)}
                  className="flex items-center justify-center gap-2"
                >
                  <Award size={16} />
                  Draw Winner Now
                </GoldButton>
              ) : (
                <div className="w-full py-3 bg-white/5 text-gray-500 font-bold rounded text-center border border-white/5 uppercase text-xs">
                  Winner Declared
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default JackpotManagementTab;
