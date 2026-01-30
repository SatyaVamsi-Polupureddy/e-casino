import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import staffService from "../../services/staffService";
import GoldButton from "../../components/ui/GoldButton";
import {
  UserPlus,
  Search,
  DollarSign,
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
} from "lucide-react";

const TenantStaffDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("cashier");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/auth");
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on selection
  };

  return (
    <div className="flex h-screen bg-[#040029] text-white overflow-hidden">
      {/* 1. MOBILE HEADER (FIXED: Hides button when sidebar is open) */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#040029] border-b border-white/10 flex items-center px-4 z-40 justify-between">
        <span className="text-xl font-display text-casino-gold tracking-wider">
          STAFF PORTAL
        </span>
        {/* Only show Menu button if sidebar is CLOSED */}
        {!isSidebarOpen && (
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="text-white p-2"
          >
            <Menu />
          </button>
        )}
      </div>

      {/* 2. SIDEBAR */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-[#040029] border-r border-white/10 p-6 flex flex-col transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0 
          ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-display text-casino-gold hidden md:block">
            STAFF PORTAL
          </h1>

          {/* Mobile Title & Close Button */}
          <span className="md:hidden text-casino-gold font-display text-xl">
            MENU
          </span>
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

        <button
          onClick={handleLogout}
          className="flex items-center text-casino-red mt-auto gap-2 hover:underline pt-4 border-t border-white/10"
        >
          <LogOut size={18} /> Logout
        </button>
      </aside>

      {/* 3. MAIN CONTENT */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto pt-20 md:pt-8 w-full">
        {activeTab === "cashier" && <CashierTab />}
        {activeTab === "register" && <RegisterPlayerTab />}
        {activeTab === "history" && <HistoryTab />}
        {activeTab === "password" && <ChangePasswordTab />}
      </main>
    </div>
  );
};

// ... (Rest of your sub-components: CashierTab, RegisterPlayerTab, etc. remain exactly the same) ...
// --- 1. CASHIER TAB (Existing Logic) ---
const CashierTab = () => {
  const [searchEmail, setSearchEmail] = useState("");
  const [player, setPlayer] = useState(null);
  const [amount, setAmount] = useState("");
  const [otp, setOtp] = useState("");

  // Stages: 'idle', 'otp_sent', 'success'
  const [txnStage, setTxnStage] = useState("idle");
  const [txnType, setTxnType] = useState(null); // 'DEPOSIT' or 'WITHDRAW'

  const handleSearch = async (e) => {
    e.preventDefault();
    try {
      const res = await staffService.lookupPlayer(searchEmail);
      setPlayer(res.data); // Assuming backend returns { username, balance, etc. }
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
      handleSearch({ preventDefault: () => {} }); // Refresh balance
    } catch (err) {
      toast.error(err.response?.data?.detail || "Invalid OTP");
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-display text-casino-gold mb-6">
        Cashier Desk
      </h2>

      {/* 1. SEARCH BAR */}
      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="email"
          placeholder="Player Email"
          className="flex-1 bg-black/40 border border-white/30 p-3 rounded text-white"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          required
        />
        <GoldButton type="submit">
          <Search size={20} />
        </GoldButton>
      </form>

      {/* 2. PLAYER CARD */}
      {player && (
        <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-xl font-bold text-white">
                {player.username}
              </h3>
              <p className="text-sm text-gray-400">{player.email}</p>
            </div>
            <div
              className={`px-3 py-1 rounded text-sm font-bold ${
                player.kyc_status === "APPROVED"
                  ? "bg-green-500/20 text-green-400"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {player.kyc_status}
            </div>
          </div>

          {/* ACTION BUTTONS (Only if Idle) */}
          {txnStage === "idle" && (
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-black/40 rounded border border-white/10">
                <label className="text-xs text-gray-500 uppercase">
                  Amount
                </label>
                <input
                  type="number"
                  className="w-full bg-transparent text-2xl font-bold text-white outline-none mt-1"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleInitiate("DEPOSIT")}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded font-bold flex items-center justify-center gap-2"
                >
                  <ArrowDownCircle /> Deposit
                </button>
                <button
                  onClick={() => handleInitiate("WITHDRAW")}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold flex items-center justify-center gap-2"
                >
                  <ArrowUpCircle /> Withdraw
                </button>
              </div>
            </div>
          )}

          {/* OTP FORM */}
          {txnStage === "otp_sent" && (
            <div className="mt-6 bg-casino-gold/10 border border-casino-gold p-4 rounded animate-in fade-in slide-in-from-top-4">
              <h4 className="font-bold text-casino-gold mb-2 flex items-center gap-2">
                {txnType === "DEPOSIT" ? (
                  <ArrowDownCircle />
                ) : (
                  <ArrowUpCircle />
                )}
                Confirm {txnType} of ${amount}
              </h4>
              <p className="text-sm text-gray-300 mb-4">
                Enter the 6-digit OTP sent to the player.
              </p>
              <form onSubmit={handleVerify} className="flex gap-2">
                <input
                  type="text"
                  placeholder="######"
                  className="flex-1 bg-black/40 border border-white/20 p-3 rounded text-white text-center tracking-widest text-lg"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  required
                />
                <GoldButton type="submit">Confirm</GoldButton>
              </form>
              <button
                onClick={() => setTxnStage("idle")}
                className="text-xs text-gray-500 hover:text-white mt-2 underline"
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

// --- 2. REGISTER / KYC TAB (Updated) ---
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
      setKycForm({ ...kycForm, email: form.email }); // Auto-fill KYC email
      setForm({ username: "", email: "", password: "", country_id: 1 });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  const handleUploadKYC = async (e) => {
    e.preventDefault();
    try {
      await staffService.uploadKYC(kycForm.email, kycForm.url);
      toast.success("KYC Uploaded successfully!");
      setKycForm({ email: "", url: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
      {/* Registration Form */}
      <div className="bg-white/5 p-8 rounded border border-white/10">
        <h2 className="text-xl font-display text-casino-gold mb-6 flex items-center gap-2">
          <UserPlus /> New Player Registration
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
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
      <div className="bg-white/5 p-8 rounded border border-white/10">
        <h2 className="text-xl font-display text-casino-gold mb-6 flex items-center gap-2">
          <Upload /> Quick KYC Upload
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Upload ID for existing or newly registered players.
        </p>
        <form onSubmit={handleUploadKYC} className="space-y-4">
          <input
            type="email"
            placeholder="Player Email"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
            value={kycForm.email}
            onChange={(e) => setKycForm({ ...kycForm, email: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Document URL (S3 Link)"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
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

// --- 3. HISTORY TAB (Responsive Fix) ---
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
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-display text-casino-gold mb-6 flex items-center gap-2">
        <History /> My History
      </h2>

      <div className="bg-white/5 rounded border border-white/10 overflow-hidden overflow-x-auto">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-white/10 text-gray-400 uppercase">
            <tr>
              <th className="p-4 whitespace-nowrap">Date & Time</th>
              <th className="p-4 whitespace-nowrap">Type</th>
              <th className="p-4 whitespace-nowrap">Player</th>
              <th className="p-4 text-right whitespace-nowrap">Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No transactions found.
                </td>
              </tr>
            ) : (
              transactions.map((tx) => (
                <tr key={tx.transaction_id} className="hover:bg-white/5">
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-bold text-white">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(tx.created_at).toLocaleTimeString()}
                    </div>
                  </td>
                  <td className="p-4 font-bold whitespace-nowrap">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        tx.transaction_type === "DEPOSIT"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {tx.transaction_type}
                    </span>
                  </td>
                  <td className="p-4 text-white whitespace-nowrap">
                    {tx.email}
                  </td>
                  <td
                    className={`p-4 text-right font-mono font-bold whitespace-nowrap ${
                      tx.transaction_type === "DEPOSIT"
                        ? "text-green-400"
                        : "text-red-400"
                    }`}
                  >
                    {tx.transaction_type === "DEPOSIT" ? "+" : "-"}${tx.amount}
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
// --- 4. CHANGE PASSWORD TAB (New) ---
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
      toast.error(err.response?.data?.detail || "Error");
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white/5 p-8 rounded border border-white/10 mt-10">
      <h2 className="text-xl font-display text-casino-gold mb-6 flex items-center gap-2">
        <Lock /> Change Password
      </h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="relative">
          <input
            type={showOld ? "text" : "password"}
            placeholder="Current Password"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white pr-10"
            value={form.old}
            onChange={(e) => setForm({ ...form, old: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowOld(!showOld)}
            className="absolute right-3 top-3.5 text-gray-400"
          >
            {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <div className="relative">
          <input
            type={showNew ? "text" : "password"}
            placeholder="New Password"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white pr-10"
            value={form.new}
            onChange={(e) => setForm({ ...form, new: e.target.value })}
            required
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute right-3 top-3.5 text-gray-400"
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

export default TenantStaffDashboard;
