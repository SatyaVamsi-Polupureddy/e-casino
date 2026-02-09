import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GoldButton from "../ui/GoldButton";
import InputField from "../ui/InputField";
import adminService from "../../services/adminService";
import { RefreshCw, Coins } from "lucide-react";
const CurrenciesTab = () => {
  const [form, setForm] = useState({
    code: "",
    name: "",
    symbol: "$",
    precision: 2,
  });
  const [currencies, setCurrencies] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    fetchCurrencies();
  }, []);

  const fetchCurrencies = async () => {
    setLoading(true);
    try {
      const res = await adminService.getCurrencies();
      setCurrencies(res.data);
    } catch (e) {
      console.error(e);
      toast.error("Failed to load currencies");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminService.createCurrency({
        currency_code: form.code.toUpperCase(),
        currency_name: form.name,
        symbol: form.symbol,
        decimal_precision: parseInt(form.precision),
      });
      toast.success("Currency Added");
      setForm({ code: "", name: "", symbol: "$", precision: 2 });
      fetchCurrencies();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error adding currency");
    }
  };

  return (
    <div className="max-w-3xl mx-auto mt-8 space-y-8">
      <div className="bg-[#040029] p-6 rounded-xl border border-yellow-500/30 shadow-lg relative overflow-hidden">
        <h3 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
          <Coins size={20} /> Add New Currency
        </h3>

        <form onSubmit={handleCreate} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <InputField
              placeholder="Code (e.g. BTC)"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
              className="uppercase"
            />
            <InputField
              placeholder="Symbol (e.g. ₿)"
              value={form.symbol}
              onChange={(e) => setForm({ ...form, symbol: e.target.value })}
            />
            <InputField
              type="number"
              placeholder="Precision (e.g. 8)"
              value={form.precision}
              onChange={(e) => setForm({ ...form, precision: e.target.value })}
            />
          </div>
          <InputField
            placeholder="Currency Name (e.g. Bitcoin)"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <GoldButton fullWidth type="submit">
            Add Currency
          </GoldButton>
        </form>
      </div>

      {/* CURRENCY LIST */}
      <div className="bg-[#040029] rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Supported Currencies
          </h3>
          <button
            onClick={fetchCurrencies}
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
                <th className="p-4">Code</th>
                <th className="p-4">Symbol</th>
                <th className="p-4">Name</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {currencies.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500">
                    No currencies found.
                  </td>
                </tr>
              ) : (
                currencies.map((c) => (
                  <tr
                    key={c.currency_code}
                    className="hover:bg-white/10 transition-colors group"
                  >
                    <td className="p-4 font-bold text-yellow-500">
                      {c.currency_code}
                    </td>
                    <td className="p-4 text-white text-lg">
                      {c.symbol || "Rs."}
                    </td>
                    <td className="p-4 text-gray-300">{c.currency_name}</td>
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

export default CurrenciesTab;
