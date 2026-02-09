import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import adminService from "../../services/adminService";
import { Inbox, Check, X } from "lucide-react";
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
        <div className="flex flex-col items-center justify-center h-64 text-gray-500 bg-white/5 rounded-lg border border-white/10">
          <Inbox size={48} className="mb-4 opacity-50" />
          <p>No pending approvals.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {list.map((t) => (
            <div
              key={t.tenant_id}
              className="bg-white/5 p-4 rounded-lg border border-white/10 flex justify-between items-center"
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

export default KYCRequestsTab;
