import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  X,
  CreditCard,
  Banknote,
  History,
  ChevronRight,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Gift,
  Bell,
  Trophy,
  FileText,
  LifeBuoy,
  Upload,
} from "lucide-react";
import GoldButton from "../ui/GoldButton";
import playerService from "../../services/playerService";
import ContactForm from "../common/ContactForm";
import toast from "react-hot-toast";

const MenuItem = ({ icon, label, onClick, danger = false }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center justify-between p-4 rounded-xl transition-all group ${
      danger
        ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
        : "bg-white/5 text-gray-300 hover:bg-white/10 hover:text-white border border-white/10"
    }`}
  >
    <div className="flex items-center gap-3">
      <span className={danger ? "text-red-500" : "text-yellow-500"}>
        {icon}
      </span>
      <span className="font-bold text-sm tracking-wide">{label}</span>
    </div>
    <ChevronRight
      size={16}
      className={`opacity-50 group-hover:opacity-100 transition-opacity ${
        danger ? "text-red-500" : "text-yellow-500"
      }`}
    />
  </button>
);

const ProfileSidebar = ({
  isOpen,
  onClose,
  profile,
  activeOtp,
  onLogout,
  refreshData,
  tenantContactEmail,
  onChangePassword,
  initialView = "menu",
}) => {
  const [view, setView] = useState(initialView);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset view when sidebar opens/closes
  useEffect(() => {
    if (isOpen) {
      setView(initialView);
    } else {
      const timer = setTimeout(() => {
        setView("menu");
        setAmount("");
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen, initialView]);

  // --- SUB-HEADER FOR CHILD VIEWS ---
  const Header = ({ title }) => (
    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#040029]">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            setView("menu");
            setAmount("");
          }}
          className="hover:bg-white/10 p-1 rounded-full transition-colors"
        >
          <ArrowLeft size={20} className="text-gray-400 hover:text-white" />
        </button>
        <h2 className="text-xl font-display text-white">{title}</h2>
      </div>
      <button
        onClick={onClose}
        className="hover:bg-white/10 p-1 rounded-full transition-colors"
      >
        <X size={24} className="text-gray-400 hover:text-white" />
      </button>
    </div>
  );

  const handleTransaction = async (type) => {
    if (!amount || parseFloat(amount) <= 0) return;
    setLoading(true);
    try {
      if (type === "DEPOSIT") await playerService.depositSelf(amount);
      else await playerService.withdrawSelf(amount);
      toast.success(
        `${type === "DEPOSIT" ? "Deposit" : "Withdrawal"} Successful!`,
      );
      setAmount("");
      refreshData();
      setView("menu");
    } catch (e) {
      console.error(e);
      toast.errir(
        "Transaction Failed: " + (e.response?.data?.detail || "Unknown Error"),
      );
    } finally {
      setLoading(false);
    }
  };

  // --- RENDER CONTENT ---
  const renderView = () => {
    switch (view) {
      case "notifications":
        return (
          <>
            <Header title="Notifications" />
            <div className="p-6 space-y-4">
              {activeOtp ? (
                <div className="bg-yellow-900/20 border border-yellow-500 p-6 rounded-xl text-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-20">
                    <Bell size={40} />
                  </div>
                  <p className="text-xs text-yellow-500 uppercase font-bold tracking-widest mb-2">
                    Transaction Verification
                  </p>
                  <div className="text-4xl font-mono text-white tracking-widest font-bold">
                    {activeOtp.otp_code}
                  </div>
                  <p className="text-[10px] text-gray-400 mt-2">
                    Provide code to staff.
                  </p>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                  <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3">
                    <Bell size={20} className="opacity-50" />
                  </div>
                  <p className="text-sm">No new notifications</p>
                </div>
              )}
            </div>
          </>
        );

      case "deposit":
        return (
          <>
            <Header title="Deposit Funds" />
            <div className="p-6 bg-[#040029]">
              <div className="mb-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-lg text-sm text-blue-100">
                Deposits are credited to your <b>REAL</b> balance immediately.
              </div>
              <input
                type="number"
                placeholder="Amount ($)"
                className="w-full bg-black border border-white/20 p-4 rounded text-white text-xl mb-4 focus:border-yellow-500 outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <GoldButton
                fullWidth
                onClick={() => handleTransaction("DEPOSIT")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Deposit"}
              </GoldButton>
            </div>
          </>
        );

      case "withdraw":
        return (
          <>
            <Header title="Withdraw Funds" />
            <div className="p-6 bg-[#040029]">
              <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-lg text-sm text-red-500/80">
                You can only withdraw from your <b>REAL</b> balance.
              </div>
              <input
                type="number"
                placeholder="Amount ($)"
                className="w-full bg-black border border-white/20 p-4 rounded text-white text-xl mb-4 focus:border-yellow-500 outline-none"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <GoldButton
                fullWidth
                onClick={() => handleTransaction("WITHDRAW")}
                disabled={loading}
              >
                {loading ? "Processing..." : "Confirm Withdrawal"}
              </GoldButton>
            </div>
          </>
        );

      case "history":
        return (
          <>
            <Header title="Transaction History" />
            <HistoryView />
          </>
        );

      // --- NEW KYC VIEW ---
      case "kyc":
        return (
          <>
            <Header title="Verification" />
            <div className="p-6">
              <KYCForm />
            </div>
          </>
        );

      // --- NEW SUPPORT VIEW ---
      case "support":
        return (
          <>
            <Header title="Contact Support" />
            <div className="p-6 bg-[#040029]">
              <div className="mb-6 p-4 bg-purple-900/20 border border-purple-500/30 rounded-lg text-sm text-purple-200">
                Need help? Send a message directly to the casino staff.
              </div>
              <ContactForm
                userRole="PLAYER"
                tenantSupportEmail={tenantContactEmail}
                initialName={profile?.username}
                initialEmail={profile?.email}
                onSuccess={() => setTimeout(() => setView("menu"), 1500)}
              />
            </div>
          </>
        );

      default: // MAIN MENU
        return (
          <>
            {/* PROFILE HEADER */}
            <div className="p-6 text-center border-b border-white/5 bg-[#040029] relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 hover:bg-white/10 p-1 rounded-full transition-colors"
              >
                <X size={24} className="text-gray-400 hover:text-white" />
              </button>

              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-yellow-500 to-yellow-700 rounded-full flex items-center justify-center text-3xl font-bold text-black mb-4 shadow-[0_0_20px_rgba(234,179,8,0.3)]">
                {profile?.username?.charAt(0).toUpperCase()}
              </div>
              <h3 className="text-2xl font-bold text-white tracking-tight">
                {profile?.username}
              </h3>
              <div
                className={`text-xs font-bold uppercase tracking-wider mt-2 inline-flex items-center gap-1 px-3 py-1 rounded-full ${
                  profile?.kyc_status === "APPROVED"
                    ? "bg-green-500/20 text-green-400"
                    : "bg-red-500/20 text-red-400"
                }`}
              >
                {profile?.kyc_status === "APPROVED" ? (
                  <ShieldCheck size={12} />
                ) : (
                  <ShieldAlert size={12} />
                )}{" "}
                {profile?.kyc_status || "PENDING"}
              </div>
            </div>

            {/* MENU ITEMS CONTAINER */}
            <div className="flex-1 p-6 space-y-3 bg-[#040029] overflow-y-auto">
              {/* --- 1. NOT APPROVED STATE --- */}
              {profile?.kyc_status !== "APPROVED" && (
                <>
                  <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-xl text-sm text-yellow-200 mb-2 flex flex-col gap-2">
                    <span className="font-bold uppercase tracking-widest text-xs flex items-center gap-2">
                      <ShieldCheck size={14} /> Account Restricted
                    </span>
                    <span className="opacity-80">
                      Complete verification to unlock features.
                    </span>
                  </div>

                  <MenuItem
                    icon={<FileText />}
                    label="Complete Verification (KYC)"
                    onClick={() => setView("kyc")}
                  />
                </>
              )}

              {/* --- 2. APPROVED STATE --- */}
              {profile?.kyc_status === "APPROVED" && (
                <>
                  {activeOtp && (
                    <button
                      onClick={() => setView("notifications")}
                      className="w-full bg-yellow-900/20 border border-yellow-500 p-4 rounded-xl mb-4 text-center animate-pulse hover:bg-yellow-900/30 transition-colors"
                    >
                      <p className="text-[10px] text-yellow-500 uppercase font-bold tracking-widest mb-1">
                        Active Verification Code
                      </p>
                      <p className="text-2xl font-mono text-white tracking-widest">
                        {activeOtp.otp_code}
                      </p>
                    </button>
                  )}
                  <MenuItem
                    icon={<CreditCard />}
                    label="Deposit Funds"
                    onClick={() => setView("deposit")}
                  />
                  <MenuItem
                    icon={<Banknote />}
                    label="Withdraw Funds"
                    onClick={() => setView("withdraw")}
                  />
                  <MenuItem
                    icon={<History />}
                    label="Transaction History"
                    onClick={() => setView("history")}
                  />
                </>
              )}

              {/* --- 3. SHARED ITEMS (Always Visible) --- */}
              <MenuItem
                icon={<ShieldCheck />}
                label="Change Password"
                onClick={() => {
                  onClose();
                  if (onChangePassword) onChangePassword();
                }}
              />
              <MenuItem
                icon={<LifeBuoy />}
                label="Contact Support"
                onClick={() => setView("support")}
              />
            </div>

            {/* FOOTER */}
            <div className="p-3 border-t border-white/10 bg-[#040029] mt-auto">
              <button
                onClick={onLogout}
                className="w-full py-3 border border-red-500/50 text-red-500 hover:bg-red-500/15 rounded-lg flex items-center justify-center gap-2 font-bold transition-colors"
              >
                <LogOut size={18} /> Sign Out
              </button>
            </div>
          </>
        );
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[100] transition-all duration-300  ${
        isOpen ? "visible" : "invisible"
      }`}
    >
      <div
        className={`absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity ${
          isOpen ? "opacity-100" : "opacity-0"
        }`}
        onClick={onClose}
      ></div>
      <div
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-[#040029] border-l border-white/10 shadow-2xl transform transition-transform flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {renderView()}
      </div>
    </div>
  );
};

const HistoryView = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    playerService
      .getTransactions()
      .then((res) => setHistory(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-gray-500">Loading history...</div>
    );

  return (
    <div className="p-4 space-y-2 bg-[#040029] max-h-[90vh] overflow-y-auto custom-scrollbar">
      {history.length === 0 ? (
        <div className="text-gray-500 text-center py-4">
          No transactions found.
        </div>
      ) : (
        history.map((tx, i) => (
          <div
            key={i}
            className="bg-white/10 p-4 rounded-lg flex justify-between items-center border border-white/5 hover:border-yellow-500/50 transition-colors"
          >
            <div>
              <div className="font-bold text-white text-sm flex items-center gap-2">
                {tx.transaction_type === "BONUS_CREDIT" && (
                  <Gift size={12} className="text-purple-400" />
                )}
                {tx.transaction_type === "JACKPOT_WIN" && (
                  <Trophy size={12} className="text-yellow-400" />
                )}
                {tx.transaction_type.replace("_", " ")}
              </div>
              <div className="text-[10px] text-gray-500 mt-0.5">
                {new Date(tx.created_at).toLocaleDateString()}{" "}
                {new Date(tx.created_at).toLocaleTimeString()}
              </div>
            </div>
            <div
              className={`font-mono font-bold ${
                ["DEPOSIT", "WIN", "BONUS_CREDIT", "JACKPOT_WIN"].includes(
                  tx.transaction_type,
                )
                  ? "text-green-400"
                  : "text-red-400"
              }`}
            >
              {["DEPOSIT", "WIN", "BONUS_CREDIT", "JACKPOT_WIN"].includes(
                tx.transaction_type,
              )
                ? "+"
                : "-"}
              ${Number(tx.amount).toFixed(2)}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

const KYCForm = () => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await playerService.submitKYC(url);
      setUrl("");
      toast.success("Submitted!");
    } catch (e) {
      toast.error("Error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 text-yellow-500 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
        <Upload size={14} /> Upload Documents
      </div>
      <p className="text-xs text-gray-400 mb-4">
        Please upload your ID proof (Passport, Driver's License) to verify your
        identity.
      </p>
      <input
        className="w-full bg-black border border-white/20 p-3 rounded text-white mb-3 text-sm outline-none focus:border-yellow-500"
        placeholder="Document URL (e.g. S3 Link)"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <GoldButton fullWidth size="sm" disabled={loading} type="submit">
        {loading ? "Submitting..." : "Submit for Verification"}
      </GoldButton>
    </form>
  );
};

export default ProfileSidebar;
