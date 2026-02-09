import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import GoldButton from "../ui/GoldButton";
import adminService from "../../services/adminService";
import { RefreshCw, Edit2 } from "lucide-react";
const ExchangeRatesTab = ({ currencies }) => {
  const [form, setForm] = useState({ base: "USD", quote: "", rate: "" });
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);

  // 1. Fetch Rates on Mount
  useEffect(() => {
    fetchRates();
  }, []);

  const fetchRates = async () => {
    setLoading(true);
    try {
      // Ensure adminService.getExchangeRates() calls GET /exchange-rates
      const res = await adminService.getExchangeRates();
      setRates(res.data);
    } catch (e) {
      console.error("Failed to fetch rates", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.quote || !form.rate) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      // 2. Call POST (Upsert)
      await adminService.createExchangeRate({
        base_currency: form.base, // Map to backend expected key
        quote_currency: form.quote, // Map to backend expected key
        rate: parseFloat(form.rate),
      });

      toast.success("Exchange Rate Saved");
      setForm({ ...form, rate: "" }); // Clear rate only, keep currencies for workflow

      // 3. Refresh Table immediately
      fetchRates();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Error saving rate");
    }
  };

  // Helper to populate form for editing
  const handleEdit = (rate) => {
    setForm({
      base: rate.base,
      quote: rate.quote,
      rate: rate.rate,
    });
    // Scroll to top for better UX on mobile
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="max-w-4xl mx-auto mt-8 space-y-8">
      {/* --- INPUT FORM --- */}
      <div className="bg-[#040029] p-6 rounded-xl border border-white/20 shadow-lg relative overflow-hidden">
        {/* <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent opacity-50"></div> */}

        <h2 className="text-xl font-bold text-yellow-500 mb-6 flex items-center gap-2">
          Manage Exchange Rates
        </h2>

        <form
          onSubmit={handleSave}
          className="flex flex-col md:flex-row gap-4 items-end"
        >
          <div className="flex-1 w-full">
            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">
              Base
            </label>
            <select
              className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-gray-300 outline-none focus:border-yellow-500 transition-colors"
              value={form.base}
              onChange={(e) => setForm({ ...form, base: e.target.value })}
            >
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

          <div className="flex-1 w-full">
            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">
              Quote (Target)
            </label>
            <select
              className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-gray-300 outline-none focus:border-yellow-500 transition-colors"
              value={form.quote}
              onChange={(e) => setForm({ ...form, quote: e.target.value })}
            >
              <option value="" className="bg-[#040029]">
                Select...
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

          <div className="flex-1 w-full">
            <label className="text-xs text-gray-500 uppercase font-bold mb-1 block">
              Rate
            </label>
            <input
              type="number"
              step="0.000001"
              placeholder="e.g. 1.25"
              className="w-full bg-black/40 border border-white/20 p-3 rounded-lg text-white font-mono outline-none focus:border-yellow-500 transition-colors"
              value={form.rate}
              onChange={(e) => setForm({ ...form, rate: e.target.value })}
            />
          </div>

          <div className="w-full md:w-auto ">
            <GoldButton type="submit" className="w-full py-3 px-8">
              {loading ? "Saving..." : "Save Rate"}
            </GoldButton>
          </div>
        </form>
      </div>

      {/* --- DATA TABLE --- */}
      <div className="bg-[#040029] rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-white/5">
          <h3 className="text-white font-bold text-sm uppercase tracking-wider">
            Active Market Rates
          </h3>
          <button
            onClick={fetchRates}
            className="p-2 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
            title="Refresh Table"
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-black/40 text-gray-500 font-bold uppercase text-xs">
              <tr>
                <th className="p-4">Pair</th>
                <th className="p-4 text-right">Rate</th>
                <th className="p-4 text-right">Last Updated</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {rates.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-gray-500">
                    No exchange rates configured yet.
                  </td>
                </tr>
              ) : (
                rates.map((rate) => (
                  <tr
                    key={rate.id}
                    className="hover:bg-white/5 transition-colors group"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="text-yellow-500 font-bold">
                          {rate.base}
                        </span>
                        <span className="text-gray-600">/</span>
                        <span className="text-white font-bold">
                          {rate.quote}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-yellow-500 text-base">
                      {parseFloat(rate.rate).toFixed(6)}
                    </td>
                    <td className="p-4 text-right text-gray-500 text-xs font-mono">
                      {new Date(rate.created_at).toLocaleString()}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleEdit(rate)}
                        className="p-2 hover:cursor-pointer text-gray-400 hover:text-yellow-400 rounded-lg transition-all"
                        title="Edit Rate"
                      >
                        <Edit2 size={14} />
                      </button>
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

export default ExchangeRatesTab;
