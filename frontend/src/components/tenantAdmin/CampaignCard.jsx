import { Megaphone, PauseCircle, PlayCircle, Calendar } from "lucide-react";

const CampaignCard = ({ c }) => {
  const getBadgeColor = (type) => {
    switch (type) {
      case "WELCOME":
        return "bg-purple-900/40 text-purple-500 border-purple-500/30";
      case "REFERRAL":
        return "bg-yellow-900/40 text-yellow-500 border-yellow-500/30";
      case "MONTHLY_DEPOSIT":
        return "bg-cyan-900/40 text-cyan-400 border-cyan-500/30";
      default:
        return "bg-blue-900/40 text-blue-500 border-blue-500/30";
    }
  };
  const handleDistribute = async (id, amount, type) => {
    const isPercentage = type === "MONTHLY_DEPOSIT";
    const msg = isPercentage
      ? `Launch Monthly Bonus? This will calculate ${amount}% of deposits for THIS month for all players and credit them.`
      : `Launch Campaign? This will credit $${amount} to all players.`;

    if (!confirm(`${msg} This will also ARCHIVE the campaign.`)) return;

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

  const formatDate = (dateString) => {
    if (!dateString) return "Just now";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div
      className={`bg-[#040029] border p-6 rounded-xl relative group transition-colors flex flex-col justify-between ${
        c.is_active
          ? "border-white/20 hover:border-green-500/60 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
          : c.name.includes("[ARCHIVED]")
            ? "border-white/20 hover:border-red-500/70" // Archived Style
            : "border-white/20  hover:border-yellow-500/70" // Suspended Style
      }`}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-col gap-1">
            <span
              className={`px-2 py-1 rounded border text-[10px] font-bold uppercase w-max ${getBadgeColor(
                c.bonus_type,
              )}`}
            >
              {c.bonus_type === "MONTHLY_DEPOSIT"
                ? "MONTHLY DEPOSIT %"
                : c.bonus_type}
            </span>
            <span className="text-[10px] text-gray-400 flex items-center gap-1 mt-1">
              <Calendar size={10} /> {formatDate(c.created_at)}
            </span>
          </div>
          {/* Status Indicator */}
          {c.is_active ? (
            <div
              className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
              title="Active"
            />
          ) : c.name.includes("[ARCHIVED]") ? (
            <div
              className="w-2 h-2 rounded-full bg-gray-500"
              title="Archived"
            />
          ) : (
            <div
              className="w-2 h-2 rounded-full bg-orange-500"
              title="Suspended"
            />
          )}
        </div>

        <h4
          className="text-xl font-bold text-white mb-1 truncate"
          title={c.name}
        >
          {c.name.replace(" [ARCHIVED]", "")}
        </h4>
        <div className="text-3xl font-mono font-bold text-gray-300 mb-4">
          {c.bonus_type === "MONTHLY_DEPOSIT" ? (
            <span>{c.bonus_amount}%</span>
          ) : (
            <span>${c.bonus_amount}</span>
          )}
        </div>
      </div>

      {c.is_active ? (
        <div className="flex flex-wrap gap-2 mt-auto">
          {(c.bonus_type === "FESTIVAL" ||
            c.bonus_type === "MONTHLY_DEPOSIT") && (
            <button
              onClick={() =>
                handleDistribute(c.campaign_id, c.bonus_amount, c.bonus_type)
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
          {/* Label changes based on Archived vs Suspended */}
          {c.name.includes("[ARCHIVED]") ? (
            <div className="flex-grow text-xs text-gray-500 font-bold uppercase tracking-wider py-2 bg-white/5 rounded text-center border border-white/10">
              Completed
            </div>
          ) : (
            <div className="flex-grow text-xs text-orange-500 font-bold uppercase tracking-wider py-2 bg-orange-500/10 rounded text-center border border-orange-500/20 flex items-center justify-center gap-2">
              <PauseCircle size={12} /> Suspended
            </div>
          )}

          {/* Allow Reactivation ONLY if NOT Archived */}
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
  );
};

export default CampaignCard;
