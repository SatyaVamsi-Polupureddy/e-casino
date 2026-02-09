import { useState, useEffect } from "react";
import tenantService from "../../services/tenantService";
import toast from "react-hot-toast";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import { UserPlus, Plus } from "lucide-react";

const StaffManagementTab = () => {
  const [staff, setStaff] = useState([]);
  const [filteredStaff, setFilteredStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [newStaff, setNewStaff] = useState({
    email: "",
    password: "",
    role: "TENANT_STAFF",
  });

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    if (!search) setFilteredStaff(staff);
    else
      setFilteredStaff(
        staff.filter((s) =>
          s.email.toLowerCase().includes(search.toLowerCase()),
        ),
      );
  }, [search, staff]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const res = await tenantService.getAllStaff();
      setStaff(res.data);
      setFilteredStaff(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await tenantService.createTenantUser(
        newStaff.email,
        newStaff.password,
        newStaff.role,
      );
      toast.success("Staff Created");
      setIsCreateOpen(false);
      setNewStaff({ email: "", password: "", role: "TENANT_STAFF" });
      fetchStaff();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error");
    }
  };

  const changeStatus = async (email, status) => {
    if (!confirm(`Change status to ${status}?`)) return;
    try {
      await tenantService.updateUserStatus(email, status);
      toast.success("Status Updated");
      fetchStaff();
    } catch (e) {
      toast.error("Error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-white flex items-center gap-2">
          <UserPlus className="text-yellow-500" /> Staff & Team
        </h2>
        <div className="flex gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search staff..."
              className="bg-black/40 border border-white/20 p-2 pl-3 rounded text-white text-sm focus:border-yellow-500 outline-none w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <GoldButton
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 text-sm hover:cursor-pointer"
          >
            <Plus size={16} /> Add New
          </GoldButton>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[600px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Email</th>
              <th className="p-4">Role</th>
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
              filteredStaff.map((s) => (
                <tr
                  key={s.tenant_user_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 text-white font-medium">{s.email}</td>
                  <td className="p-4">
                    <span className="bg-white/10 px-2 py-1 rounded text-xs text-gray-300 font-mono">
                      {s.role || "TENANT_ADMIN"}
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        s.status === "ACTIVE"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 ">
                      {s.status !== "ACTIVE" ? (
                        <button
                          onClick={() => changeStatus(s.email, "ACTIVE")}
                          className="text-green-400 hover:bg-green-500/10 p-1 rounded font-bold text-xs hover:cursor-pointer"
                        >
                          ACTIVATE
                        </button>
                      ) : (
                        <button
                          onClick={() => changeStatus(s.email, "SUSPENDED")}
                          className="text-red-400 hover:bg-red-500/10 p-1 rounded font-bold text-xs hover:cursor-pointer"
                        >
                          SUSPEND
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* CREATE STAFF */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-md animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-white mb-4">
              Add Team Member
            </h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Role
                </label>
                <select
                  className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-white"
                  value={newStaff.role}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, role: e.target.value })
                  }
                >
                  <option value="TENANT_STAFF" className="bg-[#040029]">
                    Staff
                  </option>
                  <option value="TENANT_ADMIN" className="bg-[#040029]">
                    Admin
                  </option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Email
                </label>
                <InputField
                  value={newStaff.email}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, email: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 uppercase font-bold">
                  Password
                </label>
                <InputField
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-white"
                  type="password"
                  value={newStaff.password}
                  onChange={(e) =>
                    setNewStaff({ ...newStaff, password: e.target.value })
                  }
                  required
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2 bg-black/40 border border-white/20 hover:cursor-pointer hover:bg-white/10 rounded-lg font-bold text-gray-300"
                >
                  Cancel
                </button>
                <GoldButton
                  type="submit"
                  className="flex-1 hover:cursor-pointer"
                >
                  Create Member
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagementTab;
