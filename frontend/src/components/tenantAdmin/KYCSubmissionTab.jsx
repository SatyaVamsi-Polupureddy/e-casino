import { useState, useEffect } from "react";
import GoldButton from "../../components/ui/GoldButton";
import { Check } from "lucide-react";
import tenantService from "../../services/tenantService";
import toast from "react-hot-toast";
const KYCSubmissionTab = ({ tenantProfile }) => {
  const [myKycForm, setMyKycForm] = useState({
    type: "BUSINESS_LICENSE",
    url: "",
  });
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
  return (
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
            <option value="BUSINESS_LICENSE" className="bg-[#040029]">
              License
            </option>
            <option value="ID_PROOF" className="bg-[#040029]">
              ID
            </option>
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
  );
};

export default KYCSubmissionTab;
