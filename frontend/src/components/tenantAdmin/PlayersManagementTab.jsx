import { useState, useEffect } from "react";
import tenantService from "../../services/tenantService";
import toast from "react-hot-toast";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import { Users, SearchIcon } from "lucide-react";
const PlayersManagementTab = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingLimit, setEditingLimit] = useState(null);

  useEffect(() => {
    fetchAllPlayers();
  }, []);
  useEffect(() => {
    if (!search) setFilteredPlayers(players);
    else
      setFilteredPlayers(
        players.filter(
          (p) =>
            p.email.toLowerCase().includes(search.toLowerCase()) ||
            p.username.toLowerCase().includes(search.toLowerCase()),
        ),
      );
  }, [search, players]);

  const fetchAllPlayers = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getAllPlayers();
      setPlayers(res.data);
      setFilteredPlayers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (email, newStatus) => {
    try {
      await tenantService.updatePlayerStatus(email, newStatus);
      toast.success(`Player ${newStatus}`);
      fetchAllPlayers();
    } catch (e) {
      toast.error("Failed");
    }
  };

  const handleUpdateLimits = async (e) => {
    e.preventDefault();
    try {
      await tenantService.updatePlayerLimitsByEmail(editingLimit.email, {
        daily_bet_limit: parseFloat(editingLimit.daily_bet_limit),
        daily_loss_limit: parseFloat(editingLimit.daily_loss_limit),
        max_single_bet: parseFloat(editingLimit.max_single_bet),
      });
      toast.success("Limits Updated");
      setEditingLimit(null);
      fetchAllPlayers();
    } catch (e) {
      toast.error("Failed");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-3xl font-display text-white flex items-center gap-2">
          <Users className="text-yellow-500" /> Player Management
        </h2>
        {/* SEARCH BAR */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by Email..."
            className="bg-black/40 border border-white/20 p-2 pl-8 rounded text-white text-sm focus:border-yellow-500/60 outline-none w-64"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="absolute left-2 top-2.5 text-gray-400">
            <SearchIcon size={14} />
          </div>
        </div>
      </div>
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Player</th>
              <th className="p-4">KYC</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-center">Limits</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredPlayers.map((p) => (
                <tr
                  key={p.player_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-white">{p.username}</div>
                    <div className="text-xs text-gray-500">{p.email}</div>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        p.kyc_status === "APPROVED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {p.kyc_status}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        p.status === "ACTIVE"
                          ? "bg-blue-500/20 text-blue-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setEditingLimit(p)}
                      className="text-xs text-gray-300 border border-white/20 hover:text-yellow-400 hover:border-yellow-500/60 px-2 py-1 rounded hover:cursor-pointer"
                    >
                      Edit Limits
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {p.status !== "ACTIVE" ? (
                        <button
                          onClick={() => handleUpdateStatus(p.email, "ACTIVE")}
                          className="text-green-400 hover:bg-green-500/10 p-1 rounded font-bold text-xs hover:cursor-pointer"
                        >
                          ACTIVATE
                        </button>
                      ) : (
                        <button
                          onClick={() =>
                            handleUpdateStatus(p.email, "SUSPENDED")
                          }
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded font-bold text-xs hover:cursor-pointer"
                        >
                          SUSPEND
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* LIMITS */}
      {editingLimit && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-md animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">
              Edit Player: {editingLimit.username}
            </h3>
            <form onSubmit={handleUpdateLimits} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Daily Bet Limit
                </label>
                <InputField
                  type="number"
                  value={editingLimit.daily_bet_limit}
                  onChange={(e) =>
                    setEditingLimit({
                      ...editingLimit,
                      daily_bet_limit: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Daily Loss Limit
                </label>
                <InputField
                  type="number"
                  value={editingLimit.daily_loss_limit}
                  onChange={(e) =>
                    setEditingLimit({
                      ...editingLimit,
                      daily_loss_limit: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Max Single Bet
                </label>
                <InputField
                  type="number"
                  value={editingLimit.max_single_bet}
                  onChange={(e) =>
                    setEditingLimit({
                      ...editingLimit,
                      max_single_bet: e.target.value,
                    })
                  }
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingLimit(null)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg font-bold text-gray-300"
                >
                  Cancel
                </button>
                <GoldButton type="submit" className="flex-1">
                  Save Changes
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayersManagementTab;
