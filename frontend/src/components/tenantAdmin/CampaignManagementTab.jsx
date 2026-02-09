import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import GoldButton from "../../components/ui/GoldButton";

import CampaignCard from "./CampaignCard";
import {
  Gift,
  Calendar,
  Filter,
  CheckCircle,
  AlertTriangle,
  Archive,
} from "lucide-react";

const CampaignManagementTab = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [form, setForm] = useState({
    name: "",
    bonus_amount: "",
    bonus_type: "WELCOME",
  });
  const [loading, setLoading] = useState(false);

  // Filter State (Default to current Month/Year)
  const [filterDate, setFilterDate] = useState({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });

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

  // --- FILTER LOGIC (UPDATED) ---
  const { activeCampaigns, suspendedCampaigns, archivedCampaigns } =
    useMemo(() => {
      const active = [];
      const suspended = [];
      const archived = [];

      campaigns.forEach((c) => {
        if (c.is_active) {
          // 1. Active: Running Now
          active.push(c);
        } else {
          // 2. Inactive: Check if Suspended or Archived
          if (c.name.includes("[ARCHIVED]")) {
            // 2a. Archived: Filter by Date
            const cDate = new Date(c.created_at);
            if (
              cDate.getMonth() === filterDate.month &&
              cDate.getFullYear() === filterDate.year
            ) {
              archived.push(c);
            }
          } else {
            // 2b. Suspended: Show ALL (Important to see regardless of date)
            suspended.push(c);
          }
        }
      });

      const sorter = (a, b) => new Date(b.created_at) - new Date(a.created_at);

      return {
        activeCampaigns: active.sort(sorter),
        suspendedCampaigns: suspended.sort(sorter),
        archivedCampaigns: archived.sort(sorter),
      };
    }, [campaigns, filterDate]);

  return (
    <div className="p-4 md:p-8 space-y-12">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-display text-white">Bonus Campaigns</h2>
      </div>

      {/* --- 1. CREATE CAMPAIGN FORM --- */}
      <div className="bg-[#040029] p-6 rounded-xl border border-white/20">
        <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <Gift size={20} /> Create New Campaign
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-end">
          {/* TYPE (Moved to Start) */}
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
              <option
                value="MONTHLY_DEPOSIT"
                className="bg-[#040029] text-white"
              >
                Monthly Deposit % (Manual)
              </option>
            </select>
          </div>

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
              {form.bonus_type === "MONTHLY_DEPOSIT"
                ? "Percentage (%)"
                : "Amount ($)"}
            </label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 transition-colors"
              value={form.bonus_amount}
              onChange={(e) =>
                setForm({ ...form, bonus_amount: e.target.value })
              }
              placeholder={
                form.bonus_type === "MONTHLY_DEPOSIT" ? "e.g. 10" : "50"
              }
            />
          </div>

          <GoldButton onClick={handleCreate}>Create</GoldButton>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 animate-pulse">
          Loading campaigns...
        </div>
      ) : (
        <>
          <div>
            <div className="flex items-center gap-2 mb-4 border-l-4 border-green-500 pl-3">
              <CheckCircle size={20} className="text-green-500" />
              <h3 className="text-xl font-bold text-white">Active Campaigns</h3>
            </div>

            {activeCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {activeCampaigns.map((c) => (
                  <CampaignCard key={c.campaign_id} c={c} />
                ))}
              </div>
            ) : (
              <div className="p-8 border border-dashed border-white/10 rounded-xl text-center text-gray-500 text-sm">
                No active campaigns running.
              </div>
            )}
          </div>

          {/* --- 3. SUSPENDED CAMPAIGNS (Conditional Display) --- */}
          {suspendedCampaigns.length > 0 && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center gap-2 mb-4 border-l-4 border-orange-500 pl-3">
                <AlertTriangle size={20} className="text-orange-500" />
                <h3 className="text-xl font-bold text-white">
                  Suspended Campaigns
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {suspendedCampaigns.map((c) => (
                  <CampaignCard key={c.campaign_id} c={c} />
                ))}
              </div>
            </div>
          )}

          {/* --- 4. ARCHIVED / COMPLETED HISTORY --- */}
          <div className="pt-8 border-t border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-l-4 border-gray-500 pl-3">
              <div className="flex items-center gap-2">
                <Archive size={20} className="text-gray-500" />
                <h3 className="text-xl font-bold text-white">
                  Completed Campaigns
                </h3>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 bg-[#040029] p-1 rounded border border-yellow-500/50">
                <div className="px-3 text-gray-400">
                  <Filter size={16} />
                </div>
                <select
                  className="bg-transparent text-white text-sm font-bold outline-none p-2 cursor-pointer hover:text-yellow-500"
                  value={filterDate.month}
                  onChange={(e) =>
                    setFilterDate({
                      ...filterDate,
                      month: parseInt(e.target.value),
                    })
                  }
                >
                  {Array.from({ length: 12 }, (_, i) => (
                    <option key={i} value={i} className="bg-[#040029]">
                      {new Date(0, i).toLocaleString("default", {
                        month: "long",
                      })}
                    </option>
                  ))}
                </select>
                <select
                  className="bg-transparent text-white text-sm font-bold outline-none p-2 border-l border-yellow-500/50 cursor-pointer hover:text-yellow-500"
                  value={filterDate.year}
                  onChange={(e) =>
                    setFilterDate({
                      ...filterDate,
                      year: parseInt(e.target.value),
                    })
                  }
                >
                  {[0, 1, 2].map((offset) => {
                    const y = new Date().getFullYear() - offset;
                    return (
                      <option key={y} value={y} className="bg-[#040029]">
                        {y}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {archivedCampaigns.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {archivedCampaigns.map((c) => (
                  <CampaignCard key={c.campaign_id} c={c} />
                ))}
              </div>
            ) : (
              <div className="p-12 bg-white/5 border border-white/10 rounded-xl text-center">
                <Calendar className="mx-auto text-gray-600 mb-2" size={32} />
                <p className="text-gray-400">
                  No completed campaigns found for{" "}
                  {new Date(0, filterDate.month).toLocaleString("default", {
                    month: "long",
                  })}{" "}
                  {filterDate.year}.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignManagementTab;
