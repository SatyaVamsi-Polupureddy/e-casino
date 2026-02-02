import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import tenantService from "../../services/tenantService";
import toast from "react-hot-toast";
import api from "../../services/api";
import GoldButton from "../../components/ui/GoldButton";
import ContactModal from "../../components/common/ContactModal";
import {
  Users,
  Settings,
  FileText,
  CheckCircle,
  Eye,
  Shield,
  Check,
  DollarSign,
  LogOut,
  Menu,
  X,
  Briefcase,
  Lock,
  UserPlus,
  Gamepad2,
  Plus,
  Gift,
  Megaphone,
  Edit2,
  Trash2,
  PauseCircle,
  PlayCircle,
  Save,
  X as XIcon,
  Calendar,
  Trophy,
  Award,
  HelpCircle,
  SearchIcon,
  XCircle,
} from "lucide-react";

// --- MAIN DASHBOARD ---
const TenantDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("kyc-submission");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  // --- DATA STATE ---
  const [tenantProfile, setTenantProfile] = useState(null);
  const [isApproved, setIsApproved] = useState(false);

  // --- FORMS & SETTINGS ---
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ old: "", new: "" });

  const [settingsForm, setSettingsForm] = useState({
    default_daily_bet_limit: "",
    default_daily_loss_limit: "",
    default_max_single_bet: "",
  });

  const [myKycForm, setMyKycForm] = useState({
    type: "BUSINESS_LICENSE",
    url: "",
  });

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const res = await tenantService.getTenantProfile();
      setTenantProfile(res.data);
      const approved =
        res.data.kyc_status === "VERIFIED" ||
        res.data.kyc_status === "APPROVED";
      setIsApproved(approved);
      if (!approved) setActiveTab("kyc-submission");

      if (res.data) {
        setSettingsForm({
          default_daily_bet_limit: res.data.default_daily_bet_limit || 1000,
          default_daily_loss_limit: res.data.default_daily_loss_limit || 500,
          default_max_single_bet: res.data.default_max_single_bet || 100,
        });
      }
    } catch (err) {
      if (err.response?.status === 401) navigate("/auth");
    }
  };

  const handleUpdateSettings = async (e) => {
    e.preventDefault();
    try {
      await tenantService.updateDefaultLimits({
        default_daily_bet_limit: parseFloat(
          settingsForm.default_daily_bet_limit,
        ),
        default_daily_loss_limit: parseFloat(
          settingsForm.default_daily_loss_limit,
        ),
        default_max_single_bet: parseFloat(settingsForm.default_max_single_bet),
      });
      toast.success("Defaults Saved!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleSubmitMyKYC = async (e) => {
    e.preventDefault();
    try {
      await tenantService.submitTenantKYC(myKycForm.type, myKycForm.url);
      toast.success("Submitted!");
      setMyKycForm({ type: "BUSINESS_LICENSE", url: "" });
      checkStatus();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await tenantService.updateMyPassword(passwordForm.old, passwordForm.new);
      toast.success("Password Updated! Login again.");
      localStorage.clear();
      navigate("/auth");
    } catch (err) {
      toast.error(err.response?.data?.detail || err.message);
    }
  };

  // Close sidebar on mobile when tab changes
  const changeTab = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-[#040029] text-white overflow-hidden">
      {/* 1. MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#040029] border-b border-white/10 flex items-center px-4 z-40 justify-between shadow-lg">
        <span className="text-xl font-display text-casino-gold tracking-wider">
          TENANT ADMIN
        </span>
        <button
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="text-white p-2 rounded hover:bg-white/10"
        >
          {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* 3. SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#040029] border-r border-white/20 p-6 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex-shrink-0 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-display text-casino-gold block">
              DASHBOARD
            </h1>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="md:hidden text-gray-400 hover:text-white"
            >
              <X size={24} />
            </button>
          </div>
          <div className="px-3 py-2 bg-white/10 rounded border border-white/10">
            <p className="text-xs text-gray-300 uppercase">Status</p>
            <p
              className={`font-bold ${isApproved ? "text-green-400" : "text-yellow-400"}`}
            >
              {tenantProfile?.kyc_status || "LOADING..."}
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto space-y-3 min-h-0 custom-scrollbar pr-2">
          <SidebarItem
            icon={<Briefcase size={20} />}
            label="KYC Submission"
            active={activeTab === "kyc-submission"}
            onClick={() => changeTab("kyc-submission")}
          />
          {isApproved ? (
            <>
              <SidebarItem
                icon={<Settings size={20} />}
                label="Global Settings"
                active={activeTab === "settings"}
                onClick={() => changeTab("settings")}
              />
              <SidebarItem
                icon={<Gamepad2 size={20} />}
                label="Games"
                active={activeTab === "games"}
                onClick={() => changeTab("games")}
              />
              <SidebarItem
                icon={<Gift size={20} />}
                label="Campaigns"
                active={activeTab === "campaigns"}
                onClick={() => changeTab("campaigns")}
              />
              <SidebarItem
                icon={<Trophy size={20} />}
                label="Jackpots"
                active={activeTab === "jackpots"}
                onClick={() => changeTab("jackpots")}
              />

              <div className="pt-4 pb-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                Management
              </div>
              <SidebarItem
                icon={<Shield size={20} />}
                label="KYC Review"
                active={activeTab === "approvals"}
                onClick={() => changeTab("approvals")}
              />
              <SidebarItem
                icon={<Users size={20} />}
                label="Players"
                active={activeTab === "players"}
                onClick={() => changeTab("players")}
              />
              <SidebarItem
                icon={<UserPlus size={20} />}
                label="Staff / Team"
                active={activeTab === "staff"}
                onClick={() => changeTab("staff")}
              />

              <div className="pt-4 pb-2 text-xs text-gray-500 font-bold uppercase tracking-wider">
                Profile
              </div>
              <SidebarItem
                icon={<Lock size={20} />}
                label="My Password"
                active={activeTab === "change-password"}
                onClick={() => changeTab("change-password")}
              />
            </>
          ) : (
            <div className="mt-8 p-4 border border-red-500/30 bg-red-500/20 rounded text-sm text-white">
              <Lock size={16} className="inline mb-1 text-red-400" /> Locked
            </div>
          )}
        </nav>

        <div className="flex-shrink-0 pt-4 border-t border-white/20 mt-2 space-y-2">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <HelpCircle size={20} />
            <span>Contact Admin</span>
          </button>

          <button
            onClick={() => {
              localStorage.clear();
              navigate("/auth");
            }}
            className="flex items-center text-casino-red gap-2 w-full p-3 hover:bg-red-900/10 rounded transition-colors"
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </aside>

      {/* 4. MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full bg-[#040029]">
        {activeTab === "games" && isApproved && <GameManagementTab />}
        {activeTab === "campaigns" && isApproved && <CampaignManagementTab />}
        {activeTab === "jackpots" && isApproved && <JackpotManagementTab />}
        {activeTab === "approvals" && isApproved && <PlayerApprovalsTab />}
        {/* NEW CONSOLIDATED TABS */}
        {activeTab === "players" && isApproved && <PlayersManagementTab />}
        {activeTab === "staff" && isApproved && <StaffManagementTab />}

        {activeTab === "kyc-submission" && (
          <div className="max-w-xl mx-auto bg-white/5 p-6 rounded border border-white/10">
            <h2 className="text-xl text-casino-gold mb-4">KYC Submission</h2>
            {tenantProfile?.kyc_status === "VERIFIED" ||
            tenantProfile?.kyc_status === "APPROVED" ? (
              <div className="text-green-400 font-bold flex gap-2">
                <Check /> Verified
              </div>
            ) : (
              <form onSubmit={handleSubmitMyKYC} className="space-y-4">
                <select
                  className="w-full bg-black/40 border border-white/20 p-3 text-white"
                  value={myKycForm.type}
                  onChange={(e) =>
                    setMyKycForm({ ...myKycForm, type: e.target.value })
                  }
                >
                  <option value="BUSINESS_LICENSE">License</option>
                  <option value="ID_PROOF">ID</option>
                </select>
                <input
                  className="w-full bg-black/40 border border-white/20 p-3 text-white"
                  placeholder="Doc URL"
                  value={myKycForm.url}
                  onChange={(e) =>
                    setMyKycForm({ ...myKycForm, url: e.target.value })
                  }
                />
                <GoldButton fullWidth type="submit">
                  Submit
                </GoldButton>
              </form>
            )}
          </div>
        )}

        {activeTab === "settings" && isApproved && (
          <div className="max-w-xl mx-auto bg-white/5 p-6 rounded border border-white/10">
            <h2 className="text-xl text-casino-gold mb-4">Global Limits</h2>
            <form onSubmit={handleUpdateSettings} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase block mb-1">
                  Default Daily Bet Limit
                </label>
                <input
                  type="number"
                  placeholder="e.g. 1000"
                  className="w-full bg-black/40 border border-white/20 p-3 text-white placeholder-gray-600"
                  value={settingsForm.default_daily_bet_limit}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      default_daily_bet_limit: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase block mb-1">
                  Default Daily Loss Limit
                </label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  className="w-full bg-black/40 border border-white/20 p-3 text-white placeholder-gray-600"
                  value={settingsForm.default_daily_loss_limit}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      default_daily_loss_limit: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase block mb-1">
                  Default Max Single Bet
                </label>
                <input
                  type="number"
                  placeholder="e.g. 100"
                  className="w-full bg-black/40 border border-white/20 p-3 text-white placeholder-gray-600"
                  value={settingsForm.default_max_single_bet}
                  onChange={(e) =>
                    setSettingsForm({
                      ...settingsForm,
                      default_max_single_bet: e.target.value,
                    })
                  }
                />
              </div>
              <GoldButton fullWidth type="submit">
                Save
              </GoldButton>
            </form>
          </div>
        )}

        {activeTab === "change-password" && isApproved && (
          <div className="max-w-xl mx-auto bg-white/5 p-6 rounded border border-white/10">
            <h2 className="text-xl text-casino-gold mb-4">My Password</h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div className="relative">
                <input
                  type={showOldPassword ? "text" : "password"}
                  className="w-full bg-black/40 border border-white/20 p-3 text-white"
                  placeholder="Old"
                  value={passwordForm.old}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, old: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowOldPassword(!showOldPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <div className="relative">
                <input
                  type={showNewPassword ? "text" : "password"}
                  className="w-full bg-black/40 border border-white/20 p-3 text-white"
                  placeholder="New"
                  value={passwordForm.new}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, new: e.target.value })
                  }
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3 text-gray-400"
                >
                  {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <GoldButton fullWidth type="submit">
                Update
              </GoldButton>
            </form>
          </div>
        )}
      </main>

      <ContactModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        userRole="TENANT_ADMIN"
      />
    </div>
  );
};

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${
      active
        ? "bg-casino-gold text-black font-bold"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

const JackpotManagementTab = () => {
  const [jackpots, setJackpots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    entry_fee: "",
    event_date: "",
    currency_code: "USD",
  });

  useEffect(() => {
    fetchJackpots();
  }, []);

  const fetchJackpots = async () => {
    setLoading(true);
    try {
      const res = await api.get("/tenant-admin/jackpot/list");

      // SORT LOGIC: OPEN first, then by Date
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

      {/* 1. CREATOR FORM */}
      <div className="bg-[#040029] p-6 rounded-xl border border-white/20 mb-10">
        <h3 className="text-lg font-bold text-yellow-500 mb-4 flex items-center gap-2">
          <Trophy size={20} /> Schedule New Jackpot
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Draw Date
            </label>
            {/* --- LOCKED DATE PICKER --- */}
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]} // Visual limit
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 [color-scheme:dark] cursor-pointer"
              value={form.event_date}
              // 1. Prevent Typing
              onKeyDown={(e) => e.preventDefault()}
              // 2. Open Calendar on Click
              onClick={(e) => e.target.showPicker && e.target.showPicker()}
              onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Entry Fee ($)
            </label>
            <input
              type="number"
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
              value={form.entry_fee}
              onChange={(e) => setForm({ ...form, entry_fee: e.target.value })}
            />
          </div>
          <GoldButton onClick={handleCreate}>Schedule Event</GoldButton>
        </div>
      </div>

      {/* 2. JACKPOTS LIST */}
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
      {/* Visual Display (Thumbnail) */}
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

      {/* Game Name Display */}
      <div className="flex-1">
        <h3 className="font-bold text-white mb-3 text-lg leading-tight">
          {game.title}
        </h3>

        <div className="flex gap-2 mb-4">
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold">
              Min ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.1"
              className="w-full bg-black/40 p-2 text-sm rounded text-white border border-white/20 focus:border-casino-gold outline-none transition-colors"
              value={min}
              onChange={(e) => setMin(e.target.value)}
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-gray-500 uppercase font-bold">
              Max ($)
            </label>
            <input
              type="number"
              min="0"
              step="1"
              className="w-full border-white/10 p-2 text-sm rounded text-white border bg-black/40  focus:border-casino-gold outline-none transition-colors"
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

// --- 2. MAIN COMPONENT ---
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

  // Filter out games already installed
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
      {/* SECTION 1: MY LIVE GAMES */}
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
              {/* Thumbnail Display */}
              <img
                src={game.default_thumbnail_url}
                className="w-20 h-20 rounded-lg object-cover shadow-lg bg-black"
                alt={game.game_name}
              />

              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start">
                  {/* GAME NAME DISPLAY */}
                  <h3 className="font-bold text-white text-lg truncate px-2">
                    {game.title || game.custom_name}
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
                  className="p-2 rounded bg-transparent  text-gray-400 hover:text-white transition-colors "
                >
                  <Settings size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: LIBRARY */}
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

            {/* GAME NAME IN MODAL */}
            <p className="text-gray-500 text-sm mb-6 truncate font-medium">
              {editForm.title}
            </p>

            <div className="space-y-5 mb-8">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">
                    Min Bet
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={editForm.min}
                    onChange={(e) =>
                      setEditForm({ ...editForm, min: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white font-mono focus:border-casino-gold outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1.5 block">
                    Max Bet
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={editForm.max}
                    onChange={(e) =>
                      setEditForm({ ...editForm, max: e.target.value })
                    }
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white font-mono focus:border-casino-gold outline-none"
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
                className="flex-1 py-3 bg-white/10 text-gray-400 rounded-lg hover:bg-white/10 font-bold transition-colors border border-white/20"
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

const CampaignManagementTab = () => {
  /* ... Keep your existing CampaignManagementTab code ... */
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
    // Updated text to reflect Archive logic
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
    const action = currentStatus ? "Suspend" : "Reactivate";
    if (!confirm(`${action} this campaign?`)) return;
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

  return (
    <div className="p-4 md:p-8 ">
      <h2 className="text-3xl font-display text-white mb-6">Bonus Campaigns</h2>

      {/* Creator Form */}
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
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">
              Type
            </label>
            <select
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white/60 outline-none focus:border-yellow-500 transition-colors"
              value={form.bonus_type}
              onChange={(e) => setForm({ ...form, bonus_type: e.target.value })}
            >
              <option
                value="WELCOME"
                className="bg-[#040029] border border-white/20 text-white/80"
              >
                Welcome (Auto)
              </option>
              <option
                value="FESTIVAL"
                className="bg-[#040029] border border-white/20 text-white/80"
              >
                Festival (Manual)
              </option>
            </select>
          </div>
          <GoldButton onClick={handleCreate}>Create</GoldButton>
        </div>
      </div>

      {/* Campaigns Grid */}
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
                {/* Header: Badges & Actions */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col gap-1">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase w-max ${
                        c.bonus_type === "WELCOME"
                          ? "bg-purple-900/40 text-purple-500"
                          : "bg-blue-900/40 text-blue-500"
                      }`}
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
                        className="text-gray-400 hover:text-white p-1"
                        title="Edit"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(c.campaign_id)}
                        className="text-gray-400 hover:text-white p-1"
                        title="Archive"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content or Edit Form */}
                {editingId === c.campaign_id ? (
                  <div className="space-y-3 mb-4 bg-white/5 p-3 rounded-lg border border-white/20">
                    <div>
                      <label className="text-[10px] text-gray-400 uppercase">
                        Name
                      </label>
                      <input
                        className="w-full bg-black/40 border border-white/20 p-2 rounded text-white text-sm"
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
                      <input
                        type="number"
                        className="w-full bg-black/40 border border-white/20 p-2 rounded text-white text-sm"
                        value={editValues.bonus_amount}
                        onChange={(e) =>
                          setEditValues({
                            ...editValues,
                            bonus_amount: e.target.value,
                          })
                        }
                      />
                    </div>
                    {/* Responsive Button Group for Save/Cancel */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      <GoldButton
                        onClick={() => handleSave(c.campaign_id)}
                        className="flex items-center  justify-center gap-1 font-bold text-xs"
                      >
                        <Save size={14} /> Save
                      </GoldButton>
                      <button
                        onClick={() => setEditingId(null)}
                        className="flex-1 min-w-[80px] bg-black/40 hover:bg-gray-900 border border-white/20 text-white py-1.5 rounded flex items-center justify-center gap-1 font-bold uppercase tracking-wider text-xs"
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

              {/* Footer Actions (Launch / Suspend) */}
              {c.is_active ? (
                <div className="flex flex-wrap gap-2 mt-auto">
                  {c.bonus_type === "FESTIVAL" && (
                    <button
                      onClick={() =>
                        handleDistribute(c.campaign_id, c.bonus_amount)
                      }
                      className="flex-grow py-2 px-3 bg-green-600 hover:bg-green-500 rounded text-sm font-bold text-white flex items-center justify-center gap-2 shadow-lg shadow-green-900/20 whitespace-nowrap"
                    >
                      <Megaphone size={14} /> Launch
                    </button>
                  )}
                  <button
                    onClick={() => toggleStatus(c.campaign_id, true)}
                    className="flex-grow py-2 px-3 hover:bg-red-500/20 bg-white/5 border border-white/10 rounded text-red-400 font-bold flex items-center justify-center gap-2 whitespace-nowrap"
                    title="Suspend Campaign"
                  >
                    <PauseCircle size={16} /> Suspend
                  </button>
                </div>
              ) : (
                <div className="flex flex-wrap items-center gap-2 mt-auto">
                  <div className="flex-grow text-xs text-red-500 font-bold uppercase tracking-wider py-2 bg-red-500/10 rounded text-center border border-red-500/20">
                    Inactive / Archived
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

// ... imports (same as before) ...

// --- NEW COMPONENT: PLAYERS MANAGEMENT (With Search & Edit) ---
const PlayersManagementTab = () => {
  const [players, setPlayers] = useState([]);
  const [filteredPlayers, setFilteredPlayers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Modal States
  const [editingLimit, setEditingLimit] = useState(null);

  useEffect(() => {
    fetchAllPlayers();
  }, []);

  // Filter Logic
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

      {/* DATA TABLE */}
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

      {/* LIMITS MODAL */}
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
                <input
                  type="number"
                  className="w-full bg-black/40 border border-white/20 p-2 rounded text-white"
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
                <input
                  type="number"
                  className="w-full bg-black/40 border border-white/20 p-2 rounded text-white"
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
                <input
                  type="number"
                  className="w-full bg-black/40 border border-white/20 p-2 rounded text-white"
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
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded font-bold text-gray-300"
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

// --- NEW COMPONENT: STAFF MANAGEMENT (With Search & Status Edit) ---
const StaffManagementTab = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    role: "TENANT_STAFF",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  // Search Logic
  useEffect(() => {
    if (!search) setFilteredStaff(staff);
    else
      setFilteredStaff(
        staff.filter((s) =>
          s.email.toLowerCase().includes(search.toLowerCase()),
        ),
      );
  }, [search, staff]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getAllStaff();
      setStaff(res.data);
      setFilteredStaff(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tenantService.createTenantUser(
        newStaff.email,
        newStaff.password,
        newStaff.role,
      );
      toast.success("Staff Created");
      setIsCreateOpen(false);
      setNewStaff({ email: "", password: "", role: "TENANT_STAFF" });
      fetchStaff();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error");
    }
  };

  const changeStatus = async (email, status) => {
    if (!confirm(`Change status to ${status}?`)) return;
    try {
      await tenantService.updateUserStatus(email, status);
      toast.success("Status Updated");
      fetchStaff();
    } catch (e) {
      toast.error("Error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-white flex items-center gap-2">
          <UserPlus className="text-yellow-500" /> Staff & Team
        </h2>
        <div className="flex gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search staff..."
              className="bg-black/40 border border-white/20 p-2 pl-3 rounded text-white text-sm focus:border-yellow-500 outline-none w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <GoldButton
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add New
          </GoldButton>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredStaff.map((s) => (
                <tr
                  key={s.tenant_user_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white font-medium">{s.email}</td>
                  <td className="p-4">
                    <span className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300 font-mono">
                      {s.role || "TENANT_ADMIN"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        s.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      {s.status !== "ACTIVE" ? (
                        <button
                          onClick={() => changeStatus(s.email, "ACTIVE")}
                          className="text-green-400 hover:bg-green-500/10 p-1 rounded font-bold text-xs"
                        >
                          ACTIVATE
                        </button>
                      ) : (
                        <button
                          onClick={() => changeStatus(s.email, "SUSPENDED")}
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded font-bold text-xs"
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

      {/* CREATE STAFF MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-md animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">
              Add Team Member
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Role
                </label>
                <select
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                >
                  <option value="TENANT_STAFF">Staff</option>
                  <option value="TENANT_ADMIN">Admin</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Email
                </label>
                <input
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Password
                </label>
                <input
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                  type="password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded font-bold text-gray-300"
                >
                  Cancel
                </button>
                <GoldButton type="submit" className="flex-1">
                  Create Member
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const PlayerApprovalsTab = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getPendingPlayers();
      setPending(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (id, status) => {
    if (!confirm(`${status} this player's KYC?`)) return;
    try {
      await tenantService.reviewPlayerKYC(id, status);
      toast.success(`Player ${status}`);
      fetchPending();
    } catch (e) {
      toast.error("Error updating status");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display text-white mb-6 flex items-center gap-2">
        <Shield className="text-yellow-500" /> Pending Approvals
      </h2>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Player</th>
              <th className="p-4">Submitted At</th>
              <th className="p-4">Document</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : pending.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No pending requests.
                </td>
              </tr>
            ) : (
              pending.map((p) => (
                <tr
                  key={p.player_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-white">{p.username}</div>
                    <div className="text-xs text-gray-500">{p.email}</div>
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-xs">
                    {new Date(p.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <a
                      href={p.document_url || "#"}
                      target="_blank"
                      rel="noreferrer"
                      className="text-yellow-500 hover:underline flex items-center gap-1"
                    >
                      <FileText size={14} /> View Doc
                    </a>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleReview(p.player_id, "APPROVED")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-xs font-bold uppercase"
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReview(p.player_id, "REJECTED")}
                        className="flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs font-bold uppercase"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantDashboard;
