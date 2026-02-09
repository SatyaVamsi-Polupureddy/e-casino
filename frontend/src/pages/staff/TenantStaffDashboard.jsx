import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import staffService from "../../services/staffService";
import GoldButton from "../../components/ui/GoldButton";
import ContactModal from "../../components/common/ContactModal";
import InputField from "../../components/ui/InputField";
import SidebarItem from "../../components/common/SidebarItem";
import CashierTab from "../../components/staff/CashierTab";
import RegisterPlayerTab from "../../components/staff/RegisterPlayerTab";
import HistoryTab from "../../components/staff/HistoryTab";
import {
  UserPlus,
  LogOut,
  Menu,
  X,
  Wallet,
  History,
  Lock,
  HelpCircle,
} from "lucide-react";

const TenantStaffDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cashier");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#040029] text-white overflow-hidden">
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#040029] backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#040029] border-b border-white/10 flex items-center px-4 z-40 justify-between shadow-lg">
        <span className="text-xl font-display text-yellow-500 tracking-wider">
          STAFF PORTAL
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
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#040029] border-r border-white/10 p-6 flex flex-col transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-display text-yellow-500 hidden md:block">
            STAFF PORTAL
          </h1>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 space-y-3">
          <SidebarItem
            icon={<Wallet size={20} />}
            label="Cashier Desk"
            active={activeTab === "cashier"}
            onClick={() => handleTabChange("cashier")}
          />
          <SidebarItem
            icon={<UserPlus size={20} />}
            label="Register / KYC"
            active={activeTab === "register"}
            onClick={() => handleTabChange("register")}
          />
          <SidebarItem
            icon={<History size={20} />}
            label="My History"
            active={activeTab === "history"}
            onClick={() => handleTabChange("history")}
          />
          <SidebarItem
            icon={<Lock size={20} />}
            label="Change Password"
            active={activeTab === "password"}
            onClick={() => handleTabChange("password")}
          />
        </nav>

        <div className="mt-auto border-t border-white/10 pt-4 space-y-2">
          <button
            onClick={() => setIsSupportOpen(true)}
            className="flex items-center gap-3 w-full p-3 rounded text-gray-400 hover:bg-white/5 hover:text-white transition-colors"
          >
            <HelpCircle size={20} />
            <span>Contact Admin</span>
          </button>

          <button
            onClick={handleLogout}
            className="flex items-center text-red-500 gap-3 w-full p-3 hover:bg-red-900/10 rounded transition-colors hover:cursor-pointer"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full bg-[#040029]">
        {activeTab === "cashier" && <CashierTab />}
        {activeTab === "register" && <RegisterPlayerTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "password" && <ChangePasswordTab />}
      </main>

      {/* CONTACT MODAL */}
      <ContactModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        userRole="TENANT_STAFF"
      />
    </div>
  );
};

const ChangePasswordTab = () => {
  const [form, setForm] = useState({ old: "", new: "" });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await staffService.changePassword(form.old, form.new);
      toast.success("Password Changed Successfully");
      setForm({ old: "", new: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error updating password");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/5 p-8 rounded-xl border border-white/10 mt-10 shadow-lg">
      <h2 className="text-xl font-display text-yellow-500 mb-6 flex items-center gap-2">
        <Lock /> Change Password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <InputField
            type={showOld ? "text" : "password"}
            placeholder="Current Password"
            value={form.old}
            onChange={(e) => setForm({ ...form, old: e.target.value })}
            required
          />
        </div>
        <div className="relative">
          <InputField
            type={showNew ? "text" : "password"}
            placeholder="New Password"
            value={form.new}
            onChange={(e) => setForm({ ...form, new: e.target.value })}
            required
          />
        </div>
        <GoldButton fullWidth type="submit">
          Update Password
        </GoldButton>
      </form>
    </div>
  );
};

export default TenantStaffDashboard;
