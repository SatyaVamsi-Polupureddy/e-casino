import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import GoldButton from "../../components/ui/GoldButton";
import CampaignCard from "./CampaignCard";
import {
  Gift,
  CheckCircle,
  AlertTriangle,
  Archive,
  Filter,
} from "lucide-react";

const CampaignManagementTab = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  // Updated Form State
  const [form, setForm] = useState({
    name: "",
    bonus_amount: "",
    bonus_type: "WELCOME",
    wagering_requirement: "",
    start_date: new Date().toISOString().split("T")[0],
    end_date: "",
  });

  // Filter State
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
    if (!form.name || !form.bonus_amount || !form.start_date)
      return toast.error("Name, Amount, and Start Date are required");

    if (form.bonus_type === "BET_THRESHOLD" && !form.wagering_requirement) {
      return toast.error("Please set the Target Bet Amount");
    }

    try {
      // Prepare payload
      const payload = {
        ...form,
        bonus_amount: parseFloat(form.bonus_amount),
        wagering_requirement: form.wagering_requirement
          ? parseFloat(form.wagering_requirement)
          : 0,
        end_date: form.end_date || null, // Send null if empty
      };

      await api.post("/tenant-admin/bonus/campaigns", payload);
      toast.success("Campaign Created!");

      setForm({
        name: "",
        bonus_amount: "",
        bonus_type: "WELCOME",
        wagering_requirement: "",
        start_date: new Date().toISOString().split("T")[0],
        end_date: "",
      });
      fetchCampaigns();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Failed");
    }
  };

  // --- FILTER LOGIC ---
  const { activeCampaigns, suspendedCampaigns, archivedCampaigns } =
    useMemo(() => {
      const active = [];
      const suspended = [];
      const archived = [];

      campaigns.forEach((c) => {
        if (c.is_active) {
          active.push(c);
        } else {
          // Check if Archived (Soft Deleted) OR Expired (End Date Passed)
          if (c.name.includes("[ARCHIVED]")) {
            const cDate = new Date(c.created_at);
            if (
              cDate.getMonth() === filterDate.month &&
              cDate.getFullYear() === filterDate.year
            ) {
              archived.push(c);
            }
          } else {
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

      {/* --- CREATE CAMPAIGN FORM --- */}
      <div className="bg-[#040029] p-6 rounded-xl border border-white/20">
        <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <Gift size={20} /> Create New Campaign
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          {/* 1. TYPE */}
          <div className="col-span-1">
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Campaign Type
            </label>
            <select
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 transition-colors"
              value={form.bonus_type}
              onChange={(e) => setForm({ ...form, bonus_type: e.target.value })}
            >
              <option value="WELCOME" className="bg-[#040029]">
                Welcome Bonus (Auto)
              </option>
              <option value="REFERRAL" className="bg-[#040029]">
                Referral Bonus (Auto)
              </option>
              <option value="BET_THRESHOLD" className="bg-[#040029]">
                Betting Milestone (Auto)
              </option>
              <option value="FESTIVAL" className="bg-[#040029]">
                Festival / Event (Manual)
              </option>
              <option value="MONTHLY_DEPOSIT" className="bg-[#040029]">
                Monthly Deposit % (Manual)
              </option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Name
            </label>
            <input
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. VIP Challenge"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              {form.bonus_type === "MONTHLY_DEPOSIT"
                ? "Reward %"
                : "Reward ($)"}
            </label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
              value={form.bonus_amount}
              onChange={(e) =>
                setForm({ ...form, bonus_amount: e.target.value })
              }
              placeholder="0.00"
            />
          </div>

          {form.bonus_type === "BET_THRESHOLD" && (
            <div>
              <label className="block text-xs font-bold text-yellow-500 mb-2">
                Target Bet Sum ($)
              </label>
              <input
                type="number"
                className="w-full bg-yellow-900/20 border border-yellow-500/50 p-3 rounded text-yellow-500 font-bold outline-none focus:border-yellow-400"
                value={form.wagering_requirement}
                onChange={(e) =>
                  setForm({ ...form, wagering_requirement: e.target.value })
                }
                placeholder="e.g. 1000"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Start Date
            </label>
            <input
              type="date"
              min={form.start_date}
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
              value={form.start_date}
              onChange={(e) => setForm({ ...form, start_date: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              End Date (Optional)
            </label>
            <input
              type="date"
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
              value={form.end_date}
              min={form.start_date}
              onChange={(e) => setForm({ ...form, end_date: e.target.value })}
            />
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-4 flex justify-end mt-4">
            <GoldButton
              onClick={handleCreate}
              className="w-full md:w-auto px-8"
            >
              Create Campaign
            </GoldButton>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500 animate-pulse">
          Loading...
        </div>
      ) : (
        <>
          {/* ACTIVE */}
          <div>
            <div className="flex items-center gap-2 mb-4 border-l-4 border-green-500 pl-3">
              <CheckCircle size={20} className="text-green-500" />
              <h3 className="text-xl font-bold text-white">Active Campaigns</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeCampaigns.map((c) => (
                <CampaignCard
                  key={c.campaign_id}
                  c={c}
                  fetchCampaigns={fetchCampaigns}
                />
              ))}
            </div>
          </div>

          {/* SUSPENDED */}
          {suspendedCampaigns.length > 0 && (
            <div className="mt-8">
              <div className="flex items-center gap-2 mb-4 border-l-4 border-orange-500 pl-3">
                <AlertTriangle size={20} className="text-orange-500" />
                <h3 className="text-xl font-bold text-white">
                  Suspended Campaigns
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {suspendedCampaigns.map((c) => (
                  <CampaignCard
                    key={c.campaign_id}
                    c={c}
                    fetchCampaigns={fetchCampaigns}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ARCHIVED */}
          <div className="mt-8 pt-8 border-t border-white/5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-l-4 border-gray-500 pl-3">
              <div className="flex items-center gap-2">
                <Archive size={20} className="text-gray-500" />
                <h3 className="text-xl font-bold text-white">
                  Completed Campaigns
                </h3>
              </div>

              {/* Filter Controls */}
              <div className="flex items-center gap-2 bg-[#040029] p-1 rounded border border-yellow-500/50">
                {/* 1. MONTH SELECTOR */}
                <select
                  className="bg-transparent text-white text-sm outline-none p-2 cursor-pointer hover:text-yellow-500 transition-colors"
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

                {/* Vertical Divider */}
                <div className="w-px h-4 bg-white/20"></div>

                {/* 2. YEAR SELECTOR */}
                <select
                  className="bg-transparent text-white text-sm outline-none p-2 cursor-pointer hover:text-yellow-500 transition-colors"
                  value={filterDate.year}
                  onChange={(e) =>
                    setFilterDate({
                      ...filterDate,
                      year: parseInt(e.target.value),
                    })
                  }
                >
                  {[0, 1, 2].map((o) => (
                    <option
                      key={o}
                      value={new Date().getFullYear() - o}
                      className="bg-[#040029]"
                    >
                      {new Date().getFullYear() - o}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {archivedCampaigns.length > 0 ? (
                archivedCampaigns.map((c) => (
                  <CampaignCard
                    key={c.campaign_id}
                    c={c}
                    fetchCampaigns={fetchCampaigns}
                  />
                ))
              ) : (
                <div className="col-span-full py-12 text-center text-gray-500 italic border border-dashed border-white/10 rounded-xl">
                  No completed campaigns found for this period.
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignManagementTab;
