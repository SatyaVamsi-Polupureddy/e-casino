import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import staffService from "../../services/staffService"; // Ensure this path matches your project
import GoldButton from "../../components/ui/GoldButton"; // Ensure this path matches your project
import ContactModal from "../../components/common/ContactModal"; // Ensure this path matches your project
import {
  UserPlus,
  Search,
  LogOut,
  Menu,
  X,
  Wallet,
  ArrowDownCircle,
  ArrowUpCircle,
  History,
  Lock,
  Eye,
  EyeOff,
  Upload,
  HelpCircle,
} from "lucide-react";

// --- MAIN DASHBOARD COMPONENT ---
const TenantStaffDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cashier");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Contact Support State
  const [isSupportOpen, setIsSupportOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Auto-close sidebar on mobile when a tab is selected
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  return (
    <div className="flex h-screen bg-[#040029] text-white overflow-hidden">
      {/* 1. MOBILE BACKDROP */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-[#040029] backdrop-blur-sm md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        ></div>
      )}

      {/* 2. MOBILE HEADER */}
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

      {/* 3. SIDEBAR */}
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
          {/* Mobile Close Button inside Sidebar */}
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

        {/* BOTTOM ACTIONS */}
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
            className="flex items-center text-red-500 gap-3 w-full p-3 hover:bg-red-900/10 rounded transition-colors"
          >
            <LogOut size={20} /> Logout
          </button>
        </div>
      </aside>

      {/* 4. MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full bg-[#040029]">
        {activeTab === "cashier" && <CashierTab />}
        {activeTab === "register" && <RegisterPlayerTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "password" && <ChangePasswordTab />}
      </main>

      {/* 5. CONTACT MODAL */}
      <ContactModal
        isOpen={isSupportOpen}
        onClose={() => setIsSupportOpen(false)}
        userRole="TENANT_STAFF"
      />
    </div>
  );
};

// --- SUB-COMPONENT: SIDEBAR ITEM ---
const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${
      active
        ? "bg-yellow-500 text-black font-bold"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);

// --- SUB-COMPONENT: CASHIER TAB ---
const CashierTab = () => {
  const [searchEmail, setSearchEmail] = useState("");
  const [player, setPlayer] = useState(null);
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");

  const [txnStage, setTxnStage] = useState("idle"); // 'idle', 'otp_sent'
  const [txnType, setTxnType] = useState(null); // 'DEPOSIT', 'WITHDRAW'

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await staffService.lookupPlayer(searchEmail);
      setPlayer(res.data);
      setTxnStage("idle");
      setAmount("");
    } catch (err) {
      toast.error("Player not found");
      setPlayer(null);
    }
  };

  const handleInitiate = async (type) => {
    if (!amount || amount <= 0) return toast.error("Enter valid amount");
    try {
      setTxnType(type);
      if (type === "DEPOSIT")
        await staffService.initiateDeposit(searchEmail, amount);
      else await staffService.initiateWithdrawal(searchEmail, amount);
      setTxnStage("otp_sent");
      toast.success(`OTP Sent for ${type}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error sending OTP");
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      if (txnType === "DEPOSIT")
        await staffService.verifyDeposit(searchEmail, otp);
      else await staffService.verifyWithdrawal(searchEmail, otp);

      toast.success("Transaction Successful!");
      setTxnStage("idle");
      setOtp("");
      setAmount("");
      // Refresh player data to show new balance
      const res = await staffService.lookupPlayer(searchEmail);
      setPlayer(res.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-display text-yellow-500 mb-6">
        Cashier Desk
      </h2>

      {/* SEARCH BAR */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="email"
          placeholder="Player Email"
          className="flex-1 bg-black/40 border border-white/30 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          required
        />
        <GoldButton type="submit">
          <Search size={20} />
        </GoldButton>
      </form>

      {/* PLAYER CARD */}
      {player && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-white">
                {player.username}
              </h3>
              <p className="text-sm text-gray-400">{player.email}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase">Balance</p>
              <p className="text-xl font-mono font-bold text-green-400">
                ${player.balance?.toFixed(2) || "0.00"}
              </p>
            </div>
          </div>

          <div
            className={`inline-block px-3 py-1 rounded text-xs font-bold uppercase mb-6 ${
              player.kyc_status === "APPROVED"
                ? "bg-green-500/20 text-green-400"
                : "bg-red-500/20 text-red-400"
            }`}
          >
            KYC: {player.kyc_status}
          </div>

          {/* ACTION BUTTONS (Only if Idle) */}
          {txnStage === "idle" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-black/40 rounded border border-white/10">
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Transaction Amount ($)
                </label>
                <input
                  type="number"
                  className="w-full bg-transparent text-2xl font-bold text-white outline-none mt-1 placeholder-gray-700"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleInitiate("DEPOSIT")}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowDownCircle size={18} /> Deposit
                </button>
                <button
                  onClick={() => handleInitiate("WITHDRAW")}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <ArrowUpCircle size={18} /> Withdraw
                </button>
              </div>
            </div>
          )}

          {/* OTP FORM */}
          {txnStage === "otp_sent" && (
            <div className="mt-6 bg-yellow-900/20 border border-yellow-500/50 p-6 rounded-xl animate-in fade-in slide-in-from-top-4">
              <h4 className="font-bold text-yellow-500 mb-2 flex items-center gap-2">
                {txnType === "DEPOSIT" ? (
                  <ArrowDownCircle />
                ) : (
                  <ArrowUpCircle />
                )}
                Confirm {txnType} of ${amount}
              </h4>
              <p className="text-sm text-gray-300 mb-4">
                Ask player for the 6-digit code sent to their dashboard.
              </p>
              <form onSubmit={handleVerify} className="flex gap-2">
                <input
                  type="text"
                  placeholder="000000"
                  className="flex-1 bg-black/40 border border-white/20 p-3 rounded text-white text-center tracking-[0.5em] text-xl font-mono outline-none focus:border-yellow-500"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <GoldButton type="submit">Verify</GoldButton>
              </form>
              <button
                onClick={() => setTxnStage("idle")}
                className="text-xs text-gray-500 hover:text-white mt-4 underline w-full text-center"
              >
                Cancel Transaction
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- SUB-COMPONENT: REGISTER PLAYER TAB ---
const RegisterPlayerTab = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    country_id: 1,
  });
  const [kycForm, setKycForm] = useState({ email: "", url: "" });

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await staffService.registerPlayer(form);
      toast.success("Player Registered! You can now upload their ID.");
      setKycForm({ ...kycForm, email: form.email });
      setForm({ username: "", email: "", password: "", country_id: 1 });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error registering player");
    }
  };

  const handleUploadKYC = async (e) => {
    e.preventDefault();
    try {
      await staffService.uploadKYC(kycForm.email, kycForm.url);
      toast.success("KYC Uploaded successfully!");
      setKycForm({ email: "", url: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error uploading KYC");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Registration Form */}
      <div className="bg-white/5 p-8 rounded-xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-display text-yellow-500 mb-6 flex items-center gap-2">
          <UserPlus /> New Player Registration
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
          <GoldButton fullWidth type="submit">
            Create Player Account
          </GoldButton>
        </form>
      </div>

      {/* Quick KYC Upload */}
      <div className="bg-white/5 p-8 rounded-xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-display text-yellow-500 mb-6 flex items-center gap-2">
          <Upload /> Quick KYC Upload
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Upload ID document link for existing or newly registered players.
        </p>
        <form onSubmit={handleUploadKYC} className="space-y-4">
          <input
            type="email"
            placeholder="Player Email"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
            value={kycForm.email}
            onChange={(e) => setKycForm({ ...kycForm, email: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Document URL (e.g., S3 Link)"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
            value={kycForm.url}
            onChange={(e) => setKycForm({ ...kycForm, url: e.target.value })}
            required
          />
          <button className="w-full py-3 bg-blue-600/20 text-blue-300 border border-blue-600/50 rounded hover:bg-blue-600/30 transition-colors font-bold uppercase tracking-wider">
            Upload Document
          </button>
        </form>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: HISTORY TAB ---
const HistoryTab = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    staffService
      .getMyTransactions()
      .then((res) => setTransactions(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-5xl mx-auto">
      <h2 className="text-2xl font-display text-yellow-500 mb-6 flex items-center gap-2">
        <History /> My Transaction History
      </h2>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[600px]">
            <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs tracking-wider">
              <tr>
                <th className="p-4">Date & Time</th>
                <th className="p-4">Type</th>
                <th className="p-4">Player</th>
                <th className="p-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No transactions recorded.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr
                    key={tx.transaction_id}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td className="p-4">
                      <div className="font-bold text-white">
                        {new Date(tx.created_at).toLocaleDateString()}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                          tx.transaction_type === "DEPOSIT"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {tx.transaction_type}
                      </span>
                    </td>
                    <td className="p-4 text-white font-mono text-xs">
                      {tx.email}
                    </td>
                    <td
                      className={`p-4 text-right font-mono font-bold text-lg ${
                        tx.transaction_type === "DEPOSIT"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {tx.transaction_type === "DEPOSIT" ? "+" : "-"}$
                      {tx.amount}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: CHANGE PASSWORD TAB ---
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
          <input
            type={showOld ? "text" : "password"}
            placeholder="Current Password"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white pr-10 focus:border-yellow-500 outline-none transition-colors"
            value={form.old}
            onChange={(e) => setForm({ ...form, old: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
          >
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            placeholder="New Password"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white pr-10 focus:border-yellow-500 outline-none transition-colors"
            value={form.new}
            onChange={(e) => setForm({ ...form, new: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
          >
            {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <GoldButton fullWidth type="submit">
          Update Password
        </GoldButton>
      </form>
    </div>
  );
};

export default TenantStaffDashboard;
