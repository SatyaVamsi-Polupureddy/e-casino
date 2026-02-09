import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GoldButton from "../ui/GoldButton";
import InputField from "../ui/InputField";
import adminService from "../../services/adminService";
import { Users, UserPlus, ShieldCheck } from "lucide-react";

const AdminManagementTab = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null); // { email, status }

  const [newAdmin, setNewAdmin] = useState({ email: "", password: "" });

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllAdmins();
      setAdmins(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createSuperAdmin(newAdmin.email, newAdmin.password);
      toast.success("Admin Created");
      setIsCreateOpen(false);
      setNewAdmin({ email: "", password: "" });
      fetchAdmins();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    try {
      await adminService.updateSuperAdminStatus(
        editingStatus.email,
        editingStatus.status,
      );
      toast.success("Status Updated");
      setEditingStatus(null);
      fetchAdmins();
    } catch (e) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-white flex items-center gap-2">
          <Users className="text-yellow-500" /> Super Admins
        </h2>
        <GoldButton
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-2 text-sm"
        >
          <UserPlus size={16} /> Add Admin
        </GoldButton>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Created At</th>
              <th className="p-4">Status</th>
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
            ) : (
              admins.map((a) => (
                <tr
                  key={a.email}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white font-medium">{a.email}</td>
                  <td className="p-4 text-gray-400 font-mono text-xs">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        a.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {a.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingStatus(a)}
                      className="text-xs text-gray-300 hover:text-yellow-400 border border-white/20 hover:border-yellow-600 px-2 py-1 rounded hover:cursor-pointer"
                    >
                      Update Status
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE ADMIN MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-md animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">
              Create Super Admin
            </h3>
            <div className="bg-red-900/20 border border-red-900/50 p-3 rounded mb-4 text-sm text-red-200">
              <ShieldCheck className="inline w-4 h-4 mr-1" /> Full system access
              granted.
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <InputField
                placeholder="Email"
                value={newAdmin.email}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, email: e.target.value })
                }
                required
              />
              <InputField
                type="password"
                placeholder="Password"
                value={newAdmin.password}
                onChange={(e) =>
                  setNewAdmin({ ...newAdmin, password: e.target.value })
                }
                required
              />
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2 bg-black/40 rounded-lg border border-white/20"
                >
                  Cancel
                </button>
                <GoldButton type="submit" className="flex-1">
                  Create
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STATUS MODAL */}
      {editingStatus && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-sm animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">Update Access</h3>
            <p className="text-sm text-gray-400 mb-4">
              User: {editingStatus.email}
            </p>
            <form onSubmit={handleUpdateStatus}>
              <select
                className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-white mb-4 focus:outline-none hover:cursor-pointer"
                value={editingStatus.status}
                onChange={(e) =>
                  setEditingStatus({ ...editingStatus, status: e.target.value })
                }
              >
                <option value="ACTIVE" className="bg-[#040029]">
                  Active
                </option>
                <option value="SUSPENDED" className="bg-[#040029]">
                  Suspended
                </option>
                <option value="TERMINATED" className="bg-[#040029]">
                  Terminated
                </option>
              </select>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStatus(null)}
                  className="flex-1 py-2 bg-black/40 rounded-lg border border-white/20 hover:bg-white/10"
                >
                  Cancel
                </button>
                <GoldButton type="submit" className="flex-1">
                  Update
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminManagementTab;
