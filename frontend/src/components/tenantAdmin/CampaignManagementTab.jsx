import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import {
  Gift,
  Megaphone,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Save,
  X as XIcon,
  Calendar,
} from "lucide-react";

const CampaignManagementTab = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    name: "",
    bonus_amount: "",
    bonus_type: "WELCOME",
  });
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editValues, setEditValues] = useState({});

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenant-admin/bonus/campaigns");
      setCampaigns(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!form.name || !form.bonus_amount) return toast.error("Fill all fields");
    try {
      await api.post("/tenant-admin/bonus/campaigns", form);
      toast.success("Campaign Created!");
      setForm({ name: "", bonus_amount: "", bonus_type: "WELCOME" });
      fetchCampaigns();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const handleDistribute = async (id, amount) => {
    if (
      !confirm(
        `Launch Campaign? This will credit $${amount} to all players and DELETE (Archive) the campaign.`,
      )
    )
      return;
    try {
      const res = await api.post(
        `/tenant-admin/bonus/campaign/${id}/distribute-all`,
        { amount: parseFloat(amount) },
      );
      toast.success(res.data.message);
      fetchCampaigns();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };
  const startEdit = (c) => {
    setEditingId(c.campaign_id);
    setEditValues({ name: c.name, bonus_amount: c.bonus_amount });
  };
  const handleSave = async (id) => {
    try {
      await api.patch(`/tenant-admin/bonus/campaign/${id}`, editValues);
      setEditingId(null);
      fetchCampaigns();
    } catch (e) {
      toast.error("Update failed");
    }
  };
  const toggleStatus = async (id, currentStatus) => {
    if (!confirm(`${currentStatus ? "Suspend" : "Reactivate"} this campaign?`))
      return;
    try {
      await api.patch(`/tenant-admin/bonus/campaign/${id}`, {
        is_active: !currentStatus,
      });
      fetchCampaigns();
    } catch (e) {
      toast.error("Action failed");
    }
  };
  const handleDelete = async (id) => {
    if (!confirm("Are you sure? This will archive the campaign.")) return;
    try {
      await api.delete(`/tenant-admin/bonus/campaign/${id}`);
      fetchCampaigns();
    } catch (e) {
      toast.error("Delete failed");
    }
  };
  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getBadgeColor = (type) => {
    switch (type) {
      case "WELCOME":
        return "bg-purple-900/40 text-purple-500 border-purple-500/30";
      case "REFERRAL":
        return "bg-yellow-900/40 text-yellow-500 border-yellow-500/30";
      default:
        return "bg-blue-900/40 text-blue-500 border-blue-500/30";
    }
  };

  return (
    <div className="p-4 md:p-8 ">
      <h2 className="text-3xl font-display text-white mb-6">Bonus Campaigns</h2>

      {/* Create */}
      <div className="bg-[#040029] p-6 rounded-xl border border-white/20 mb-10">
        <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <Gift size={20} /> Create New Campaign
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Name
            </label>
            <input
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 transition-colors"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Summer Kickoff"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Amount ($)
            </label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 transition-colors"
              value={form.bonus_amount}
              onChange={(e) =>
                setForm({ ...form, bonus_amount: e.target.value })
              }
              placeholder="50"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Type
            </label>
            <select
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 transition-colors"
              value={form.bonus_type}
              onChange={(e) => setForm({ ...form, bonus_type: e.target.value })}
            >
              <option value="WELCOME" className="bg-[#040029] text-white">
                Welcome Bonus (Auto)
              </option>
              <option value="REFERRAL" className="bg-[#040029] text-white">
                Referral Bonus (Auto)
              </option>
              <option value="FESTIVAL" className="bg-[#040029] text-white">
                Festival / Event (Manual)
              </option>
            </select>
          </div>
          <GoldButton onClick={handleCreate}>Create</GoldButton>
        </div>
      </div>

      {/* Campaigns */}
      {loading ? (
        <div className="text-gray-500 animate-pulse">Loading campaigns...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {campaigns.map((c) => (
            <div
              key={c.campaign_id}
              className={`bg-[#040029] border p-6 rounded-xl relative group transition-colors flex flex-col justify-between ${
                c.is_active
                  ? "border-white/10 hover:border-yellow-500/50"
                  : "border-red-600/30 opacity-60 hover:border-red-600/60"
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded border text-[10px] font-bold uppercase w-max ${getBadgeColor(c.bonus_type)}`}
                    >
                      {c.bonus_type}
                    </span>
                    <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
                      <Calendar size={10} /> {formatDate(c.created_at)}
                    </span>
                  </div>

                  {!editingId && !c.name.includes("[ARCHIVED]") && (
                    <div className="flex gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => startEdit(c)}
                        className="text-gray-400 hover:text-white p-1 hover:cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.campaign_id)}
                        className="text-gray-400 hover:text-white p-1 hover:cursor-pointer"
                        title="Archive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit Form */}
                {editingId === c.campaign_id ? (
                  <div className="space-y-3 mb-4 bg-white/5 p-3 rounded-lg border border-white/20">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase">
                        Name
                      </label>
                      <InputField
                        value={editValues.name}
                        onChange={(e) =>
                          setEditValues({ ...editValues, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase">
                        Amount
                      </label>
                      <InputField
                        type="number"
                        value={editValues.bonus_amount}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            bonus_amount: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <GoldButton
                        onClick={() => handleSave(c.campaign_id)}
                        className="flex items-center  justify-center gap-1 font-bold text-xs"
                      >
                        <Save size={14} /> Save
                      </GoldButton>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 min-w-[80px] bg-black/40 hover:bg-white/10 border border-white/20 text-white py-1.5 rounded flex items-center justify-center gap-1 font-bold uppercase tracking-wider text-xs"
                      >
                        <XIcon size={14} /> Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <h4
                      className="text-xl font-bold text-white mb-1 truncate"
                      title={c.name}
                    >
                      {c.name}
                    </h4>
                    <div className="text-3xl font-mono font-bold text-gray-300 mb-4">
                      ${c.bonus_amount}
                    </div>
                  </>
                )}
              </div>

              {c.is_active ? (
                <div className="flex flex-wrap gap-2 mt-auto">
                  {c.bonus_type === "FESTIVAL" && (
                    <button
                      onClick={() =>
                        handleDistribute(c.campaign_id, c.bonus_amount)
                      }
                      className="flex-grow py-2 px-3 bg-green-600 hover:bg-green-500 rounded text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 whitespace-nowrap hover:cursor-pointer"
                    >
                      <Megaphone size={14} /> Launch
                    </button>
                  )}
                  <button
                    onClick={() => toggleStatus(c.campaign_id, true)}
                    className="flex-grow py-2 px-3 hover:bg-red-500/20 bg-white/5 border border-white/10 rounded text-red-400 font-bold flex items-center justify-center gap-2 whitespace-nowrap hover:cursor-pointer"
                    title="Suspend Campaign"
                  >
                    <PauseCircle size={16} /> Suspend
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  <div className="flex-grow text-xs text-red-500 font-bold uppercase tracking-wider py-2 bg-red-500/10 rounded text-center border border-red-500/20">
                    Inactive
                  </div>
                  {!c.name.includes("[ARCHIVED]") && (
                    <button
                      onClick={() => toggleStatus(c.campaign_id, false)}
                      className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-green-400"
                      title="Reactivate"
                    >
                      <PlayCircle size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CampaignManagementTab;
