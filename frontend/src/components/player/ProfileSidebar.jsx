import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  X,
  CreditCard,
  Banknote,
  History,
  ChevronRight,
  LogOut,
  Upload,
  ShieldCheck,
  ShieldAlert,
  Gift,
  Bell,
  Trophy,
} from "lucide-react";
import GoldButton from "../ui/GoldButton";
import playerService from "../../services/playerService";

const ProfileSidebar = ({
  isOpen,
  onClose,
  profile,
  activeOtp,
  onLogout,
  refreshData,
  onChangePassword, // <--- ADDED PROP
  initialView = "menu",
}) => {
  const [view, setView] = useState(initialView);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

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

  const Header = ({ title, back }) => (
    <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#040029]">
      <div className="flex items-center gap-4">
        {back && (
          <button
            onClick={() => {
              setView("menu");
              setAmount("");
            }}
            className="hover:bg-white/10 p-1 rounded-full transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-400 hover:text-white" />
          </button>
        )}
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
      alert(`${type === "DEPOSIT" ? "Deposit" : "Withdrawal"} Successful!`);
      setAmount("");
      refreshData();
      setView("menu");
    } catch (e) {
      console.error(e);
      alert(
        "Transaction Failed: " + (e.response?.data?.detail || "Unknown Error"),
      );
    } finally {
      setLoading(false);
    }
  };

  const renderView = () => {
    switch (view) {
      case "notifications":
        return (
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
        );
      case "deposit":
        return (
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
        );
      case "withdraw":
        return (
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
        );
      case "history":
        return <HistoryView />;
      default: // MENU
        return (
          <>
            <div className="p-6 text-center border-b border-white/5 bg-[#040029]">
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
                {profile?.kyc_status}
              </div>
            </div>
            {profile?.kyc_status !== "APPROVED" ? (
              <div className="p-6">
                <div className="p-4 bg-yellow-900/20 border border-yellow-500/30 rounded-lg text-sm text-yellow-200 mb-6">
                  Account restrictions active.
                </div>
                <KYCForm />
              </div>
            ) : (
              <div className="flex-1 p-6 space-y-2 bg-[#040029]">
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

                <MenuItem
                  icon={<ShieldCheck />}
                  label="Change Password"
                  onClick={() => {
                    onClose(); // Close sidebar so modal can show
                    if (onChangePassword) onChangePassword();
                  }}
                />
              </div>
            )}
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
        className={`absolute right-0 top-0 h-full w-full max-w-md bg-[#111] border-l border-white/10 shadow-2xl transform transition-transform flex flex-col ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <Header
          title={
            view === "menu"
              ? "My Profile"
              : view.charAt(0).toUpperCase() + view.slice(1)
          }
          back={view !== "menu" && view !== "notifications"}
        />
        <div className="flex-1 overflow-y-auto flex flex-col bg-[#040029]">
          {renderView()}
        </div>
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
    <div className="p-4 space-y-2 bg-[#040029]">
      {history.map((tx, i) => (
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
              {tx.transaction_type}
            </div>
            <div className="text-[10px] text-gray-500 mt-0.5">
              {new Date(tx.created_at).toLocaleDateString()}
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
            ${tx.amount}
          </div>
        </div>
      ))}
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
      alert("Submitted!");
    } catch (e) {
      alert("Error");
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4 text-yellow-500 flex items-center gap-2 font-bold text-xs uppercase tracking-widest">
        <Upload size={14} /> Upload Documents
      </div>
      <input
        className="w-full bg-black border border-white/20 p-3 rounded text-white mb-3 text-sm outline-none focus:border-yellow-500"
        placeholder="Document URL"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        required
      />
      <GoldButton fullWidth size="sm" disabled={loading} type="submit">
        {loading ? "Submitting..." : "Submit"}
      </GoldButton>
    </form>
  );
};

const MenuItem = ({ icon, label, onClick }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/10 rounded-xl transition-colors group"
  >
    <div className="flex items-center gap-3">
      <div className="text-gray-400 group-hover:text-yellow-300 transition-colors">
        {icon}
      </div>
      <span className="font-bold text-sm text-white group-hover:text-yellow-300">
        {label}
      </span>
    </div>
    <ChevronRight
      size={16}
      className="text-gray-600 group-hover:translate-x-1 transition-transform group-hover:text-yellow-400"
    />
  </button>
);

export default ProfileSidebar;
