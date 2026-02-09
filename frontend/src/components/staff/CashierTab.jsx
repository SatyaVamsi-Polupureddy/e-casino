import { useState } from "react";

import toast from "react-hot-toast";
import staffService from "../../services/staffService";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import { Search, ArrowDownCircle, ArrowUpCircle } from "lucide-react";

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

      <form onSubmit={handleSearch} className="flex gap-2 mb-8">
        <input
          type="email"
          placeholder="Player Email"
          className="flex-1 bg-black/40 border border-white/30 p-3 rounded-lg text-white focus:border-yellow-500 outline-none transition-colors"
          value={searchEmail}
          onChange={(e) => setSearchEmail(e.target.value)}
          required
        />
        <GoldButton type="submit">
          <Search size={20} />
        </GoldButton>
      </form>

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

          {txnStage === "idle" && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
              <div className="p-4 bg-black/40 rounded border border-white/10">
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Transaction Amount ($)
                </label>
                <InputField
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleInitiate("DEPOSIT")}
                  className="flex-1 bg-green-600 hover:bg-green-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors hover:cursor-pointer"
                >
                  <ArrowDownCircle size={18} /> Deposit
                </button>
                <button
                  onClick={() => handleInitiate("WITHDRAW")}
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold flex items-center justify-center gap-2 transition-colors hover:cursor-pointer"
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
                <InputField
                  type="text"
                  placeholder="000000"
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

export default CashierTab;
