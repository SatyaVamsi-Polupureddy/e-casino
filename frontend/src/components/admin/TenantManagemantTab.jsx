import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GoldButton from "../ui/GoldButton";
import InputField from "../ui/InputField";
import adminService from "../../services/adminService";
import { X, Building, Gamepad2, Plus, Edit2, Search } from "lucide-react";

const TenantManagementTab = ({ countries, currencies }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filteredTenants, setFilteredTenants] = useState([]);
  const [editingTenant, setEditingTenant] = useState(null);
  const [viewingGames, setViewingGames] = useState(null);
  const [form, setForm] = useState({
    tenant_name: "",
    country_id: "",
    currency_code: "",
    admin_email: "",
    admin_password: "",
    kyc_id: "",
  });

  useEffect(() => {
    fetchTenants();
  }, []);

  useEffect(() => {
    if (!search) setFilteredTenants(tenants);
    else
      setFilteredTenants(
        tenants.filter((t) =>
          t.tenant_name.toLowerCase().includes(search.toLowerCase()),
        ),
      );
  }, [search, tenants]);

  const fetchTenants = async () => {
    setLoading(true);
    try {
      const res = await adminService.getAllTenants();
      setTenants(res.data);
      setFilteredTenants(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!window.confirm("Manually create this casino?")) return;
    try {
      await adminService.createTenant({
        ...form,
        country_id: parseInt(form.country_id),
      });
      toast.success("Tenant Created!");
      setIsCreateOpen(false);
      setForm({
        tenant_name: "",
        country_id: "",
        currency_code: "",
        admin_email: "",
        admin_password: "",
        kyc_id: "",
      });
      fetchTenants();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error");
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!editingTenant) return;

    if (editingTenant.status === "TERMINATED") {
      if (!window.confirm("WARNING: Terminating a casino is severe. Continue?"))
        return;
    }

    try {
      await adminService.updateTenantStatus(
        editingTenant.tenant_id,
        editingTenant.status,
      );
      toast.success(`Tenant ${editingTenant.status}`);
      setEditingTenant(null);
      fetchTenants();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Update failed");
    }
  };

  //get game count
  const getGameCount = (gameString) => {
    if (!gameString) return 0;
    return gameString.split(",").length;
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-display text-white flex items-center gap-2">
          <Building className="text-yellow-500" /> Manage Casinos
        </h2>
        <div className="flex gap-4">
          <div className="relative hidden md:block">
            <input
              type="text"
              placeholder="Search Casinos..."
              className="bg-black/40 border border-white/20 p-2 pl-8 rounded text-white text-sm focus:border-yellow-500 outline-none w-48"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <Search
              className="absolute left-2 top-2.5 text-gray-400"
              size={14}
            />
          </div>
          <GoldButton
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 text-sm"
          >
            <Plus size={16} /> Add Tenant
          </GoldButton>
        </div>
      </div>

      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden overflow-x-auto shadow-xl">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-black/40 text-gray-400 uppercase font-bold text-xs">
            <tr>
              <th className="p-4">Casino Name</th>
              <th className="p-4">Location</th>
              <th className="p-4">KYC Status</th>
              <th className="p-4">Active Games</th>
              <th className="p-4 text-right">Account Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {loading ? (
              <tr>
                <td colSpan="6" className="p-8 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : (
              filteredTenants.map((t) => (
                <tr
                  key={t.tenant_id}
                  className="hover:bg-white/5 transition-colors"
                >
                  <td className="p-4 font-bold text-white">{t.tenant_name}</td>
                  <td className="p-4 text-gray-300">{t.country_name}</td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        t.kyc_status === "APPROVED"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-yellow-500/20 text-yellow-400"
                      }`}
                    >
                      {t.kyc_status}
                    </span>
                  </td>

                  <td className="p-4">
                    {t.game_names ? (
                      <button
                        onClick={() => setViewingGames(t)}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/70 hover:cursor-pointer hover:text-black transition-all border border-yellow-500/20"
                      >
                        <Gamepad2
                          size={14}
                          className="group-hover:scale-110 transition-transform"
                        />
                        <span className="font-bold text-xs">
                          {getGameCount(t.game_names)} Games
                        </span>
                      </button>
                    ) : (
                      <span className="text-gray-600 text-xs italic">
                        No games active
                      </span>
                    )}
                  </td>

                  <td className="p-4 text-right">
                    <span
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        t.status === "ACTIVE"
                          ? "bg-blue-500/20 text-blue-400"
                          : t.status === "SUSPENDED"
                            ? "bg-orange-500/20 text-orange-400"
                            : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button
                      onClick={() => setEditingTenant(t)}
                      className="p-1.5 bg-transparent rounded text-gray-300 transition-colors hover:text-yellow-600 hover:cursor-pointer"
                      title="Edit Status"
                    >
                      <Edit2 size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* GAMES LIST */}
      {viewingGames && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500/50 w-full max-w-md animate-in zoom-in duration-200 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-500/10 rounded-lg">
                  <Gamepad2 className="text-yellow-500" size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Active Games</h3>
                  <p className="text-xs text-gray-400 uppercase tracking-widest">
                    {viewingGames.tenant_name}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setViewingGames(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar pr-2">
              <div className="flex flex-col gap-2">
                {viewingGames.game_names.split(",").map((game, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded hover:bg-white/20 border border-white/20 transition-colors"
                  >
                    <span className="text-xs font-mono text-gray-500 w-6 text-right">
                      {(index + 1).toString().padStart(2, "0")}
                    </span>
                    <span className="text-sm font-medium text-white">
                      {game.trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-white/10 flex justify-end">
              <button
                onClick={() => setViewingGames(null)}
                className="px-4 py-2 bg-black/40 hover:border-yellow-600 border border-white/20 text-white text-sm font-bold rounded transition-colors"
              >
                Close List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE TENANT  */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-2xl animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">
                Register New Casino
              </h3>
              <button onClick={() => setIsCreateOpen(false)}>
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-6">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-1">
                  Casino Name
                </label>
                <InputField
                  value={form.tenant_name}
                  onChange={(e) =>
                    setForm({ ...form, tenant_name: e.target.value })
                  }
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Country
                  </label>
                  <select
                    className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-gray-300"
                    value={form.country_id}
                    onChange={(e) =>
                      setForm({ ...form, country_id: e.target.value })
                    }
                    required
                  >
                    <option value="" className="bg-[#040029]">
                      Select
                    </option>
                    {countries.map((c) => (
                      <option
                        key={c.country_id}
                        value={c.country_id}
                        className="bg-[#040029]"
                      >
                        {c.country_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Currency
                  </label>
                  <select
                    className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-gray-300"
                    value={form.currency_code}
                    onChange={(e) =>
                      setForm({ ...form, currency_code: e.target.value })
                    }
                    required
                  >
                    <option value="" className="bg-[#040029]">
                      Select
                    </option>
                    {currencies.map((c) => (
                      <option
                        key={c.currency_code}
                        value={c.currency_code}
                        className="bg-[#040029]"
                      >
                        {c.currency_code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Admin Email
                  </label>
                  <InputField
                    type="email"
                    value={form.admin_email}
                    onChange={(e) =>
                      setForm({ ...form, admin_email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 uppercase mb-1">
                    Password
                  </label>
                  <InputField
                    type="password"
                    value={form.admin_password}
                    onChange={(e) =>
                      setForm({ ...form, admin_password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <GoldButton fullWidth type="submit">
                Launch Casino
              </GoldButton>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STATUS  */}
      {editingTenant && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500 w-full max-w-sm animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Manage Casino</h3>
              <button onClick={() => setEditingTenant(null)}>
                <X size={20} className="text-gray-400 hover:text-white" />
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-400 uppercase text-xs mb-1">
                Casino
              </p>
              <p className="text-lg font-bold text-white">
                {editingTenant.tenant_name}
              </p>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-6">
              <div>
                <label className="block text-xs text-gray-400 uppercase mb-2">
                  Account Status
                </label>
                <select
                  className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
                  value={editingTenant.status}
                  onChange={(e) =>
                    setEditingTenant({
                      ...editingTenant,
                      status: e.target.value,
                    })
                  }
                >
                  <option value="ACTIVE" className="bg-[#040029]">
                    ACTIVE (Normal Operation)
                  </option>
                  <option value="SUSPENDED" className="bg-[#040029]">
                    SUSPENDED (Temporary Lock)
                  </option>
                  <option value="TERMINATED" className="bg-[#040029]">
                    TERMINATED (Permanent Ban)
                  </option>
                </select>
              </div>

              {editingTenant.status === "TERMINATED" && (
                <div className="p-3 bg-red-900/20 border border-red-500/30 rounded text-red-300 text-xs flex gap-2">
                  <AlertTriangle size={16} className="shrink-0" />
                  <p>
                    Termination will disable the casino and all its admins/staff
                    immediately.
                  </p>
                </div>
              )}

              <GoldButton fullWidth type="submit">
                Update Status
              </GoldButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantManagementTab;
