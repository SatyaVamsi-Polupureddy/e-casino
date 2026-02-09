import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GoldButton from "../ui/GoldButton";
import InputField from "../ui/InputField";
import adminService from "../../services/adminService";
import { RefreshCw, Globe, Flag } from "lucide-react";
const CountriesTab = ({ currencies }) => {
  const [form, setForm] = useState({
    name: "",
    iso2: "",
    iso3: "",
  });
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchCountries();
  }, []);

  const fetchCountries = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCountries();
      setCountries(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load countries");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCountry({
        country_name: form.name,
        iso2_code: form.iso2,
        iso3_code: form.iso3,
        default_currency_code: form.currency,
        default_timezone: "UTC",
      });
      toast.success("Country Added");
      setForm({ name: "", iso2: "", iso3: "", currency: "" });
      fetchCountries();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error adding country");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500/30 shadow-lg relative overflow-hidden">
        <h3 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
          <Globe size={20} /> Add New Country
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          <InputField
            placeholder="Country Name (e.g. United States)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              placeholder="ISO2 (e.g. US)"
              value={form.iso2}
              onChange={(e) => setForm({ ...form, iso2: e.target.value })}
              maxLength={2}
              required
              className="bg-black/40 border border-white/20 p-3 rounded-lg w-full text-gray-300 uppercase focus:outline-none focus:border-casino-gold transition-colors"
            />
            <input
              className="bg-black/40 border border-white/20 p-3 rounded-lg w-full text-gray-300 uppercase focus:outline-none focus:border-casino-gold transition-colors"
              placeholder="ISO3 (e.g. USA)"
              value={form.iso3}
              onChange={(e) => setForm({ ...form, iso3: e.target.value })}
              maxLength={3}
              required
            />
            <select
              className="bg-black/40 border border-white/20 p-3 rounded-lg w-full text-gray-300"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              required
            >
              <option value="" disabled className="bg-[#040029]">
                Select Default Currency
              </option>
              {currencies.map((c) => (
                <option
                  key={c.currency_code}
                  value={c.currency_code}
                  className="bg-[#040029]"
                >
                  {c.currency_code} ({c.currency_name})
                </option>
              ))}
            </select>
          </div>

          <GoldButton fullWidth type="submit">
            Add Country
          </GoldButton>
        </form>
      </div>

      {/*  COUNTRY LIST */}
      <div className="bg-[#040029] rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Available Countries
          </h3>
          <button
            onClick={fetchCountries}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            title="Refresh List"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Codes</th>
                <th className="p-4">Currency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {countries.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No countries configured.
                  </td>
                </tr>
              ) : (
                countries.map((c) => (
                  <tr
                    key={c.country_id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4 font-bold text-white flex items-center gap-2">
                      <Flag size={14} className="text-gray-500" />{" "}
                      {c.country_name}
                    </td>
                    <td className="p-4 text-gray-300 font-mono text-xs">
                      <span className="bg-white/10 px-1.5 py-0.5 rounded text-yellow-500">
                        {c.iso2_code}
                      </span>
                      <span className="mx-2 text-gray-600">/</span>
                      <span className="text-gray-400">{c.iso3_code}</span>
                    </td>
                    <td className="p-4 text-cyan-400 font-bold">
                      {c.default_currency_code}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CountriesTab;
