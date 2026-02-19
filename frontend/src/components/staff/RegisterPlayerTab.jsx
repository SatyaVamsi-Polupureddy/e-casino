import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import staffService from "../../services/staffService";
import api from "../../services/api"; // Added API import for fetching countries
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import { UserPlus, Upload } from "lucide-react";

const RegisterPlayerTab = () => {
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    country_id: 1, // Defaulting to 1 as per your original code
  });
  const [kycForm, setKycForm] = useState({ email: "", url: "" });
  const [countries, setCountries] = useState([]); // New state for countries

  // Fetch countries on component mount
  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const res = await api.get("/auth/countries");
        setCountries(res.data);
      } catch (err) {
        console.error("Failed to fetch countries", err);
        toast.error("Failed to load countries");
      }
    };
    fetchCountries();
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await staffService.registerPlayer({
        ...form,
        country_id: parseInt(form.country_id, 10), // Ensure it's an integer
      });
      toast.success("Player Registered! You can now upload their ID.");
      setKycForm({ ...kycForm, email: form.email });
      setForm({ username: "", email: "", password: "", country_id: 1 });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error registering player");
    }
  };

  const handleUploadKYC = async (e) => {
    e.preventDefault();
    try {
      await staffService.uploadKYC(kycForm.email, kycForm.url);
      toast.success("KYC Uploaded successfully!");
      setKycForm({ email: "", url: "" });
    } catch (err) {
      toast.error(err.response?.data?.detail || "Error uploading KYC");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
      {/* Registration Form */}
      <div className="bg-white/5 p-8 rounded-xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-display text-yellow-500 mb-6 flex items-center gap-2">
          <UserPlus /> New Player Registration
        </h2>
        <form onSubmit={handleRegister} className="space-y-4">
          <InputField
            type="text"
            placeholder="Username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required
          />
          <InputField
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
          <InputField
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />

          {/* NEW: Country Dropdown */}
          <div className="relative">
            <select
              value={form.country_id}
              onChange={(e) => setForm({ ...form, country_id: e.target.value })}
              className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors appearance-none cursor-pointer"
              required
            >
              <option value="" disabled className="text-gray-500 bg-[#0b0a1f]">
                Select Country
              </option>
              {countries.map((country) => (
                <option
                  key={country.country_id}
                  value={country.country_id}
                  className="bg-[#0b0a1f] text-white"
                >
                  {country.country_name || country.name}
                </option>
              ))}
            </select>
            {/* Custom Arrow for Dropdown */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-4 h-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>

          <GoldButton fullWidth type="submit">
            Create Player Account
          </GoldButton>
        </form>
      </div>

      {/* KYC Upload */}
      <div className="bg-white/5 p-8 rounded-xl border border-white/10 shadow-lg">
        <h2 className="text-xl font-display text-yellow-500 mb-6 flex items-center gap-2">
          <Upload /> Quick KYC Upload
        </h2>
        <p className="text-sm text-gray-400 mb-4">
          Upload ID document link for existing or newly registered players.
        </p>
        <form onSubmit={handleUploadKYC} className="space-y-4">
          <InputField
            type="email"
            placeholder="Player Email"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
            value={kycForm.email}
            onChange={(e) => setKycForm({ ...kycForm, email: e.target.value })}
            required
          />
          <InputField
            type="text"
            placeholder="Document URL (e.g., S3 Link)"
            className="w-full bg-black/40 border border-white/20 p-3 rounded text-white focus:border-yellow-500 outline-none transition-colors"
            value={kycForm.url}
            onChange={(e) => setKycForm({ ...kycForm, url: e.target.value })}
            required
          />
          <button className="w-full py-3 bg-blue-600/20 text-blue-300 hover:cursor-pointer border border-blue-600/50 rounded hover:bg-blue-600/30 transition-colors font-bold uppercase tracking-wider">
            Upload Document
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterPlayerTab;
