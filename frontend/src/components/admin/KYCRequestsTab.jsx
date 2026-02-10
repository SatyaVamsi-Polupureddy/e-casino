import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import adminService from "../../services/adminService";
import { Inbox, Check, X, FileText } from "lucide-react";

const KYCRequestsTab = () => {
  const [list, setList] = useState([]);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = () => {
    adminService
      .getPendingKYC()
      .then((res) => setList(res.data))
      .catch(console.error);
  };

  const handleAction = async (id, action) => {
    if (!confirm(`${action.toUpperCase()} this tenant's KYC?`)) return;
    try {
      if (action === "approve") await adminService.approveKYC(id);
      else await adminService.rejectKYC(id, "Admin Rejected");

      setList((prev) => prev.filter((i) => i.tenant_id !== id));
      toast.success(`Tenant ${action}d successfully`);
    } catch (e) {
      console.error(e);
      toast.error("Error processing request");
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
        <div className="grid gap-6">
          {list.map((t) => (
            <div
              key={t.tenant_id}
              className="bg-white/5 p-6 rounded-xl border border-white/10 flex flex-col md:flex-row justify-between gap-6"
            >
              {/* Tenant Info & Documents */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-4">
                  <h4 className="font-bold text-xl text-white">
                    {t.tenant_name}
                  </h4>
                  <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded border border-yellow-500/30">
                    {new Date(t.submitted_at).toLocaleDateString()}
                  </span>
                </div>

                {/* DYNAMIC GRID LOGIC:
                   If documents length is 1, use 'grid-cols-1'. 
                   If more, use 'sm:grid-cols-2' to split them.
                */}
                <div
                  className={`grid gap-3 ${
                    t.documents && t.documents.length === 1
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2"
                  }`}
                >
                  {t.documents && t.documents.length > 0 ? (
                    t.documents.map((doc, idx) => (
                      <div
                        key={idx}
                        className="bg-black/20 p-3 rounded border border-white/5 flex items-center justify-between group hover:border-white/20 transition-colors"
                      >
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText
                            size={18}
                            className="text-gray-400 shrink-0"
                          />
                          <div className="flex flex-col overflow-hidden">
                            <span className="text-xs font-bold text-gray-300 uppercase truncate">
                              {doc.type.replace("_", " ")}
                            </span>
                            <span className="text-[10px] text-gray-500 truncate">
                              {doc.url}
                            </span>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded text-white ml-2 shrink-0 transition-colors"
                        >
                          View
                        </a>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500 text-sm italic">
                      No documents found.
                    </p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 justify-center border-t md:border-t-0 md:border-l border-white/10 pt-4 md:pt-0 md:pl-6 shrink-0">
                <button
                  onClick={() => handleAction(t.tenant_id, "approve")}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded flex gap-2 items-center justify-center transition-all hover:cursor-pointer"
                >
                  <Check size={18} /> Approve
                </button>
                <button
                  onClick={() => handleAction(t.tenant_id, "reject")}
                  className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded flex gap-2 items-center justify-center transition-all hover:cursor-pointer"
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
