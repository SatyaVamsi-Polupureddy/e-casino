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
            <option value="BUSINESS_LICENSE">License</option>
            <option value="ID_PROOF">ID</option>
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
