import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import {
  DollarSign,
  Settings,
  Users,
  UserPlus,
  Lock,
  Shield,
  ShieldCheck,
  TrendingUp,
  LogOut,
  Inbox,
  Check,
  X,
  Building,
  MapPin,
  Coins,
  Menu,
  Gamepad2,
  PlayCircle,
  PauseCircle,
  Image as ImageIcon,
} from "lucide-react";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("kyc");
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // --- DATA LISTS ---
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);
  const [kycList, setKycList] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [gamesList, setGamesList] = useState([]); // [NEW] Games List

  // --- FORMS STATE ---
  const [rateForm, setRateForm] = useState({
    base: "USD",
    quote: "",
    rate: "",
  });
  const [currencyForm, setCurrencyForm] = useState({
    code: "",
    name: "",
    symbol: "",
    precision: 2,
  });
  const [countryForm, setCountryForm] = useState({
    name: "",
    iso2: "",
    iso3: "",
    currency: "",
  });
  const [tenantForm, setTenantForm] = useState({
    tenant_name: "",
    country_id: "",
    currency_code: "",
    admin_email: "",
    admin_password: "",
    kyc_id: "",
  });
  const [newAdminForm, setNewAdminForm] = useState({ email: "", password: "" });
  const [adminStatusForm, setAdminStatusForm] = useState({
    email: "",
    status: "SUSPENDED",
  });
  const [passwordForm, setPasswordForm] = useState({ old: "", new: "" });

  // [NEW] Game Form State
  const [gameForm, setGameForm] = useState({
    title: "",
    game_type: "SLOT",
    default_thumbnail_url: "",
    video_url: "", // <--- 1. ADD STATE
    provider: "",
  });
  const [earningsData, setEarningsData] = useState({ total: 0, breakdown: [] });
  const [earningsFilters, setEarningsFilters] = useState({
    groupBy: "TENANT", // 'TENANT' or 'GAME'
    timeRange: "1M", // '1D', '1W', '1M', 'CUSTOM'
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);
  useEffect(() => {
    if (activeTab === "earnings") fetchData();
  }, [earningsFilters, activeTab]);
  useEffect(() => {
    if (activeTab === "platform-games") {
      fetchPlatformGames();
    }
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (["rates", "countries", "currencies", "tenants"].includes(activeTab)) {
        const [cRes, countryRes] = await Promise.all([
          adminService.getCurrencies(),
          adminService.getCountries
            ? adminService.getCountries()
            : { data: [] },
        ]);
        setCurrencies(cRes.data);
        setCountries(countryRes.data || []);
      }
      if (activeTab === "kyc") {
        const kRes = await adminService.getPendingKYC();
        setKycList(kRes.data);
      }
      // [NEW] Fetch Games
      if (activeTab === "platform-games") {
        // Assuming adminService.getPlatformGames() exists
        const gRes = await adminService.getPlatformGames();
        // Sort: Active games first, then by title
        const sortedGames = gRes.data.sort((a, b) => {
          if (a.is_active === b.is_active) return 0;
          return a.is_active ? -1 : 1;
        });
        setGamesList(sortedGames);
      }
      if (activeTab === "earnings") {
        const filters = {
          group_by: earningsFilters.groupBy,
          time_range: earningsFilters.timeRange,
        };
        if (earningsFilters.timeRange === "CUSTOM") {
          filters.start_date = earningsFilters.startDate;
          filters.end_date = earningsFilters.endDate;
        }

        const eRes = await adminService.getPlatformEarnings(filters);
        setEarningsData({
          total: eRes.data.total_earnings,
          breakdown: eRes.data.breakdown,
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlatformGames = async () => {
    try {
      const res = await adminService.getPlatformGames();
      setGamesList(res.data);
    } catch (err) {
      console.error("Failed to fetch games", err);
      toast.error("Could not load game library");
    }
  };

  // --- HANDLERS ---
  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (
      !window.confirm("Are you sure you want to manually create this casino?")
    )
      return;
    try {
      await adminService.createTenant({
        ...tenantForm,
        country_id: parseInt(tenantForm.country_id),
        kyc_id: tenantForm.kyc_id || null,
      });
      toast.success("Success: New Tenant & Admin Created!");
      setTenantForm({
        tenant_name: "",
        country_id: "",
        currency_code: "",
        admin_email: "",
        admin_password: "",
        kyc_id: "",
      });
    } catch (err) {
      toast.error("Failed: " + (err.response?.data?.detail || err.message));
    }
  };
  const handleKYCAction = async (tenantId, action) => {
    const msg =
      action === "approve" ? "Approve & Activate?" : "Reject Application?";
    if (!window.confirm(msg)) return;
    try {
      if (action === "approve") await adminService.approveKYC(tenantId);
      else await adminService.rejectKYC(tenantId, "Admin Rejected");
      setKycList((prev) => prev.filter((i) => i.tenant_id !== tenantId));
    } catch (err) {
      toast.error("Failed: " + err.message);
    }
  };
  const handleSaveRate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createExchangeRate({
        base_currency: rateForm.base,
        quote_currency: rateForm.quote,
        rate: parseFloat(rateForm.rate),
      });
      toast.success("Rate Saved!");
      setRateForm({ ...rateForm, rate: "" });
    } catch (err) {
      toast.error("Failed: " + err.message);
    }
  };
  const handleCreateCurrency = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCurrency({
        currency_code: currencyForm.code,
        currency_name: currencyForm.name,
        symbol: currencyForm.symbol,
        decimal_precision: parseInt(currencyForm.precision),
      });
      toast.success("Currency Added!");
      setCurrencyForm({ code: "", name: "", symbol: "$", precision: 2 });
      fetchData();
    } catch (err) {
      toast.error("Failed: " + err.message);
    }
  };
  const handleCreateCountry = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCountry({
        country_name: countryForm.name,
        iso2_code: countryForm.iso2,
        iso3_code: countryForm.iso3,
        default_currency_code: countryForm.currency,
        default_timezone: "UTC",
      });
      toast.success("Country Added!");
      setCountryForm({ name: "", iso2: "", iso3: "", currency: "" });
      fetchData();
    } catch (err) {
      toast.error("Failed: " + err.message);
    }
  };
  const handleCreateSuperAdmin = async (e) => {
    e.preventDefault();
    if (!window.confirm("Grant FULL SUPER ADMIN access to this user?")) return;
    try {
      await adminService.createSuperAdmin(
        newAdminForm.email,
        newAdminForm.password,
      );
      toast.success("New Super Admin Created!");
      setNewAdminForm({ email: "", password: "" });
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };
  const handleUpdateAdminStatus = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateSuperAdminStatus(
        adminStatusForm.email,
        adminStatusForm.status,
      );
      toast.success("Admin Status Updated!");
      setAdminStatusForm({ email: "", status: "SUSPENDED" });
    } catch (err) {
      toast.error("Error: " + err.message);
    }
  };
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateMyPassword(passwordForm.old, passwordForm.new);
      toast.success("Password Updated Successfully! Please login again.");
      handleLogout();
    } catch (err) {
      toast.error("Error: " + (err.response?.data?.detail || err.message));
    }
  };
  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  // [NEW] Game Handlers
  const handleCreateGame = async (e) => {
    e.preventDefault();
    try {
      const res = await adminService.addPlatformGame(gameForm);
      toast.success("Game added to library!");
      setGamesList([res.data, ...gamesList]);
      setGameForm({
        title: "",
        game_type: "SLOT",
        default_thumbnail_url: "",
        video_url: "", // <--- RESET STATE
        provider: "",
      });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed to add game");
    }
  };

  // 3. Handle Toggle Status
  const handleToggleGameStatus = async (gameId, currentStatus) => {
    try {
      await adminService.togglePlatformGame(gameId, !currentStatus);

      // Update local state to reflect change immediately
      setGamesList(
        gamesList.map((g) =>
          g.platform_game_id === gameId
            ? { ...g, is_active: !currentStatus }
            : g,
        ),
      );

      toast.success(currentStatus ? "Game Disabled" : "Game Activated");
    } catch (err) {
      toast.error("Failed to update status");
    }
  };
  return (
    <div className="flex h-screen bg-[#040029] text-white overflow-hidden">
      {/* 1. MOBILE HEADER */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#040029] border-b border-white/10 flex items-center px-4 z-40 justify-between">
        <span className="text-xl font-display text-casino-gold tracking-wider">
          SUPER ADMIN
        </span>
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-white p-2 hover:bg-white/10 rounded"
          >
            <Menu />
          </button>
        )}
      </div>

      {/* 2. MOBILE OVERLAY */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-[#040029] z-30 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* 3. SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#040029] border-r border-white/10 p-6 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:bg-[#040029] ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-display text-casino-gold hidden md:block">
            SUPER ADMIN
          </h1>
          <span className="md:hidden text-casino-gold font-display text-xl">
            MENU
          </span>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white p-1"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto">
          <SidebarItem
            icon={<ShieldCheck size={20} />}
            label="KYC Requests"
            active={activeTab === "kyc"}
            onClick={() => setActiveTab("kyc")}
          />
          <SidebarItem
            icon={<Building size={20} />}
            label="Add Tenant"
            active={activeTab === "tenants"}
            onClick={() => setActiveTab("tenants")}
          />

          {/* [NEW] Games Item */}
          <SidebarItem
            icon={<Gamepad2 size={20} />}
            label="Platform Games"
            active={activeTab === "platform-games"}
            onClick={() => setActiveTab("platform-games")}
          />

          <SidebarItem
            icon={<DollarSign size={20} />}
            label="Exchange Rates"
            active={activeTab === "rates"}
            onClick={() => setActiveTab("rates")}
          />
          <SidebarItem
            icon={<Coins size={20} />}
            label="Currencies"
            active={activeTab === "currencies"}
            onClick={() => setActiveTab("currencies")}
          />
          <SidebarItem
            icon={<MapPin size={20} />}
            label="Countries"
            active={activeTab === "countries"}
            onClick={() => setActiveTab("countries")}
          />
          <SidebarItem
            icon={<TrendingUp size={20} />}
            label="Earnings"
            active={activeTab === "earnings"}
            onClick={() => setActiveTab("earnings")}
          />

          <div className="pt-4 pb-2 border-t border-white/10 mt-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
            Admin Management
          </div>
          <SidebarItem
            icon={<UserPlus size={20} />}
            label="Create Admin"
            active={activeTab === "create-admin"}
            onClick={() => setActiveTab("create-admin")}
          />
          <SidebarItem
            icon={<Users size={20} />}
            label="Manage Access"
            active={activeTab === "manage-access"}
            onClick={() => setActiveTab("manage-access")}
          />
          <SidebarItem
            icon={<Lock size={20} />}
            label="My Password"
            active={activeTab === "change-password"}
            onClick={() => setActiveTab("change-password")}
          />
        </nav>
        <button
          onClick={handleLogout}
          className="flex items-center text-casino-red mt-6 pt-4 border-t border-white/10 gap-2 hover:underline"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full">
        {/* ... (Existing Tabs: kyc, tenants, rates, currencies, countries, earnings, create-admin, manage-access, change-password) ... */}
        {activeTab === "kyc" && (
          <div>
            <h2 className="text-2xl md:text-3xl font-display mb-6">
              Pending KYC Requests
            </h2>
            {kycList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white/5 rounded border border-white/10">
                <Inbox size={48} className="mb-4 opacity-50" />
                <p>No pending approvals.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {kycList.map((t) => (
                  <div
                    key={t.tenant_id}
                    className="bg-white/5 p-4 md:p-5 rounded border border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
                  >
                    <div>
                      <h4 className="font-bold text-lg">{t.tenant_name}</h4>
                      <a
                        href={t.document_reference}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-casino-gold underline block mt-1"
                      >
                        View Document
                      </a>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <button
                        onClick={() => handleKYCAction(t.tenant_id, "approve")}
                        className="flex-1 md:flex-none justify-center p-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 flex items-center gap-2"
                      >
                        <Check size={18} />{" "}
                        <span className="md:hidden">Approve</span>
                      </button>
                      <button
                        onClick={() => handleKYCAction(t.tenant_id, "reject")}
                        className="flex-1 md:flex-none justify-center p-2 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 flex items-center gap-2"
                      >
                        <X size={18} />{" "}
                        <span className="md:hidden">Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "platform-games" && (
          <div className="max-w-6xl mx-auto mt-2 md:mt-[40px]">
            {/* 1. Add Game Form */}
            <div className="bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30 mb-8">
              <h2 className="text-2xl font-display text-casino-gold mb-6 flex items-center gap-2">
                <Gamepad2 /> Add Platform Game
              </h2>
              <form onSubmit={handleCreateGame} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Game Title"
                    required
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={gameForm.title}
                    onChange={(e) =>
                      setGameForm({ ...gameForm, title: e.target.value })
                    }
                  />
                  <select
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-gray-300"
                    value={gameForm.game_type}
                    onChange={(e) =>
                      setGameForm({ ...gameForm, game_type: e.target.value })
                    }
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
                    <option value="DICE" className="bg-[#040029]">
                      DICE
                    </option>
                    <option value="WHEEL" className="bg-[#040029]">
                      WHEEL
                    </option>
                    <option value="COIN" className="bg-[#040029]">
                      COIN
                    </option>
                    <option value="HIGHLOW" className="bg-[#040029]">
                      HIGHLOW
                    </option>
                  </select>
                </div>

                {/* ROW 2: Thumbnail & Provider */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Thumbnail URL (Image)"
                    required
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={gameForm.default_thumbnail_url}
                    onChange={(e) =>
                      setGameForm({
                        ...gameForm,
                        default_thumbnail_url: e.target.value,
                      })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Provider (e.g. Royal Studios)"
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={gameForm.provider}
                    onChange={(e) =>
                      setGameForm({ ...gameForm, provider: e.target.value })
                    }
                  />
                </div>

                {/* ROW 3: Video URL (NEW) */}
                <div>
                  <input
                    type="text"
                    placeholder="Video URL (MP4/WebM) - Optional"
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={gameForm.video_url}
                    onChange={(e) =>
                      setGameForm({ ...gameForm, video_url: e.target.value })
                    }
                  />
                  <p className="text-[10px] text-gray-500 mt-1">
                    Leave empty to use the default video for this game type.
                  </p>
                </div>

                <GoldButton fullWidth type="submit">
                  Add to Library
                </GoldButton>
              </form>
            </div>

            {/* 2. Games List */}
            <h3 className="text-xl font-bold mb-4 text-white">
              Game Library ({gamesList.length})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {gamesList.map((game) => (
                <div
                  key={game.platform_game_id}
                  className={`p-4 rounded-xl border flex gap-4 transition-all ${
                    game.is_active
                      ? "bg-[#040029] border-white/10 hover:border-casino-gold"
                      : "bg-black/40 border-red-900/30 opacity-60"
                  }`}
                >
                  <div className="w-20 h-20 rounded bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                    {game.default_thumbnail_url ? (
                      <img
                        src={game.default_thumbnail_url}
                        alt={game.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={24} className="text-gray-600" />
                    )}
                  </div>
                  <div className="flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-bold text-white text-lg leading-tight">
                        {game.title}
                      </h4>
                      <div className="flex gap-2 mt-1">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-gray-300 uppercase">
                          {game.game_type}
                        </span>
                        <span className="text-[10px] text-gray-500 uppercase">
                          {game.provider}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() =>
                          handleToggleGameStatus(
                            game.platform_game_id,
                            game.is_active,
                          )
                        }
                        className={`flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded transition-colors ${
                          game.is_active
                            ? "bg-green-500/20 text-green-400 hover:bg-red-500/20 hover:text-red-400"
                            : "bg-red-500/20 text-red-400 hover:bg-green-500/20 hover:text-green-400"
                        }`}
                      >
                        {game.is_active ? (
                          <>
                            <PauseCircle size={12} /> Active
                          </>
                        ) : (
                          <>
                            <PlayCircle size={12} /> Inactive
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "tenants" && (
          <div className="max-w-2xl mx-auto mt-2 md:mt-[80px]">
            <div className="bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30 shadow-[0_0_50px_rgba(234,179,8,0.1)]">
              <h2 className="text-2xl md:text-3xl font-display text-casino-gold mb-6 flex items-center gap-2">
                <Building size={28} /> Create New Casino
              </h2>
              <form onSubmit={handleCreateTenant} className="space-y-6">
                <div>
                  <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                    Casino Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full bg-black/40 border border-white/20 p-3 md:p-4 rounded text-white"
                    value={tenantForm.tenant_name}
                    onChange={(e) =>
                      setTenantForm({
                        ...tenantForm,
                        tenant_name: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Location (Country)
                    </label>
                    <select
                      required
                      className="w-full bg-black/40 border border-white/20 p-3 md:p-4 rounded text-gray-300"
                      value={tenantForm.country_id}
                      onChange={(e) =>
                        setTenantForm({
                          ...tenantForm,
                          country_id: e.target.value,
                        })
                      }
                    >
                      <option value="" className="bg-[#040029]">
                        Select Country
                      </option>
                      {countries.map((c) => (
                        <option
                          key={c.country_id}
                          value={c.country_id}
                          className="bg-[#040029]"
                        >
                          {c.country_name} ({c.iso3_code})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Primary Currency
                    </label>
                    <select
                      required
                      className="w-full bg-black/40 border border-white/20 p-3 md:p-4 rounded text-gray-300"
                      value={tenantForm.currency_code}
                      onChange={(e) =>
                        setTenantForm({
                          ...tenantForm,
                          currency_code: e.target.value,
                        })
                      }
                    >
                      <option value="" className="bg-[#040029]">
                        Select Currency
                      </option>
                      {currencies.map((c) => (
                        <option
                          key={c.currency_code}
                          value={c.currency_code}
                          className="bg-[#040029]"
                        >
                          {c.currency_code} ({c.currency_name})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Admin Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full bg-black/40 border border-white/20 p-3 md:p-4 rounded text-white"
                      value={tenantForm.admin_email}
                      onChange={(e) =>
                        setTenantForm({
                          ...tenantForm,
                          admin_email: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">
                      Password
                    </label>
                    <InputField
                      type="password"
                      required
                      className="w-full bg-black/40 border border-white/20 p-6 md:p-4 rounded text-white"
                      value={tenantForm.admin_password}
                      onChange={(e) =>
                        setTenantForm({
                          ...tenantForm,
                          admin_password: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>
                <GoldButton fullWidth type="submit" size="lg">
                  Launch Casino
                </GoldButton>
              </form>
            </div>
          </div>
        )}
        {activeTab === "rates" && (
          <div className="max-w-2xl mx-auto mt-8 md:mt-[80px]">
            <div className="bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30">
              <h2 className="text-xl text-casino-gold mb-6">
                Update Exchange Rates
              </h2>
              <form onSubmit={handleSaveRate} className="space-y-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <select
                    className="bg-black/40 border border-white/20 p-3 rounded w-full md:w-1/3 text-gray-300"
                    value={rateForm.base}
                    onChange={(e) =>
                      setRateForm({ ...rateForm, base: e.target.value })
                    }
                  >
                    {currencies.map((c) => (
                      <option
                        key={c.currency_code}
                        value={c.currency_code}
                        className="bg-[#040029]"
                      >
                        {c.currency_code}
                      </option>
                    ))}
                  </select>
                  <select
                    className="bg-black/40 border border-white/20 p-3 rounded w-full md:w-1/3 text-gray-300"
                    value={rateForm.quote}
                    onChange={(e) =>
                      setRateForm({ ...rateForm, quote: e.target.value })
                    }
                  >
                    <option value="" className="bg-[#040029]">
                      To Currency
                    </option>
                    {currencies.map((c) => (
                      <option
                        key={c.currency_code}
                        value={c.currency_code}
                        className="bg-[#040029]"
                      >
                        {c.currency_code}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    step="0.0001"
                    placeholder="Rate"
                    className="bg-black/40 border border-white/20 p-3 rounded w-full md:w-1/3 text-white"
                    value={rateForm.rate}
                    onChange={(e) =>
                      setRateForm({ ...rateForm, rate: e.target.value })
                    }
                  />
                </div>
                <GoldButton fullWidth type="submit">
                  Update Rate
                </GoldButton>
              </form>
            </div>
          </div>
        )}
        {activeTab === "currencies" && (
          <div className="max-w-2xl mx-auto mt-8 md:mt-[80px]">
            <div className="bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30">
              <h3 className="text-xl text-casino-gold mb-6 flex items-center gap-2">
                <Coins /> Add Global Currency
              </h3>
              <form onSubmit={handleCreateCurrency} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Code (e.g. INR)"
                    className="bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={currencyForm.code}
                    onChange={(e) =>
                      setCurrencyForm({ ...currencyForm, code: e.target.value })
                    }
                    maxLength={3}
                    required
                  />
                  <input
                    type="text"
                    placeholder="Symbol (e.g. ₹)"
                    className="bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={currencyForm.symbol}
                    onChange={(e) =>
                      setCurrencyForm({
                        ...currencyForm,
                        symbol: e.target.value,
                      })
                    }
                  />
                </div>
                <input
                  type="text"
                  placeholder="Name (e.g. Indian Rupee)"
                  className="bg-black/40 border border-white/20 p-3 rounded w-full text-white"
                  value={currencyForm.name}
                  onChange={(e) =>
                    setCurrencyForm({ ...currencyForm, name: e.target.value })
                  }
                  required
                />
                <GoldButton fullWidth type="submit">
                  Create Currency
                </GoldButton>
              </form>
              <div className="mt-8 border-t border-white/10 pt-4">
                <h4 className="text-gray-400 mb-2 text-sm">
                  Existing Currencies
                </h4>
                <div className="flex flex-wrap gap-2">
                  {currencies.map((c) => (
                    <span
                      key={c.currency_code}
                      className="px-3 py-1 bg-white/10 rounded text-xs"
                    >
                      {c.currency_code}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "countries" && (
          <div className="max-w-2xl mx-auto mt-8 md:mt-[80px]">
            <div className="bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30">
              <h3 className="text-xl text-casino-gold mb-6 flex items-center gap-2">
                <MapPin /> Add Supported Country
              </h3>
              <form onSubmit={handleCreateCountry} className="space-y-4">
                <input
                  type="text"
                  placeholder="Country Name"
                  className="bg-black/40 border border-white/20 p-3 rounded w-full text-white"
                  value={countryForm.name}
                  onChange={(e) =>
                    setCountryForm({ ...countryForm, name: e.target.value })
                  }
                  required
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="ISO2 (e.g. IN)"
                    className="bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={countryForm.iso2}
                    onChange={(e) =>
                      setCountryForm({ ...countryForm, iso2: e.target.value })
                    }
                    maxLength={2}
                    required
                  />
                  <input
                    type="text"
                    placeholder="ISO3 (e.g. IND)"
                    className="bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={countryForm.iso3}
                    onChange={(e) =>
                      setCountryForm({ ...countryForm, iso3: e.target.value })
                    }
                    maxLength={3}
                    required
                  />
                </div>
                <select
                  className="bg-black/40 border border-white/20 p-3 rounded w-full text-gray-300"
                  value={countryForm.currency}
                  onChange={(e) =>
                    setCountryForm({ ...countryForm, currency: e.target.value })
                  }
                  required
                >
                  {currencies.map((c) => (
                    <option
                      key={c.currency_code}
                      value={c.currency_code}
                      className="bg-[#040029]"
                    >
                      {c.currency_code}
                    </option>
                  ))}
                </select>
                <GoldButton fullWidth type="submit">
                  Create Country
                </GoldButton>
              </form>
              <div className="mt-8 border-t border-white/10 pt-4">
                <h4 className="text-gray-400 mb-2 text-sm">
                  Supported Countries
                </h4>
                <div className="flex flex-wrap gap-2">
                  {countries.map((c) => (
                    <span
                      key={c.country_id}
                      className="px-3 py-1 bg-white/10 rounded text-xs"
                    >
                      {c.country_name}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "earnings" && (
          <div className="max-w-5xl mx-auto mt-2 md:mt-[40px]">
            <div className="flex flex-col md:flex-row gap-6 mb-8">
              {/* 1. Summary Card */}
              <div className="bg-gradient-to-br from-yellow-900/40 to-black border border-casino-gold/30 p-6 rounded-xl flex-1 flex items-center justify-between">
                <div>
                  <h3 className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-1">
                    Total Platform Revenue
                  </h3>
                  <div className="text-4xl font-mono font-bold text-casino-gold text-shadow-glow">
                    ${earningsData.total?.toFixed(4)}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    0.1% Commission on all bets
                  </p>
                </div>
                <div className="p-4 bg-black/40 rounded-full border border-white/10">
                  <DollarSign size={32} className="text-yellow-500" />
                </div>
              </div>

              {/* 2. Filters Panel */}
              <div className="bg-[#040029] border border-casino-gold/30 p-6 rounded-xl flex-[2]">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Settings size={16} /> Report Filters
                </h3>

                <div className="flex flex-wrap gap-4">
                  {/* Group By Toggle */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">
                      Group By
                    </label>
                    <div className="flex bg-[#040029] rounded p-1 border border-white/10">
                      <button
                        onClick={() =>
                          setEarningsFilters({
                            ...earningsFilters,
                            groupBy: "TENANT",
                          })
                        }
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${earningsFilters.groupBy === "TENANT" ? "bg-white/20 text-white" : "text-gray-500 hover:text-white"}`}
                      >
                        Tenant
                      </button>
                      <button
                        onClick={() =>
                          setEarningsFilters({
                            ...earningsFilters,
                            groupBy: "GAME",
                          })
                        }
                        className={`px-3 py-1 rounded text-xs font-bold transition-all ${earningsFilters.groupBy === "GAME" ? "bg-white/20 text-white" : "text-gray-500 hover:text-white"}`}
                      >
                        Game
                      </button>
                    </div>
                  </div>

                  {/* Time Range Select */}
                  <div>
                    <label className="text-[10px] text-gray-500 uppercase block mb-1">
                      Time Range
                    </label>
                    <select
                      className="bg-[#040029] border border-white/10 text-white text-xs p-2 rounded w-32 outline-none focus:border-casino-gold"
                      value={earningsFilters.timeRange}
                      onChange={(e) =>
                        setEarningsFilters({
                          ...earningsFilters,
                          timeRange: e.target.value,
                        })
                      }
                    >
                      <option value="1D">Last 24 Hours</option>
                      <option value="1W">Last 7 Days</option>
                      <option value="1M">Last 30 Days</option>
                      <option value="CUSTOM">Custom Range</option>
                    </select>
                  </div>

                  {/* Custom Date Pickers */}
                  {earningsFilters.timeRange === "CUSTOM" && (
                    <div className="flex gap-2">
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase block mb-1">
                          Start
                        </label>
                        <input
                          type="date"
                          className="bg-black/40 border border-white/10 text-white text-xs p-1.5 rounded [color-scheme:dark]"
                          value={earningsFilters.startDate}
                          onChange={(e) =>
                            setEarningsFilters({
                              ...earningsFilters,
                              startDate: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 uppercase block mb-1">
                          End
                        </label>
                        <input
                          type="date"
                          className="bg-black/40 border border-white/10 text-white text-xs p-1.5 rounded [color-scheme:dark]"
                          value={earningsFilters.endDate}
                          onChange={(e) =>
                            setEarningsFilters({
                              ...earningsFilters,
                              endDate: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 3. Data Table */}
            <div className="bg-[#040029] rounded-xl border border-casino-gold/30 overflow-hidden">
              <div className="p-4 bg-[#040029] border-b border-white/10 flex justify-between items-center">
                <h3 className="font-bold text-white flex items-center gap-2">
                  {earningsFilters.groupBy === "TENANT" ? (
                    <Building size={16} />
                  ) : (
                    <Gamepad2 size={16} />
                  )}
                  Earnings Breakdown
                </h3>
              </div>

              {earningsData.breakdown.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  No data found for this period.
                </div>
              ) : (
                <table className="w-full text-left">
                  <thead className="bg-white/5 text-xs text-gray-400 uppercase font-bold">
                    <tr>
                      <th className="p-4">
                        {earningsFilters.groupBy === "TENANT"
                          ? "Tenant Name"
                          : "Game Title"}
                      </th>
                      <th className="p-4 text-right">Total Bets Count</th>
                      <th className="p-4 text-right text-casino-gold">
                        Commission (0.1%)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {earningsData.breakdown.map((row, idx) => (
                      <tr
                        key={idx}
                        className="hover:bg-white/10 transition-colors"
                      >
                        <td className="p-4 text-sm font-bold text-white">
                          {row.label}
                        </td>
                        <td className="p-4 text-sm text-right text-gray-400">
                          {row.total_bets}
                        </td>
                        <td className="p-4 text-sm text-right font-mono text-yellow-500 font-bold">
                          ${row.earnings.toFixed(4)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
        {activeTab === "create-admin" && (
          <div className="max-w-xl mx-auto bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30 mt-10">
            <h2 className="text-xl font-display text-casino-gold mb-6 flex items-center gap-2">
              <UserPlus /> Create Super Admin
            </h2>
            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded mb-4 text-sm text-red-200">
              <Shield className="inline w-4 h-4 mr-1" /> Warning: This user will
              have full system access.
            </div>
            <form onSubmit={handleCreateSuperAdmin} className="space-y-4">
              <input
                type="email"
                placeholder="Email Address"
                className="w-full bg-black/40 border border-white/10 p-3 rounded text-white"
                value={newAdminForm.email}
                onChange={(e) =>
                  setNewAdminForm({ ...newAdminForm, email: e.target.value })
                }
                required
              />
              <InputField
                label="Password"
                name="password"
                type="password"
                placeholder="Password"
                className="w-full bg-black border border-white/20 p-3 rounded text-white"
                value={newAdminForm.password}
                onChange={(e) =>
                  setNewAdminForm({ ...newAdminForm, password: e.target.value })
                }
                required
              />
              <GoldButton fullWidth type="submit">
                Create Admin
              </GoldButton>
            </form>
          </div>
        )}
        {activeTab === "manage-access" && (
          <div className="max-w-xl mx-auto bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30 mt-10">
            <h2 className="text-xl font-display text-casino-gold mb-6 flex items-center gap-2">
              <Settings /> Manage Admin Access
            </h2>
            <p className="text-sm text-gray-400 mb-6">
              Revoke access for other Super Admins.
            </p>
            <form onSubmit={handleUpdateAdminStatus} className="space-y-4">
              <input
                type="email"
                placeholder="Target Admin Email"
                className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                value={adminStatusForm.email}
                onChange={(e) =>
                  setAdminStatusForm({
                    ...adminStatusForm,
                    email: e.target.value,
                  })
                }
                required
              />
              <div>
                <label className="text-xs text-gray-500 uppercase mb-1 block">
                  Status
                </label>
                <select
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-gray-300"
                  value={adminStatusForm.status}
                  onChange={(e) =>
                    setAdminStatusForm({
                      ...adminStatusForm,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="ACTIVE" className="bg-[#040029]">
                    Active
                  </option>
                  <option value="SUSPENDED" className="bg-[#040029]">
                    Suspended
                  </option>
                  <option value="TERMINATED" className="bg-[#040029]">
                    Terminated
                  </option>
                </select>
              </div>
              <button className="w-full py-3 rounded font-bold uppercase tracking-wider bg-red-900/40 text-red-400 border border-red-900 hover:bg-red-900/60 transition-colors">
                Update Status
              </button>
            </form>
          </div>
        )}
        {activeTab === "change-password" && (
          <div className="max-w-xl mx-auto bg-[#040029] p-6 md:p-8 rounded border border-casino-gold/30 mt-10">
            <h2 className="text-xl font-display text-casino-gold mb-6 flex items-center gap-2">
              <Lock /> Change My Password
            </h2>
            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <InputField
                label="Password"
                name="password"
                type="password"
                placeholder="Current Password"
                className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                value={passwordForm.old}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, old: e.target.value })
                }
                required
              />
              <InputField
                label="Password"
                name="password"
                type="password"
                placeholder="New Password"
                className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                value={passwordForm.new}
                onChange={(e) =>
                  setPasswordForm({ ...passwordForm, new: e.target.value })
                }
                required
              />
              <GoldButton fullWidth type="submit">
                Update Password
              </GoldButton>
            </form>
          </div>
        )}
      </main>
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

export default SuperAdminDashboard;
