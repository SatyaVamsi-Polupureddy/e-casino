import { useState, useEffect } from "react";
import tenantService from "../../services/tenantService";
import toast from "react-hot-toast";
import { FileText, CheckCircle, Shield, XCircle } from "lucide-react";

const PlayerApprovalsTab = () => {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getPendingPlayers();
      setPending(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const getSafeUrl = (url) => {
    if (!url) return "#";
    return url.startsWith("http") ? url : `https://${url}`;
  };

  const handleReview = async (id, status) => {
    if (!confirm(`${status} this player's KYC?`)) return;
    try {
      await tenantService.reviewPlayerKYC(id, status);
      toast.success(`Player ${status}`);
      fetchPending();
    } catch (e) {
      toast.error("Error updating status");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-display text-white mb-6 flex items-center gap-2">
        <Shield className="text-yellow-500" /> Pending Approvals
      </h2>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Player</th>
              <th className="p-4">Submitted At</th>
              <th className="p-4">Document</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : pending.length === 0 ? (
              <tr>
                <td colSpan="4" className="p-8 text-center text-gray-500">
                  No pending requests.
                </td>
              </tr>
            ) : (
              pending.map((p) => (
                <tr
                  key={p.player_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4">
                    <div className="font-bold text-white">{p.username}</div>
                    <div className="text-xs text-gray-500">{p.email}</div>
                  </td>
                  <td className="p-4 text-gray-400 font-mono text-xs">
                    {new Date(
                      p.submitted_at || p.created_at,
                    ).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <a
                      href={getSafeUrl(p.document_reference)}
                      target="_blank"
                      rel="noreferrer"
                      className={`flex items-center gap-1 ${
                        p.document_reference
                          ? "text-yellow-500 hover:underline cursor-pointer"
                          : "text-gray-600 cursor-not-allowed"
                      }`}
                      onClick={(e) =>
                        !p.document_reference && e.preventDefault()
                      }
                    >
                      <FileText size={14} />
                      {p.document_reference ? "View Doc" : "No Doc"}
                    </a>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => handleReview(p.player_id, "APPROVED")}
                        className="hover:cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors text-xs font-bold uppercase "
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReview(p.player_id, "REJECTED")}
                        className="hover:cursor-pointer flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30 transition-colors text-xs font-bold uppercase"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
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

export default PlayerApprovalsTab;
