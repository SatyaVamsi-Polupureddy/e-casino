import React, { useState, useRef, useLayoutEffect } from "react";
import toast from "react-hot-toast";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useNavigate } from "react-router-dom";
import GoldButton from "../../components/ui/GoldButton";
import InputField from "../../components/ui/InputField";
import authService from "../../services/authService"; // Using the Service now
import api from "../../services/api"; // Keep for registration if needed
import { User, Shield, Crown } from "lucide-react"; // Icons for roles

// Register GSAP Plugin
gsap.registerPlugin(ScrollTrigger);

const AuthPage = () => {
  const navigate = useNavigate();

  // State
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // NEW: Role Selection State
  const [selectedRole, setSelectedRole] = useState("PLAYER");

  // Form Data
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    referral_code: "",
  });

  // Refs for Animation
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const formRef = useRef(null);
  const heroTextRef = useRef(null);

  // --- GSAP ANIMATION ---
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=100%",
          scrub: 1,
          pin: true,
        },
      });

      tl.to(heroTextRef.current, { opacity: 0, y: -50, duration: 0.5 });
      tl.to(videoRef.current, { xPercent: -30, scale: 0.9, duration: 1 }, "<");
      tl.fromTo(
        formRef.current,
        { xPercent: 100, opacity: 0 },
        { xPercent: 0, opacity: 1, duration: 1 },
        "<",
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  // --- HELPERS ---
  const validateForm = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return false;
    }
    if (!isLogin && (!formData.username || formData.username.length < 3)) {
      setError("Username must be at least 3 characters long.");
      return false;
    }
    return true;
  };

  const handleChange = (e) => {
    if (error) setError(null);
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // --- ROLE TAB COMPONENT ---
  const RoleTab = ({ role, icon: Icon, label }) => (
    <button
      type="button"
      onClick={() => setSelectedRole(role)}
      className={`flex-1 flex flex-col items-center justify-center py-3 rounded-lg transition-all duration-300 border ${
        selectedRole === role
          ? "bg-yellow-500/20 border-yellow-500 text-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.3)]"
          : "bg-white/5 border-transparent text-gray-500 hover:bg-white/10 hover:text-gray-300"
      }`}
    >
      <Icon size={20} className="mb-1" />
      <span className="text-[10px] font-bold uppercase tracking-wider">
        {label}
      </span>
    </button>
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    // Get Tenant ID (Only needed for Player/Tenant Admin)
    const websiteTenantId = import.meta.env.VITE_TENANT_ID;

    try {
      if (isLogin) {
        // ==========================
        // 🔐 LOGIN LOGIC (Fixed)
        // ==========================

        // We now use authService which correctly formats the request
        const res = await authService.login(
          formData.email,
          formData.password,
          selectedRole, // Pass the selected role ("PLAYER", "TENANT_ADMIN", "SUPER_ADMIN")
        );

        const { access_token, role } = res.data;

        // Save Credentials
        localStorage.setItem("token", access_token);
        localStorage.setItem("role", role);

        toast.success(`Welcome back, ${role.replace("_", " ")}!`);

        // --- REDIRECTION PATHS ---
        if (role === "SUPER_ADMIN") {
          navigate("/admin/dashboard", { replace: true });
        } else if (role === "TENANT_ADMIN") {
          navigate("/tenant/dashboard", { replace: true });
        } else if (role === "TENANT_STAFF") {
          navigate("/staff/dashboard", { replace: true });
        } else if (role === "PLAYER") {
          navigate("/players/dashboard", { replace: true });
        } else {
          navigate("/unauthorized");
        }
      } else {
        // ==========================
        // 📝 REGISTRATION LOGIC (Players Only)
        // ==========================

        // Prevent registration for Admins via this form (Security)
        if (selectedRole !== "PLAYER") {
          setError("Admin registration is restricted. Contact Super Admin.");
          setLoading(false);
          return;
        }

        if (!websiteTenantId) throw new Error("Tenant ID missing in config.");

        await api.post("/players/register", {
          tenant_id: websiteTenantId,
          username: formData.username,
          email: formData.email,
          password: formData.password,
          referral_code: formData.referral_code || null,
          country_id: 1, // Defaulting to 1 for now, or add a selector
        });

        setLoading(false);
        toast.success("Registration Successful! Please Login.");

        setIsLogin(true);
        setFormData({ ...formData, password: "" });
      }
    } catch (err) {
      console.error("Auth Error:", err);
      let msg = "Something went wrong.";

      if (err.response) {
        // Backend specific error messages
        if (err.response.status === 401) {
          msg = "Incorrect email or password.";
        } else if (err.response.status === 403) {
          msg = "Account is suspended or unauthorized.";
        } else if (err.response.status === 422) {
          msg = "Validation Error: Check your input.";
        } else if (err.response.data.detail) {
          msg =
            typeof err.response.data.detail === "string"
              ? err.response.data.detail
              : JSON.stringify(err.response.data.detail);
        }
      } else if (err.message) {
        msg = err.message;
      }

      setError(msg);
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const email = prompt("Enter your email address:");
    if (!email) return;

    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("A temporary password has been sent.");
    } catch (e) {
      toast.error("Request failed or email not found.");
    }
  };

  return (
    <div
      ref={containerRef}
      className="relative h-screen overflow-hidden bg-casino-black"
    >
      {/* Background Video & Text */}
      <div
        ref={videoRef}
        className="absolute inset-0 w-full h-full flex items-center justify-center z-0"
      >
        <video
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover opacity-80"
        >
          <source src="/casino-chip-3d.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div
        ref={heroTextRef}
        className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none px-4 text-center"
      >
        <div className="flex flex-col md:flex-row gap-2 md:gap-4">
          <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display text-transparent bg-gradient-to-b from-white bg-clip-text to-yellow-400 drop-shadow-2xl">
            ROYAL
          </span>
          <span className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-display text-transparent bg-gradient-to-b from-white bg-clip-text to-yellow-400 drop-shadow-2xl">
            CASINO
          </span>
        </div>
        <p className="text-casino-silver mt-4 md:mt-8 text-sm md:text-xl tracking-[0.5em] animate-pulse">
          SCROLL TO ENTER
        </p>
      </div>

      {/* Form Panel */}
      <div
        ref={formRef}
        className="absolute right-0 top-0 h-full w-full md:w-[60%] lg:w-1/2 bg-casino-black/95 backdrop-blur-xl border-l border-casino-gold/20 p-8 md:p-12 lg:p-16 flex flex-col justify-center z-20 shadow-[-50px_0_100px_rgba(0,0,0,0.9)] overflow-y-auto"
      >
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-3xl md:text-4xl font-display text-casino-gold mb-2">
            {isLogin ? "Welcome Back" : "Join the Elite"}
          </h2>
          <p className="text-casino-muted mb-6 text-sm md:text-base">
            {isLogin
              ? "Access your premium dashboard."
              : "Create your account to start winning."}
          </p>

          {/* --- ROLE SELECTOR (Only visible on Login) --- */}
          {isLogin && (
            <div className="flex gap-2 mb-6">
              <RoleTab role="PLAYER" icon={User} label="Player" />
              <RoleTab role="TENANT_ADMIN" icon={Shield} label="Staff/Admin" />
              <RoleTab role="SUPER_ADMIN" icon={Crown} label="Super Admin" />
            </div>
          )}

          {error && (
            <div className="p-4 mb-6 bg-casino-red/10 border border-casino-red text-casino-red text-sm font-semibold rounded animate-pulse">
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <InputField
              label="Email Address"
              name="email"
              type="email"
              placeholder="john@example.com"
              value={formData.email}
              onChange={handleChange}
            />

            {!isLogin && (
              <InputField
                label="Username"
                name="username"
                type="text"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
              />
            )}

            <InputField
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
            />

            {!isLogin && (
              <InputField
                label="Referral Code (Optional)"
                name="referral_code"
                type="text"
                placeholder="FRIEND123"
                value={formData.referral_code}
                onChange={handleChange}
              />
            )}

            <GoldButton fullWidth type="submit" disabled={loading}>
              {loading
                ? "Processing..."
                : isLogin
                  ? "LOGIN ACCESS"
                  : "CREATE ACCOUNT"}
            </GoldButton>

            {isLogin && (
              <button
                type="button"
                onClick={handleForgotPassword}
                className="text-xs text-gray-400 hover:text-yellow-500 mt-2 underline w-full text-center hover:cursor-pointer"
              >
                Forgot Password?
              </button>
            )}
          </form>

          <div className="mt-8 text-center pb-8 md:pb-0 pt-4 border-t border-white/10">
            <p className="text-casino-muted text-sm">
              {isLogin ? "New to Royal Casino?" : "Already have an account?"}
              <button
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError(null);
                  setSelectedRole("PLAYER"); // Reset to Player on switch
                }}
                className="ml-2 text-casino-gold font-bold hover:underline underline-offset-4"
              >
                {isLogin ? "Sign Up Now" : "Login Here"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
