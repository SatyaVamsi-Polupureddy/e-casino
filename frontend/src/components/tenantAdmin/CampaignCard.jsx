import React from "react";
import {
  Megaphone,
  PauseCircle,
  PlayCircle,
  Calendar,
  Target,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const CampaignCard = ({ c, fetchCampaigns }) => {
  const getBadgeColor = (type) => {
    switch (type) {
      case "WELCOME":
        return "bg-purple-900/40 text-purple-500 border-purple-500/30";
      case "REFERRAL":
        return "bg-yellow-900/40 text-yellow-500 border-yellow-500/30";
      case "BET_THRESHOLD":
        return "bg-pink-900/40 text-pink-500 border-pink-500/30"; // New Color
      case "MONTHLY_DEPOSIT":
        return "bg-cyan-900/40 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-blue-900/40 text-blue-500 border-blue-500/30";
    }
  };

  const handleDistribute = async (id, amount, type) => {
    const isPercentage = type === "MONTHLY_DEPOSIT";
    const msg = isPercentage
      ? `Launch Monthly Bonus? This will calculate ${amount}% of deposits...`
      : `Launch Campaign? This will credit $${amount} to all players.`;

    if (!confirm(`${msg} This will also ARCHIVE the campaign.`)) return;

    try {
      const res = await api.post(
        `/tenant-admin/bonus/campaign/${id}/distribute-all`,
        { amount: parseFloat(amount) },
      );
      toast.success(res.data.message);
      if (fetchCampaigns) fetchCampaigns();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  const toggleStatus = async (id, currentStatus) => {
    if (!confirm(`${currentStatus ? "Suspend" : "Reactivate"} this campaign?`))
      return;
    try {
      await api.patch(`/tenant-admin/bonus/campaign/${id}`, {
        is_active: !currentStatus,
      });
      if (fetchCampaigns) fetchCampaigns();
    } catch (e) {
      toast.error("Action failed");
    }
  };

  return (
    <div
      className={`bg-[#040029] border p-6 rounded-xl relative flex flex-col justify-between ${
        c.is_active
          ? "border-white/20 hover:border-green-500/60"
          : "border-white/10 opacity-75"
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1">
            <span
              className={`px-2 py-1 rounded border text-[10px] font-bold uppercase w-max ${getBadgeColor(c.bonus_type)}`}
            >
              {c.bonus_type.replace("_", " ")}
            </span>
            {/* DATE RANGE DISPLAY */}
            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
              <Calendar size={10} />
              {new Date(c.start_date).toLocaleDateString()}
              {c.end_date
                ? ` - ${new Date(c.end_date).toLocaleDateString()}`
                : " (No Expiry)"}
            </span>
          </div>
          <div
            className={`w-2 h-2 rounded-full ${c.is_active ? "bg-green-500 animate-pulse" : "bg-gray-500"}`}
          />
        </div>

        <h4 className="text-xl font-bold text-white mb-1 truncate">
          {c.name.replace(" [ARCHIVED]", "")}
        </h4>

        {/* REWARD DISPLAY */}
        <div className="text-3xl font-mono font-bold text-gray-300 mb-2">
          {c.bonus_type === "MONTHLY_DEPOSIT" ? (
            <span>{c.bonus_amount}%</span>
          ) : (
            <span>${c.bonus_amount}</span>
          )}
        </div>

        {/* TARGET DISPLAY FOR BET THRESHOLD */}
        {c.bonus_type === "BET_THRESHOLD" && (
          <div className="bg-pink-900/20 border border-pink-500/20 p-2 rounded mb-4">
            <p className="text-[10px] text-pink-400 uppercase font-bold flex items-center gap-1">
              <Target size={12} /> Goal: Total Bets
            </p>
            <p className="text-lg font-mono text-white">
              ${c.wagering_requirement}
            </p>
          </div>
        )}
      </div>

      {c.is_active ? (
        <div className="flex flex-wrap gap-2 mt-auto">
          {(c.bonus_type === "FESTIVAL" ||
            c.bonus_type === "MONTHLY_DEPOSIT") && (
            <button
              onClick={() =>
                handleDistribute(c.campaign_id, c.bonus_amount, c.bonus_type)
              }
              className="flex-grow py-2 px-3 bg-green-600 hover:bg-green-500 rounded text-sm font-bold text-white flex items-center justify-center gap-2"
            >
              <Megaphone size={14} /> Launch
            </button>
          )}
          <button
            onClick={() => toggleStatus(c.campaign_id, true)}
            className="flex-grow py-2 px-3 bg-white/5 border border-white/10 rounded text-red-400 font-bold flex items-center justify-center gap-2"
          >
            <PauseCircle size={16} /> Suspend
          </button>
        </div>
      ) : (
        <div className="flex gap-2 mt-auto">
          {!c.name.includes("[ARCHIVED]") && (
            <button
              onClick={() => toggleStatus(c.campaign_id, false)}
              className="flex-grow py-2 px-3 bg-white/5 border border-white/10 rounded text-green-400 font-bold flex items-center justify-center gap-2"
            >
              <PlayCircle size={16} /> Reactivate
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default CampaignCard;
