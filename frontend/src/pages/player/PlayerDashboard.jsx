import React, { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import Confetti from "react-confetti";
import playerService from "../../services/playerService";
import authService from "../../services/authService";
import ProfileSidebar from "../../components/player/ProfileSidebar";
import GoldButton from "../../components/ui/GoldButton";
import Game3DCarousel from "../../components/player/Game3DCarousel";
import InputField from "../../components/ui/InputField";
import {
  Gamepad2,
  Bell,
  PlayCircle,
  Trophy,
  Lock,
  CreditCard,
  Gift,
  DollarSign,
  User,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Star,
  ShieldCheck,
  AlertOctagon,
  Facebook,
  Twitter,
  Instagram,
  Mail,
  X,
} from "lucide-react";

// --- HERO CAROUSEL ---
const HeroCarousel = ({
  username,
  latestWinner,
  onPlayGame,
  scrollToJackpots,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // 1. Base Slides
  const slides = [
    {
      id: "welcome",
      bg: "/welcome.jpg",
      title: (
        <>
          Welcome,{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
            {username}
          </span>
        </>
      ),
      desc: "Ready to win big? Explore our premium selection of provably fair games.",
      btnText: "Play Now",
      action: onPlayGame,
      icon: <PlayCircle size={18} className="mr-2" />,
    },
    {
      id: "jackpot_promo",
      bg: "/jackpots_bg.jpg",
      title: "Weekly Jackpots",
      desc: "Huge pools waiting to be won. Join the action today!",
      btnText: "View Jackpots",
      action: scrollToJackpots,
      icon: <Trophy size={18} className="mr-2" />,
    },
  ];

  // 2. Add Winner Slide to the END (Last Slide)
  if (latestWinner) {
    slides.push({
      id: "winner_spotlight",
      bg: "/jackpot_winner_bg.jpg",
      title: (
        <div className="flex flex-col items-start">
          <span className="text-yellow-400 text-lg uppercase tracking-widest font-bold mb-2 animate-pulse flex items-center gap-2">
            <Star fill="currentColor" /> Jackpot Hit!{" "}
            <Star fill="currentColor" />
          </span>
          <span>Congrats, {latestWinner.username}!</span>
        </div>
      ),
      desc: `They just won $${latestWinner.total_pool_amount} in the Weekly Draw! You could be next.`,
      btnText: "Join Next Draw",
      action: scrollToJackpots,
      icon: <Trophy size={18} className="mr-2" />,
    });
  }

  // Auto-rotate
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative rounded-2xl overflow-hidden h-[320px] border border-white/10 shadow-2xl group">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear scale-110 group-hover:scale-100"
            style={{ backgroundImage: `url('${slide.bg}')` }}
          ></div>
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>

          {/* Winner Sparkles Effect */}
          {slide.id === "winner_spotlight" && (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse pointer-events-none"></div>
          )}

          <div className="absolute inset-0 flex flex-col justify-center px-8 md:px-16 max-w-2xl">
            <h1 className="text-3xl md:text-5xl font-display mb-2 text-white drop-shadow-lg leading-tight">
              {slide.title}
            </h1>
            <p className="text-gray-300 mb-6 text-sm md:text-base max-w-md font-medium">
              {slide.desc}
            </p>
            {slide.action && (
              <div className="flex">
                <GoldButton onClick={slide.action} className="flex flex-row">
                  {slide.icon} {slide.btnText}
                </GoldButton>
              </div>
            )}
          </div>
        </div>
      ))}

      {/* Controls */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-white/10 text-white border border-white/10"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-white/10 text-white border border-white/10"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots / Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`w-2 h-2 rounded-full transition-all ${
              idx === currentSlide
                ? "bg-yellow-500 w-6"
                : "bg-white/30 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const PlayerFooter = () => {
  return (
    <footer className="mt-20 border-t border-white/10 bg-[#040029] relative z-10">
      <div className="max-w-[1400px] mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Column */}
          <div className="col-span-1 md:col-span-1">
            <h2 className="text-2xl font-display text-yellow-500 tracking-wider mb-4">
              ROYAL
            </h2>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              The premier destination for high-stakes gaming and weekly
              jackpots. Experience the thrill of provably fair crypto gaming.
            </p>
            <div className="flex gap-4">
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                <Twitter size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                <Instagram size={18} />
              </a>
              <a
                href="#"
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-yellow-500 hover:text-black transition-all"
              >
                <Facebook size={18} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              Platform
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Arcade Games
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Live Jackpots
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  VIP Program
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Promotions
                </a>
              </li>
            </ul>
          </div>

          {/* Support Links */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              Support
            </h3>
            <ul className="space-y-3 text-sm text-gray-400">
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Help Center
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Terms of Service
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-yellow-500 transition-colors">
                  Responsible Gaming
                </a>
              </li>
            </ul>
          </div>

          {/* Contact / Secure */}
          <div>
            <h3 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              Security
            </h3>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <ShieldCheck className="text-green-500" size={20} />
                <span>256-bit SSL Secured</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-gray-400">
                <AlertOctagon className="text-red-500" size={20} />
                <span>18+ Play Responsibly</span>
              </div>
              <button className="mt-2 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-yellow-500 border border-yellow-500/30 px-4 py-3 rounded hover:bg-yellow-500/10 transition-colors w-fit">
                <Mail size={16} /> Contact Support
              </button>
            </div>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600 w-100 mx-auto">
            © 2026 Royal Casino. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

// --- MAIN DASHBOARD ---
const PlayerDashboard = () => {
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [jackpots, setJackpots] = useState([]);
  const [latestWinner, setLatestWinner] = useState(null);

  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState("menu");

  // Celebration State
  const [showConfetti, setShowConfetti] = useState(false);
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // --- PASSWORD MODAL STATE ---
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [pwdForm, setPwdForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchAllData = useCallback(async () => {
    try {
      const dashRes = await playerService.getDashboard();
      setData(dashRes.data);

      try {
        const jackpotRes = await playerService.getJackpots();
        setJackpots(jackpotRes.data);
      } catch (e) {
        console.warn("Failed to load jackpots", e);
      }

      try {
        const winnerRes = await playerService.getLatestWinner();
        setLatestWinner(winnerRes.data);

        if (
          winnerRes.data &&
          dashRes.data.profile.username === winnerRes.data.username
        ) {
          const celebrationKey = `has_celebrated_${winnerRes.data.jackpot_event_id}`;
          if (!localStorage.getItem(celebrationKey)) {
            setShowConfetti(true);
            localStorage.setItem(celebrationKey, Date.now().toString());
            setTimeout(() => setShowConfetti(false), 10000);
          }
        }
      } catch (e) {
        console.warn("Failed to load winner", e);
      }
    } catch (err) {
      if (err.response?.status === 401) navigate("/auth");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchAllData();
    const interval = setInterval(fetchAllData, 10000);
    return () => clearInterval(interval);
  }, [fetchAllData]);

  // --- HANDLERS ---

  const handleEnterJackpot = async (jackpot) => {
    // 1. KYC CHECK FOR JACKPOTS
    if (data?.profile?.kyc_status !== "APPROVED") {
      toast.error("Please verify identity first.");
      openSidebar("menu");
      return;
    }

    if (
      !window.confirm(
        `Join for $${jackpot.entry_amount}? Funds will be deducted from REAL wallet.`,
      )
    )
      return;
    try {
      await playerService.enterJackpot(jackpot.jackpot_event_id, "REAL");
      toast.success("Successfully Entered! Good Luck!");
      fetchAllData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to enter");
    }
  };

  const handlePlayRequest = (game) => {
    if (data?.profile?.kyc_status !== "APPROVED") {
      toast.error(" Please verify identity first.");
      openSidebar("menu");
      return;
    }
    navigate(`/play/${game.game_id}`);
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      console.error(e);
    }
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith("has_celebrated_")) {
        const storedVal = localStorage.getItem(key);
        const timestamp = parseInt(storedVal, 10);
        if (isNaN(timestamp) || now - timestamp > THIRTY_DAYS)
          localStorage.removeItem(key);
      } else {
        localStorage.removeItem(key);
      }
    });
    navigate("/auth");
  };

  // --- PASSWORD UPDATE HANDLER ---
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (pwdForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    const promise = playerService.updatePassword(
      pwdForm.oldPassword,
      pwdForm.newPassword,
    );

    toast.promise(promise, {
      loading: "Updating password...",
      success: () => {
        setIsPasswordModalOpen(false);
        setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        return "Password updated successfully!";
      },
      error: (err) => err.response?.data?.detail || "Failed to update password",
    });
  };

  const openSidebar = (view = "menu") => {
    setSidebarView(view);
    setIsProfileOpen(true);
  };

  if (loading)
    return (
      <div className="h-screen bg-[#040029] flex items-center justify-center text-yellow-500 animate-pulse">
        LOADING...
      </div>
    );

  const games = data?.games || [];

  return (
    <div className="min-h-screen bg-[#040029] text-white font-sans md:pb-0 relative overflow-x-hidden flex flex-col">
      {/* CELEBRATION OVERLAY */}
      {showConfetti && (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
          <Confetti
            width={windowSize.width}
            height={windowSize.height}
            numberOfPieces={400}
            recycle={false}
          />
          <div className="text-center animate-bounce bg-black/50 p-8 rounded-3xl backdrop-blur-sm border border-yellow-500/50">
            <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 drop-shadow-[0_0_25px_rgba(234,179,8,0.8)]">
              YOU WON!
            </h1>
            <p className="text-2xl text-white font-bold mt-4 shadow-black drop-shadow-md">
              The Jackpot is Yours!
            </p>
            <p className="text-yellow-400 font-mono mt-2 text-xl">
              +${latestWinner?.total_pool_amount}
            </p>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-[#040029] w-full max-w-md p-8 rounded-2xl border border-white/10 relative shadow-2xl animate-in zoom-in duration-200">
            <button
              onClick={() => setIsPasswordModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <ShieldCheck className="text-yellow-500" /> Change Password
            </h2>

            <form onSubmit={handleUpdatePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Current Password
                </label>
                <InputField
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors"
                  value={pwdForm.oldPassword}
                  onChange={(e) =>
                    setPwdForm({ ...pwdForm, oldPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  New Password
                </label>
                <InputField
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors"
                  value={pwdForm.newPassword}
                  onChange={(e) =>
                    setPwdForm({ ...pwdForm, newPassword: e.target.value })
                  }
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                  Confirm New Password
                </label>
                <InputField
                  name="password"
                  type="password"
                  placeholder="Password"
                  className="w-full bg-black/50 border border-white/10 rounded p-3 text-white focus:border-yellow-500 outline-none transition-colors"
                  value={pwdForm.confirmPassword}
                  onChange={(e) =>
                    setPwdForm({ ...pwdForm, confirmPassword: e.target.value })
                  }
                  required
                />
              </div>

              <div className="pt-2">
                <GoldButton fullWidth type="submit">
                  Update Password
                </GoldButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SIDEBAR - WITH PASSWORD PROP */}
      <ProfileSidebar
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={data?.profile}
        activeOtp={data?.active_otp}
        onLogout={handleLogout}
        refreshData={fetchAllData}
        initialView={sidebarView}
        // PASS THE HANDLER HERE
        onChangePassword={() => setIsPasswordModalOpen(true)}
      />

      {/* NAV */}
      <nav className="fixed top-0 w-full z-40 bg-[#050124] backdrop-blur-xl border-b border-white/10 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-display text-yellow-500 tracking-wider">
            ROYAL
          </span>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right hidden md:block">
            <div className="text-xs text-gray-400 font-bold uppercase">
              Total Funds
            </div>
            <div className="text-lg font-bold text-yellow-500 font-mono">
              $
              {(
                (data?.profile?.balance || 0) +
                (data?.profile?.bonus_balance || 0)
              ).toFixed(2)}
            </div>
          </div>
          <button
            onClick={() => openSidebar("notifications")}
            className={`relative p-2 rounded-full border transition-all ${
              data?.active_otp
                ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20"
                : "bg-white/5 border-transparent text-gray-400 hover:text-white "
            }`}
          >
            <Bell
              size={16}
              className={data?.active_otp ? "animate-swing" : ""}
            />
            {data?.active_otp && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
            )}
          </button>
          <div
            onClick={() => openSidebar("menu")}
            className="w-9 h-9 rounded-full bg-[#040029] to-black border border-white/20 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-yellow-400 transition-colors shadow-lg"
          >
            <User size={16} />
          </div>
        </div>
      </nav>

      {/* CONTENT */}
      <div className="relative z-10 pt-24 px-4 md:px-8 max-w-[1400px] mx-auto space-y-12 flex-1">
        <HeroCarousel
          username={data?.profile?.username}
          latestWinner={latestWinner}
          onPlayGame={() =>
            document
              .getElementById("games-grid")
              .scrollIntoView({ behavior: "smooth" })
          }
          scrollToJackpots={() =>
            document
              .getElementById("jackpots-grid")
              .scrollIntoView({ behavior: "smooth" })
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            className="bg-gradient-to-br from-blue-900/40 to-cyan-900/40 border border-cyan-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-cyan-500/50 transition-all cursor-pointer"
            onClick={() => openSidebar("deposit")}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
              <DollarSign size={80} />
            </div>
            <div className="relative z-10">
              <div className="text-xs text-cyan-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <CreditCard size={14} /> Real Balance
              </div>
              <div className="text-4xl font-mono font-bold text-white shadow-glow">
                ${data?.profile?.balance?.toFixed(2)}
              </div>
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-900/40 to-pink-900/40 border border-purple-500/30 p-6 rounded-2xl relative overflow-hidden group hover:border-purple-500/50 transition-all">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20">
              <Gift size={80} />
            </div>
            <div className="relative z-10">
              <div className="text-xs text-purple-400 font-bold uppercase tracking-widest mb-2 flex items-center gap-2">
                <Gift size={14} /> Bonus Credits
              </div>
              <div className="text-4xl font-mono font-bold text-white">
                ${data?.profile?.bonus_balance?.toFixed(2)}
              </div>
            </div>
          </div>
        </div>

        <div id="games-grid">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-display text-white flex items-center gap-2">
              <Gamepad2 className="text-yellow-500" /> Arcade Games
            </h2>
          </div>

          {/* Dynamic Grid: Min 240px width per card */}
          {games.length > 0 ? (
            <Game3DCarousel
              games={games}
              profile={data?.profile}
              onPlay={handlePlayRequest}
            />
          ) : (
            <div className="text-gray-500 text-center py-10">
              No games found.
            </div>
          )}
        </div>

        {/* 4. JACKPOTS GRID */}
        <div id="jackpots-grid" className="pb-10">
          <h2 className="text-2xl font-display text-white mb-6 flex items-center gap-2">
            <Trophy className="text-yellow-500" /> Active Jackpots
          </h2>
          {jackpots.length === 0 ? (
            <div className="text-center p-12 bg-white/5 rounded-xl border border-white/10">
              <Trophy size={48} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-bold text-gray-400">
                No Active Jackpots
              </h3>
            </div>
          ) : (
            <div
              className={`grid gap-6 ${jackpots.length === 1 ? "max-w-2xl mx-auto w-full" : ""}`}
              style={{
                gridTemplateColumns:
                  jackpots.length === 1
                    ? "1fr"
                    : "repeat(auto-fit, minmax(280px, 1fr))",
              }}
            >
              {jackpots.map((jackpot) => (
                <div
                  key={jackpot.jackpot_event_id}
                  className={`bg-[#040029] border border-yellow-500/30 rounded-2xl p-6 relative overflow-hidden group hover:border-yellow-500/70 transition-all flex flex-col justify-between h-[280px] ${
                    data?.profile?.kyc_status !== "APPROVED"
                      ? "opacity-75 grayscale-[0.5]"
                      : ""
                  }`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-yellow-500/20 transition-all"></div>

                  {/* KYC LOCK OVERLAY - ADDED HERE */}
                  {data?.profile?.kyc_status !== "APPROVED" && (
                    <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-[#040029]/80 backdrop-blur-sm z-30">
                      <Lock className="text-red-500" size={32} />
                      <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                        KYC Required
                      </span>
                      <button
                        onClick={() => openSidebar("menu")}
                        className="mt-2 text-xs font-bold text-white underline hover:text-yellow-400 cursor-pointer z-40"
                      >
                        Verify Now
                      </button>
                    </div>
                  )}

                  <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                      <div className="bg-yellow-900/20 border border-yellow-500/30 text-yellow-500 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider animate-pulse">
                        Live
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-gray-500 uppercase font-bold">
                          Prize Pool
                        </div>
                        <div className="text-2xl font-mono font-bold text-yellow-500 text-shadow-glow">
                          ${jackpot.total_pool_amount}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                        <span className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold">
                          <Calendar size={12} /> Draw
                        </span>
                        <span className="font-bold text-white">
                          {new Date(jackpot.game_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm border-b border-white/5 pb-2">
                        <span className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold">
                          <DollarSign size={12} /> Entry
                        </span>
                        <span className="font-bold text-white">
                          ${jackpot.entry_amount}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm pb-2">
                        <span className="flex items-center gap-2 text-gray-400 text-xs uppercase font-bold">
                          <Users size={12} /> Players
                        </span>
                        <span className="font-bold text-white">
                          {jackpot.participant_count}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="relative z-10 mt-4">
                    <GoldButton
                      fullWidth
                      onClick={() => handleEnterJackpot(jackpot)}
                    >
                      Enter Jackpot
                    </GoldButton>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <PlayerFooter />
      </div>
    </div>
  );
};

export default PlayerDashboard;
