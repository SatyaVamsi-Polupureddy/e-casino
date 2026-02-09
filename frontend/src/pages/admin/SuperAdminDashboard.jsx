import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import adminService from "../../services/adminService";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import SidebarItem from "../../components/common/SidebarItem";
import AdminManagementTab from "../../components/admin/AdminManagemantTab";
import TenantManagementTab from "../../components/admin/TenantManagemantTab";
import KYCRequestsTab from "../../components/admin/KYCRequestsTab";
import PlatformGamesTab from "../../components/admin/PlatformGamesTab";
import EarningsTab from "../../components/admin/EarningsTab";
import ExchangeRatesTab from "../../components/admin/ExchangeRatesTab";
import CurrenciesTab from "../../components/admin/CurrenciesTab";
import CountriesTab from "../../components/admin/CountriesTab";
import {
  DollarSign,
  Users,
  Lock,
  ShieldCheck,
  TrendingUp,
  LogOut,
  X,
  Building,
  MapPin,
  Coins,
  Menu,
  Gamepad2,
} from "lucide-react";

const SuperAdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("kyc");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currencies, setCurrencies] = useState([]);
  const [countries, setCountries] = useState([]);

  useEffect(() => {
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
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* MOBILE HEADER */}
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

      {/*  SIDEBAR */}
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
          className="flex items-center text-casino-red mt-6 pt-4 border-t border-white/10 gap-2 hover:underline w-full hover:cursor-pointer"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

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
