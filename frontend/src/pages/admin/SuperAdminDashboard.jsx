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
  Plus,
  Edit2,
  Search,
  Filter,
} from "lucide-react";

// --- MAIN DASHBOARD COMPONENT ---
const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("kyc"); // Default Tab
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Common Data State
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    // Fetch common dropdown data once
    const fetchCommon = async () => {
      try {
        const [cRes, cntRes] = await Promise.all([
          adminService.getCurrencies(),
          adminService.getCountries
            ? adminService.getCountries()
            : { data: [] },
        ]);
        setCurrencies(cRes.data);
        setCountries(cntRes.data || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchCommon();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

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
          SUPER ADMIN
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
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#040029] border-r border-white/10 p-6 flex flex-col transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-display text-casino-gold hidden md:block">
            SUPER ADMIN
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-3 overflow-y-auto custom-scrollbar pr-2">
          <SidebarItem
            icon={<ShieldCheck size={20} />}
            label="KYC Requests"
            active={activeTab === "kyc"}
            onClick={() => changeTab("kyc")}
          />
          <SidebarItem
            icon={<Building size={20} />}
            label="Tenants"
            active={activeTab === "tenants"}
            onClick={() => changeTab("tenants")}
          />
          <SidebarItem
            icon={<Gamepad2 size={20} />}
            label="Platform Games"
            active={activeTab === "platform-games"}
            onClick={() => changeTab("platform-games")}
          />
          <SidebarItem
            icon={<TrendingUp size={20} />}
            label="Earnings"
            active={activeTab === "earnings"}
            onClick={() => changeTab("earnings")}
          />

          <div className="pt-4 pb-2 border-t border-white/10 mt-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
            Configuration
          </div>
          <SidebarItem
            icon={<DollarSign size={20} />}
            label="Exchange Rates"
            active={activeTab === "rates"}
            onClick={() => changeTab("rates")}
          />
          <SidebarItem
            icon={<Coins size={20} />}
            label="Currencies"
            active={activeTab === "currencies"}
            onClick={() => changeTab("currencies")}
          />
          <SidebarItem
            icon={<MapPin size={20} />}
            label="Countries"
            active={activeTab === "countries"}
            onClick={() => changeTab("countries")}
          />

          <div className="pt-4 pb-2 border-t border-white/10 mt-4 text-xs text-gray-500 font-bold uppercase tracking-wider">
            System
          </div>
          <SidebarItem
            icon={<Users size={20} />}
            label="Super Admins"
            active={activeTab === "admins"}
            onClick={() => changeTab("admins")}
          />
          <SidebarItem
            icon={<Lock size={20} />}
            label="My Password"
            active={activeTab === "change-password"}
            onClick={() => changeTab("change-password")}
          />
        </nav>

        <button
          onClick={handleLogout}
          className="flex items-center text-casino-red mt-6 pt-4 border-t border-white/10 gap-2 hover:underline w-full"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* 4. MAIN CONTENT AREA */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full bg-[#040029]">
        {activeTab === "kyc" && <KYCRequestsTab />}
        {activeTab === "tenants" && (
          <TenantManagementTab countries={countries} currencies={currencies} />
        )}
        {activeTab === "platform-games" && <PlatformGamesTab />}
        {activeTab === "earnings" && <EarningsTab />}
        {activeTab === "rates" && <ExchangeRatesTab currencies={currencies} />}
        {activeTab === "currencies" && (
          <CurrenciesTab currencies={currencies} />
        )}
        {activeTab === "countries" && <CountriesTab currencies={currencies} />}
        {activeTab === "admins" && <AdminManagementTab />}
        {activeTab === "change-password" && <ChangePasswordTab />}
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

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

const TenantManagementTab = ({ countries, currencies }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredTenants, setFilteredTenants] = useState([]);

  // State for Modals
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingGames, setViewingGames] = useState(null); // <--- NEW: For Games List

  const [form, setForm] = useState({
    tenant_name: "",
    country_id: "",
    currency_code: "",
    admin_email: "",
    admin_password: "",
    kyc_id: "",
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (!search) setFilteredTenants(tenants);
    else
      setFilteredTenants(
        tenants.filter((t) =>
          t.tenant_name.toLowerCase().includes(search.toLowerCase()),
        ),
      );
  }, [search, tenants]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllTenants();
      setTenants(res.data);
      setFilteredTenants(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!window.confirm("Manually create this casino?")) return;
    try {
      await adminService.createTenant({
        ...form,
        country_id: parseInt(form.country_id),
      });
      toast.success("Tenant Created!");
      setIsCreateOpen(false);
      setForm({
        tenant_name: "",
        country_id: "",
        currency_code: "",
        admin_email: "",
        admin_password: "",
        kyc_id: "",
      });
      fetchTenants();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error");
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    if (editingTenant.status === "TERMINATED") {
      if (!window.confirm("WARNING: Terminating a casino is severe. Continue?"))
        return;
    }

    try {
      await adminService.updateTenantStatus(
        editingTenant.tenant_id,
        editingTenant.status,
      );
      toast.success(`Tenant ${editingTenant.status}`);
      setEditingTenant(null);
      fetchTenants();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Update failed");
    }
  };

  // Helper to get game count safely
  const getGameCount = (gameString) => {
    if (!gameString) return 0;
    return gameString.split(",").length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-white flex items-center gap-2">
          <Building className="text-yellow-500" /> Manage Casinos
        </h2>
        <div className="flex gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search Casinos..."
              className="bg-black/40 border border-white/20 p-2 pl-8 rounded text-white text-sm focus:border-yellow-500 outline-none w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search
              className="absolute left-2 top-2.5 text-gray-400"
              size={14}
            />
          </div>
          <GoldButton
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Tenant
          </GoldButton>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Casino Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">KYC Status</th>
              <th className="p-4">Active Games</th>
              <th className="p-4 text-right">Account Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredTenants.map((t) => (
                <tr
                  key={t.tenant_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 font-bold text-white">{t.tenant_name}</td>
                  <td className="p-4 text-gray-300">{t.country_name}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        t.kyc_status === "APPROVED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {t.kyc_status}
                    </span>
                  </td>

                  {/* --- UPDATED: VIEW GAMES BUTTON --- */}
                  <td className="p-4">
                    {t.game_names ? (
                      <button
                        onClick={() => setViewingGames(t)}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/70 hover:cursor-pointer hover:text-black transition-all border border-yellow-500/20"
                      >
                        <Gamepad2
                          size={14}
                          className="group-hover:scale-110 transition-transform"
                        />
                        <span className="font-bold text-xs">
                          {getGameCount(t.game_names)} Games
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-600 text-xs italic">
                        No games active
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        t.status === "ACTIVE"
                          ? "bg-blue-500/20 text-blue-400"
                          : t.status === "SUSPENDED"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingTenant(t)}
                      className="p-1.5 bg-transparent rounded text-gray-300 transition-colors hover:text-yellow-600 hover:cursor-pointer"
                      title="Edit Status"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- MODAL 1: VIEW GAMES LIST --- */}
      {viewingGames && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500/50 w-full max-w-md animate-in zoom-in duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Gamepad2 className="text-yellow-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Active Games</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    {viewingGames.tenant_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingGames(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              <div className="flex flex-col gap-2">
                {viewingGames.game_names.split(",").map((game, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded hover:bg-white/20 border border-white/20 transition-colors"
                  >
                    <span className="text-xs font-mono text-gray-500 w-6 text-right">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {game.trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setViewingGames(null)}
                className="px-4 py-2 bg-black/40 hover:border-yellow-600 border border-white/20 text-white text-sm font-bold rounded transition-colors"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL 2: CREATE TENANT --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-2xl animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Register New Casino
              </h3>
              <button onClick={() => setIsCreateOpen(false)}>
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              {/* ... (Create Form Fields Same as Before) ... */}
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">
                  Casino Name
                </label>
                <input
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                  value={form.tenant_name}
                  onChange={(e) =>
                    setForm({ ...form, tenant_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Country
                  </label>
                  <select
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-gray-300"
                    value={form.country_id}
                    onChange={(e) =>
                      setForm({ ...form, country_id: e.target.value })
                    }
                    required
                  >
                    <option value="" className="bg-[#040029]">
                      Select
                    </option>
                    {countries.map((c) => (
                      <option
                        key={c.country_id}
                        value={c.country_id}
                        className="bg-[#040029]"
                      >
                        {c.country_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Currency
                  </label>
                  <select
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-gray-300"
                    value={form.currency_code}
                    onChange={(e) =>
                      setForm({ ...form, currency_code: e.target.value })
                    }
                    required
                  >
                    <option value="" className="bg-[#040029]">
                      Select
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
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Admin Email
                  </label>
                  <input
                    type="email"
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={form.admin_email}
                    onChange={(e) =>
                      setForm({ ...form, admin_email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                    value={form.admin_password}
                    onChange={(e) =>
                      setForm({ ...form, admin_password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <GoldButton fullWidth type="submit">
                Launch Casino
              </GoldButton>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL 3: EDIT STATUS --- */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-sm animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Manage Casino</h3>
              <button onClick={() => setEditingTenant(null)}>
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 uppercase text-xs mb-1">
                Casino
              </p>
              <p className="text-lg font-bold text-white">
                {editingTenant.tenant_name}
              </p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">
                  Account Status
                </label>
                <select
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
                  value={editingTenant.status}
                  onChange={(e) =>
                    setEditingTenant({
                      ...editingTenant,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="ACTIVE" className="bg-[#040029]">
                    ACTIVE (Normal Operation)
                  </option>
                  <option value="SUSPENDED" className="bg-[#040029]">
                    SUSPENDED (Temporary Lock)
                  </option>
                  <option value="TERMINATED" className="bg-[#040029]">
                    TERMINATED (Permanent Ban)
                  </option>
                </select>
              </div>

              {editingTenant.status === "TERMINATED" && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-xs flex gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <p>
                    Termination will disable the casino and all its admins/staff
                    immediately.
                  </p>
                </div>
              )}

              <GoldButton fullWidth type="submit">
                Update Status
              </GoldButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 2. ADMIN MANAGEMENT (Revised: Table + Edit Status)
const AdminManagementTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null); // { email, status }

  const [newAdmin, setNewAdmin] = useState({ email: "", password: "" });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllAdmins();
      setAdmins(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSuperAdmin(newAdmin.email, newAdmin.password);
      toast.success("Admin Created");
      setIsCreateOpen(false);
      setNewAdmin({ email: "", password: "" });
      fetchAdmins();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateSuperAdminStatus(
        editingStatus.email,
        editingStatus.status,
      );
      toast.success("Status Updated");
      setEditingStatus(null);
      fetchAdmins();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-white flex items-center gap-2">
          <Users className="text-yellow-500" /> Super Admins
        </h2>
        <GoldButton
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 text-sm"
        >
          <UserPlus size={16} /> Add Admin
        </GoldButton>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Created At</th>
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
              admins.map((a) => (
                <tr
                  key={a.super_admin_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white font-medium">{a.email}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        a.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingStatus(a)}
                      className="text-xs text-gray-300 hover:text-yellow-400 border border-white/20 hover:border-yellow-600 px-2 py-1 rounded hover:cursor-pointer"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE ADMIN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-md animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">
              Create Super Admin
            </h3>
            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded mb-4 text-sm text-red-200">
              <ShieldCheck className="inline w-4 h-4 mr-1" /> Full system access
              granted.
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <input
                className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                placeholder="Email"
                value={newAdmin.email}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, email: e.target.value })
                }
                required
              />
              <input
                className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
                required
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2 bg-black/40 rounded border border-white/20"
                >
                  Cancel
                </button>
                <GoldButton type="submit" className="flex-1">
                  Create
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-sm animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Update Access</h3>
            <p className="text-sm text-gray-400 mb-4">
              User: {editingStatus.email}
            </p>
            <form onSubmit={handleUpdateStatus}>
              <select
                className="w-full bg-black/40 border border-white/20 p-3 rounded text-white mb-4"
                value={editingStatus.status}
                onChange={(e) =>
                  setEditingStatus({ ...editingStatus, status: e.target.value })
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
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStatus(null)}
                  className="flex-1 py-2 bg-black/40 rounded border border-white/20"
                >
                  Cancel
                </button>
                <GoldButton type="submit" className="flex-1">
                  Update
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// 3. KYC REQUESTS (Restored)
const KYCRequestsTab = () => {
  const [list, setList] = useState([]);
  useEffect(() => {
    adminService
      .getPendingKYC()
      .then((res) => setList(res.data))
      .catch(console.error);
  }, []);

  const handleAction = async (id, action) => {
    if (!confirm(`${action} this request?`)) return;
    try {
      if (action === "approve") await adminService.approveKYC(id);
      else await adminService.rejectKYC(id, "Admin Rejected");
      setList((prev) => prev.filter((i) => i.tenant_id !== id));
      toast.success("Processed");
    } catch (e) {
      toast.error("Error");
    }
  };

  return (
    <div>
      <h2 className="text-2xl md:text-3xl font-display mb-6">
        Pending KYC Requests
      </h2>
      {list.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white/5 rounded border border-white/10">
          <Inbox size={48} className="mb-4 opacity-50" />
          <p>No pending approvals.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((t) => (
            <div
              key={t.tenant_id}
              className="bg-white/5 p-4 rounded border border-white/10 flex justify-between items-center"
            >
              <div>
                <h4 className="font-bold text-lg">{t.tenant_name}</h4>
                <a
                  href={t.document_reference}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm text-yellow-500 underline block mt-1"
                >
                  View Document
                </a>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAction(t.tenant_id, "approve")}
                  className="p-2 bg-green-500/20 text-green-400 rounded flex gap-2 items-center"
                >
                  <Check size={18} /> Approve
                </button>
                <button
                  onClick={() => handleAction(t.tenant_id, "reject")}
                  className="p-2 bg-red-500/20 text-red-400 rounded flex gap-2 items-center"
                >
                  <X size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 4. PLATFORM GAMES (Restored)
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
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="Title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
            <select
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-gray-300"
              value={form.game_type}
              onChange={(e) => setForm({ ...form, game_type: e.target.value })}
            >
              <option value="SLOT">SLOT</option>
              <option value="TABLE">TABLE</option>
              <option value="LIVE">LIVE</option>
              <option value="CRASH">CRASH</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="Thumbnail URL"
              value={form.default_thumbnail_url}
              onChange={(e) =>
                setForm({ ...form, default_thumbnail_url: e.target.value })
              }
              required
            />
            <input
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="Provider"
              value={form.provider}
              onChange={(e) => setForm({ ...form, provider: e.target.value })}
            />
          </div>
          <input
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
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
                  className={`text-xs px-3 py-1 rounded font-bold ${g.is_active ? "text-green-400 bg-green-900/20" : "text-red-400 bg-red-900/20"}`}
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

// 5. EARNINGS (Existing)
const EarningsTab = () => {
  const [data, setData] = useState({ total: 0, breakdown: [] });
  const [filters, setFilters] = useState({
    groupBy: "TENANT",
    timeRange: "1M",
  });

  useEffect(() => {
    adminService
      .getPlatformEarnings({
        group_by: filters.groupBy,
        time_range: filters.timeRange,
      })
      .then((res) =>
        setData({
          total: res.data.total_earnings,
          breakdown: res.data.breakdown,
        }),
      )
      .catch(console.error);
  }, [filters]);

  return (
    <div className="max-w-5xl mx-auto mt-4">
      <div className="flex gap-6 mb-8">
        <div className="bg-gradient-to-br from-yellow-900/40 to-black border border-yellow-500/30 p-6 rounded-xl flex-1">
          <h3 className="text-gray-400 text-sm font-bold uppercase">
            Total Revenue
          </h3>
          <div className="text-4xl font-mono font-bold text-yellow-500">
            ${data.total.toFixed(4)}
          </div>
        </div>
        <div className="bg-[#040029] border border-yellow-500/30 p-6 rounded-xl flex-[2]">
          <div className="flex gap-4">
            <div>
              <label className="text-[10px] uppercase block mb-1">
                Group By
              </label>
              <select
                className="bg-black/40 border border-white/20 p-2 rounded text-white text-xs"
                value={filters.groupBy}
                onChange={(e) =>
                  setFilters({ ...filters, groupBy: e.target.value })
                }
              >
                <option value="TENANT">Tenant</option>
                <option value="GAME">Game</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] uppercase block mb-1">Time</label>
              <select
                className="bg-black/40 border border-white/20 p-2 rounded text-white text-xs"
                value={filters.timeRange}
                onChange={(e) =>
                  setFilters({ ...filters, timeRange: e.target.value })
                }
              >
                <option value="1D">24h</option>
                <option value="1W">7 Days</option>
                <option value="1M">30 Days</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-[#040029] rounded-xl border border-yellow-500/30 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-white/5 text-xs text-gray-400 uppercase font-bold">
            <tr>
              <th className="p-4">Name</th>
              <th className="p-4 text-right">Bets</th>
              <th className="p-4 text-right text-yellow-500">Commission</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.breakdown.map((r, i) => (
              <tr key={i} className="hover:bg-white/10">
                <td className="p-4 text-sm font-bold text-white">{r.label}</td>
                <td className="p-4 text-sm text-right text-gray-400">
                  {r.total_bets}
                </td>
                <td className="p-4 text-sm text-right font-mono text-yellow-500 font-bold">
                  ${r.earnings.toFixed(4)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 6. CONFIG TABS (Rates, Currencies, Countries) - Condensed for brevity
const ExchangeRatesTab = ({ currencies }) => {
  const [form, setForm] = useState({ base: "USD", quote: "", rate: "" });
  const handleSave = async (e) => {
    e.preventDefault();
    try {
      await adminService.createExchangeRate({
        ...form,
        rate: parseFloat(form.rate),
      });
      toast.success("Saved");
      setForm({ ...form, rate: "" });
    } catch (e) {
      toast.error("Error");
    }
  };
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-[#040029] p-6 rounded border border-yellow-500/30">
        <h2 className="text-xl text-yellow-500 mb-6">Exchange Rates</h2>
        <form onSubmit={handleSave} className="flex gap-4">
          <select
            className="bg-black/40 border border-white/20 p-3 rounded w-1/3 text-gray-300"
            value={form.base}
            onChange={(e) => setForm({ ...form, base: e.target.value })}
          >
            {currencies.map((c) => (
              <option key={c.currency_code} value={c.currency_code}>
                {c.currency_code}
              </option>
            ))}
          </select>
          <select
            className="bg-black/40 border border-white/20 p-3 rounded w-1/3 text-gray-300"
            value={form.quote}
            onChange={(e) => setForm({ ...form, quote: e.target.value })}
          >
            <option value="">To</option>
            {currencies.map((c) => (
              <option key={c.currency_code} value={c.currency_code}>
                {c.currency_code}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.0001"
            placeholder="Rate"
            className="bg-black/40 border border-white/20 p-3 rounded w-1/3 text-white"
            value={form.rate}
            onChange={(e) => setForm({ ...form, rate: e.target.value })}
          />
          <GoldButton type="submit">Update</GoldButton>
        </form>
      </div>
    </div>
  );
};
const CurrenciesTab = () => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    symbol: "$",
    precision: 2,
  });
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCurrency({
        currency_code: form.code,
        currency_name: form.name,
        symbol: form.symbol,
        decimal_precision: parseInt(form.precision),
      });
      toast.success("Added");
      setForm({ code: "", name: "", symbol: "$", precision: 2 });
    } catch (e) {
      toast.error("Error");
    }
  };
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-[#040029] p-6 rounded border border-yellow-500/30">
        <h3 className="text-xl text-yellow-500 mb-6">Add Currency</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              className="bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="Code (INR)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            <input
              className="bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="Symbol (₹)"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
          </div>
          <input
            className="bg-black/40 border border-white/20 p-3 rounded w-full text-white"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <GoldButton fullWidth type="submit">
            Create
          </GoldButton>
        </form>
      </div>
    </div>
  );
};
const CountriesTab = ({ currencies }) => {
  const [form, setForm] = useState({
    name: "",
    iso2: "",
    iso3: "",
    currency: "",
  });
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCountry({
        country_name: form.name,
        iso2_code: form.iso2,
        iso3_code: form.iso3,
        default_currency_code: form.currency,
        default_timezone: "UTC",
      });
      toast.success("Added");
      setForm({ name: "", iso2: "", iso3: "", currency: "" });
    } catch (e) {
      toast.error("Error");
    }
  };
  return (
    <div className="max-w-2xl mx-auto mt-8">
      <div className="bg-[#040029] p-6 rounded border border-yellow-500/30">
        <h3 className="text-xl text-yellow-500 mb-6">Add Country</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            className="bg-black/40 border border-white/20 p-3 rounded w-full text-white"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="ISO2"
              value={form.iso2}
              onChange={(e) => setForm({ ...form, iso2: e.target.value })}
              maxLength={2}
              required
            />
            <input
              className="bg-black/40 border border-white/20 p-3 rounded text-white"
              placeholder="ISO3"
              value={form.iso3}
              onChange={(e) => setForm({ ...form, iso3: e.target.value })}
              maxLength={3}
              required
            />
          </div>
          <select
            className="bg-black/40 border border-white/20 p-3 rounded w-full text-gray-300"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            required
          >
            {currencies.map((c) => (
              <option key={c.currency_code} value={c.currency_code}>
                {c.currency_code}
              </option>
            ))}
          </select>
          <GoldButton fullWidth type="submit">
            Create
          </GoldButton>
        </form>
      </div>
    </div>
  );
};

// 7. PASSWORD CHANGE (Existing)
const ChangePasswordTab = () => {
  const [form, setForm] = useState({ old: "", new: "" });
  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateMyPassword(form.old, form.new);
      toast.success("Password Updated");
      setForm({ old: "", new: "" });
    } catch (e) {
      toast.error("Error");
    }
  };
  return (
    <div className="max-w-xl mx-auto bg-[#040029] p-6 rounded border border-yellow-500/30 mt-10">
      <h2 className="text-xl text-yellow-500 mb-6 flex items-center gap-2">
        <Lock /> Change Password
      </h2>
      <form onSubmit={handleUpdate} className="space-y-4">
        <InputField
          name="password"
          className="w-full bg-black/40 border border-white/20 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors"
          type="password"
          placeholder="Current"
          value={form.old}
          onChange={(e) => setForm({ ...form, old: e.target.value })}
          required
        />

        <InputField
          name="password"
          className="w-full bg-black/40 border border-white/20 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors"
          type="password"
          placeholder="New"
          value={form.new}
          onChange={(e) => setForm({ ...form, new: e.target.value })}
          required
        />

        <GoldButton fullWidth type="submit">
          Update
        </GoldButton>
      </form>
    </div>
  );
};

export default SuperAdminDashboard;
