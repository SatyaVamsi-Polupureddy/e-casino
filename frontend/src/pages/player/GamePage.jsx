import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import playerService from "../../services/playerService";
import authService from "../../services/authService";
import ProfileSidebar from "../../components/player/ProfileSidebar";
import {
  ArrowLeft,
  RotateCcw,
  Volume2,
  VolumeX,
  Trophy,
  Zap,
  User,
  Bell,
} from "lucide-react";

// --- FALLBACK ASSETS ---
const FALLBACK_ASSETS = {
  SLOT: {
    video:
      "https://cdn.coverr.co/videos/coverr-slot-machine-spinning-2665/1080p.mp4",
    bg: "/Stockslot.jpg",
  },
  DICE: {
    video:
      "https://v4.cdnpk.net/videvo_files/video/free/2019-11/large_watermarked/190301_1_25_11_preview.mp4",
    bg: "/dice.jpg",
  },
  WHEEL: {
    video:
      "https://v4.cdnpk.net/videvo_files/video/free/2013-08/large_watermarked/hd0992_preview.mp4",
    bg: "/wheel.jpg",
  },
  COIN: {
    video:
      "https://v4.cdnpk.net/videvo_files/video/free/2015-08/large_watermarked/Coin_Spin_Monochrome_Slow_preview.mp4",
    bg: "/cointoss.jpg",
  },
  HIGHLOW: {
    video:
      "https://v4.cdnpk.net/videvo_files/video/free/2019-05/large_watermarked/190424_04_Symbols_Numbers_1080p_07_preview.mp4",
    bg: "/Roulette.jpg",
  },
};

// --- RESULT DISPLAY COMPONENT ---
const GameResultDisplay = ({ type, data }) => {
  if (!data) return null;

  if (type === "SLOT") {
    const symbols = data.symbols || ["❓", "❓", "❓"];
    return (
      <div className="flex gap-2 mb-6 bg-black/60 p-4 rounded-2xl border-2 border-yellow-500/50 shadow-[0_0_30px_rgba(234,179,8,0.2)] animate-in zoom-in">
        {symbols.map((s, i) => (
          <div
            key={i}
            className="w-16 h-16 md:w-24 md:h-24 bg-[#1a1a1a] rounded-xl flex items-center justify-center text-4xl md:text-6xl border border-white/10"
          >
            {s}
          </div>
        ))}
      </div>
    );
  }

  if (type === "COIN") {
    const val = data.flip || "HEADS";
    const isHeads = val === "HEADS";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div
          className={`w-32 h-32 rounded-full flex items-center justify-center border-8 shadow-[0_0_50px_rgba(255,255,255,0.3)] mb-4 ${isHeads ? "border-yellow-400 bg-yellow-500/20" : "border-gray-400 bg-gray-500/20"}`}
        >
          <span
            className={`text-5xl font-black ${isHeads ? "text-yellow-400" : "text-gray-300"}`}
          >
            {isHeads ? "H" : "T"}
          </span>
        </div>
      </div>
    );
  }

  if (type === "DICE") {
    const val = data.roll || "?";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div className="w-32 h-32 bg-white text-black rounded-2xl border-4 border-gray-300 flex items-center justify-center shadow-[0_0_50px_rgba(255,255,255,0.4)] mb-4 transform rotate-6">
          <span className="text-8xl font-black">{val}</span>
        </div>
      </div>
    );
  }

  if (type === "WHEEL") {
    const val = data.segment || "?";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div className="w-32 h-32 rounded-full border-4 border-cyan-500 bg-black flex items-center justify-center shadow-[0_0_40px_rgba(6,182,212,0.6)] mb-4">
          <span className="text-6xl font-black text-cyan-400">{val}</span>
        </div>
      </div>
    );
  }

  if (type === "HIGHLOW") {
    const val = data.card || "?";
    return (
      <div className="flex flex-col items-center mb-8 animate-in zoom-in">
        <div className="w-28 h-40 bg-white text-black rounded-xl border-4 border-gray-200 flex flex-col items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.3)] mb-4 relative">
          <span className="absolute top-2 left-2 text-2xl font-bold">
            {val}
          </span>
          <span className="text-7xl font-black">{val}</span>
          <span className="absolute bottom-2 right-2 text-2xl font-bold transform rotate-180">
            {val}
          </span>
        </div>
      </div>
    );
  }

  return null;
};

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  // videoRef is no longer strictly needed for playing, but kept for potential advanced controls
  const videoRef = useRef(null);
  const initialized = useRef(false);

  const [game, setGame] = useState(null);

  // Profile & Sidebar
  const [profileData, setProfileData] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState("menu");

  // Wallet State
  const [realBalance, setRealBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState("REAL");

  // Game State
  const [bet, setBet] = useState("");
  const [prediction, setPrediction] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [muted, setMuted] = useState(true);

  // Fetch Profile Data
  const fetchProfileData = async () => {
    try {
      const res = await playerService.getDashboard();
      setProfileData(res.data);
      if (res.data.profile) {
        setRealBalance(res.data.profile.balance);
        setBonusBalance(res.data.profile.bonus_balance);
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    }
  };

  const openSidebar = (view) => {
    setSidebarView(view);
    setIsProfileOpen(true);
  };

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const initGame = async () => {
      try {
        await fetchProfileData();
        const gameRes = await playerService.getGameDetails(gameId);
        setGame(gameRes.data);

        const type = gameRes.data.game_type;
        if (type === "COIN") setPrediction("HEADS");
        else if (type === "HIGHLOW") setPrediction("HIGH");
        else if (type === "DICE") setPrediction("1");
        else if (type === "WHEEL") setPrediction("1");

        setLoading(false);
      } catch (err) {
        console.error("Game Init Error:", err);
        navigate("/players/dashboard");
      }
    };

    initGame();
  }, [gameId, navigate]);

  const handlePlay = async (e) => {
    e.preventDefault();
    if (!bet) return;

    const betVal = parseFloat(bet);
    if (betVal < game.min_bet || betVal > game.max_bet) {
      toast.error(`Bet range: $${game.min_bet} - $${game.max_bet}`);
      return;
    }

    const currentFunds = selectedWallet === "REAL" ? realBalance : bonusBalance;
    if (betVal > currentFunds) {
      toast.error(`Insufficient funds in ${selectedWallet} wallet.`);
      return;
    }

    // 1. START ANIMATION
    setSpinning(true);
    setResult(null);

    // Note: We removed the videoRef.current.play() call here.
    // The video will autoplay via the 'autoPlay' prop when it renders below.

    // 2. WAIT FOR VIDEO (4.5 Seconds)
    setTimeout(async () => {
      try {
        const res = await playerService.playRound(
          gameId,
          bet,
          prediction,
          selectedWallet,
        );

        setResult(res.data);

        if (selectedWallet === "REAL") {
          setRealBalance(res.data.balance_after);
        } else {
          fetchProfileData();
        }
      } catch (err) {
        console.error(err);
        toast.error(err.response?.data?.detail || "Error playing round.");
      } finally {
        // 3. STOP ANIMATION & SHOW RESULT
        setSpinning(false);
      }
    }, 6500); // <--- INCREASED TO 4.5 SECONDS
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (e) {
      // ignore
    } finally {
      localStorage.clear();
      navigate("/auth");
    }
  };

  if (loading)
    return (
      <div className="h-screen bg-[#040029]  flex items-center justify-center text-cyan-500 animate-pulse font-mono tracking-widest">
        LOADING GAME ASSETS...
      </div>
    );

  const gameType = game?.game_type || "SLOT";
  const backgroundUrl =
    game?.default_thumbnail_url ||
    FALLBACK_ASSETS[gameType]?.bg ||
    FALLBACK_ASSETS["SLOT"].bg;
  const videoUrl =
    game?.video_url ||
    FALLBACK_ASSETS[gameType]?.video ||
    FALLBACK_ASSETS["SLOT"].video;

  return (
    <div className="h-screen w-screen bg-[#040029]  text-white flex flex-col overflow-hidden font-sans">
      <ProfileSidebar
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profileData?.profile}
        activeOtp={profileData?.active_otp}
        onLogout={handleLogout}
        refreshData={fetchProfileData}
        initialView={sidebarView}
      />

      {/* --- HEADER --- */}
      <div className="h-14 px-4 flex items-center justify-between z-50 bg-[#040029]  backdrop-blur-md border-b border-white/5 shrink-0">
        <button
          onClick={() => navigate("/players/dashboard")}
          className="group flex items-center gap-2 text-gray-400 hover:text-white transition-all"
        >
          <div className="p-1.5 rounded-md bg-white/5 border border-white/10 group-hover:border-cyan-500/50 group-hover:bg-cyan-500/10 transition-all">
            <ArrowLeft size={16} />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest group-hover:text-cyan-400">
            Lobby
          </span>
        </button>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider leading-none mb-0.5">
              Active Wallet
            </div>
            <div className="relative">
              <select
                value={selectedWallet}
                onChange={(e) => setSelectedWallet(e.target.value)}
                className="bg-[#050124]  border border-white/20 text-white text-xs font-bold py-1 px-2 rounded outline-none cursor-pointer hover:border-cyan-500 focus:border-yellow-500 transition-colors appearance-none pr-6"
              >
                <option value="REAL">REAL: ${realBalance.toFixed(2)}</option>
                <option value="BONUS">BONUS: ${bonusBalance.toFixed(2)}</option>
              </select>
            </div>
          </div>
          <button
            onClick={() => openSidebar("notifications")}
            className={`relative p-2 rounded-full border transition-all ${profileData?.active_otp ? "bg-yellow-500/10 border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/20" : "bg-white/5 border-transparent text-gray-400 hover:text-white"}`}
          >
            <Bell
              size={16}
              className={profileData?.active_otp ? "animate-swing" : ""}
            />
            {profileData?.active_otp && (
              <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full animate-ping"></span>
            )}
          </button>
          <div
            onClick={() => openSidebar("menu")}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-800 to-black border border-white/20 flex items-center justify-center text-xs font-bold text-white cursor-pointer hover:border-yellow-400 transition-colors shadow-lg"
          >
            <User size={16} />
          </div>
        </div>
      </div>

      {/* --- GAME CANVAS --- */}
      <div className="flex-1 relative flex items-center justify-center bg-[#040029]  overflow-hidden group">
        <div
          className={`absolute inset-0 bg-gradient-to-t from-cyan-900/20 via-black to-black transition-opacity duration-1000 ${spinning ? "opacity-50" : "opacity-20"}`}
        ></div>

        <div className="absolute inset-4 md:inset-8 flex items-center justify-center">
          <div className="relative w-full h-full max-w-5xl max-h-full flex items-center justify-center rounded-xl overflow-hidden shadow-2xl border border-white/5 bg-[#040029] ">
            {/* DYNAMIC ASSETS HERE */}
            {spinning ? (
              <video
                ref={videoRef}
                key={videoUrl}
                src={videoUrl}
                className="w-full h-full object-cover"
                muted={muted}
                loop
                autoPlay
                playsInline
              />
            ) : (
              <img
                src={backgroundUrl}
                className="w-full h-full object-contain opacity-50 transition-opacity duration-1000"
                alt="Game Background"
              />
            )}

            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagmonds-light.png')] opacity-5 pointer-events-none"></div>

            <button
              onClick={() => setMuted(!muted)}
              className="absolute top-4 right-4 z-40 bg-black/40 backdrop-blur-md p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-all"
            >
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {/* Title Overlay (Idle) */}
            {!spinning && !result && (
              <div className="absolute inset-0 flex flex-col items-center justify-center z-10 animate-in fade-in zoom-in duration-500">
                <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter drop-shadow-2xl mb-2 text-center px-4">
                  {game?.game_name || game?.title}
                </h1>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-yellow-500/30 bg-yellow-900/20 text-yellow-400 text-[10px] font-bold tracking-[0.2em] uppercase backdrop-blur-md">
                  <Zap size={10} fill="currentColor" /> {game?.game_type}
                </div>
              </div>
            )}

            {/* RESULT OVERLAY */}
            {!spinning && result && (
              <div className="absolute inset-0 z-30 flex flex-col pt-2 items-center justify-center bg-black/80 backdrop-blur-md animate-in zoom-in duration-300">
                {/* 1. SHOW GAME SPECIFIC RESULT FIRST */}
                <GameResultDisplay
                  type={game?.game_type}
                  data={result.game_data}
                />

                {/* 2. SHOW OUTCOME TEXT */}
                {result.outcome === "WIN" ? (
                  <>
                    <Trophy
                      size={60}
                      className="text-yellow-400 mt-2 animate-bounce drop-shadow-[0_0_30px_rgba(234,179,8,0.8)]"
                    />
                    <div className="text-6xl px-4 font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-600 italic tracking-tighter drop-shadow-2xl">
                      BIG WIN
                    </div>
                    <div className="text-3xl font-mono text-green-400 font-bold mt-2 text-shadow-glow">
                      +${(result.win_amount || 0).toFixed(2)}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-5xl font-black text-gray-600 mb-2">
                      TRY AGAIN
                    </div>
                    <div className="text-lg text-gray-500 font-medium">
                      Better luck next time
                    </div>
                  </>
                )}
                <button
                  onClick={() => setResult(null)}
                  className="my-4 px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-full text-white font-bold text-sm uppercase tracking-widest transition-all hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <RotateCcw size={14} /> Continue
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --- CONTROLS FOOTER (Unchanged) --- */}
      <div className="bg-[#040029]  border-t border-white/10 p-4 shrink-0 relative z-30">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-4 lg:gap-8 justify-between">
          <div className="flex-1 flex gap-4 items-end w-full md:w-auto">
            {/* Prediction Input */}
            <div className="flex-1 max-w-[200px]">
              <label className="text-[9px] text-cyan-500 font-bold uppercase tracking-widest mb-1 block">
                Prediction / Mode
              </label>

              {game?.game_type === "HIGHLOW" && (
                <div className="flex rounded bg-[#040029]  p-1 border border-white/10 h-12">
                  <button
                    onClick={() => setPrediction("HIGH")}
                    className={`flex-1 rounded font-bold text-xs transition-all ${prediction === "HIGH" ? "bg-green-500/20 text-green-400 shadow-inner" : "text-gray-500 hover:text-white"}`}
                  >
                    HIGH
                  </button>
                  <button
                    onClick={() => setPrediction("LOW")}
                    className={`flex-1 rounded font-bold text-xs transition-all ${prediction === "LOW" ? "bg-red-500/20 text-red-400 shadow-inner" : "text-gray-500 hover:text-white"}`}
                  >
                    LOW
                  </button>
                </div>
              )}
              {game?.game_type === "COIN" && (
                <div className="flex rounded bg-[#040029]  p-1 border border-white/10 h-12">
                  <button
                    onClick={() => setPrediction("HEADS")}
                    className={`flex-1 rounded font-bold text-xs transition-all ${prediction === "HEADS" ? "bg-yellow-500/20 text-yellow-400" : "text-gray-500 hover:text-white"}`}
                  >
                    HEADS
                  </button>
                  <button
                    onClick={() => setPrediction("TAILS")}
                    className={`flex-1 rounded font-bold text-xs transition-all ${prediction === "TAILS" ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-white"}`}
                  >
                    TAILS
                  </button>
                </div>
              )}
              {(game?.game_type === "DICE" || game?.game_type === "WHEEL") && (
                <div className="relative h-12">
                  <select
                    className="w-full h-full bg-[#040029]  border border-white/30 text-white font-mono text-sm px-3 rounded outline-none cursor-pointer hover:border-cyan-500/50 transition-colors"
                    value={prediction}
                    onChange={(e) => setPrediction(e.target.value)}
                  >
                    {Array.from(
                      { length: game?.game_type === "DICE" ? 6 : 20 },
                      (_, i) => i + 1,
                    ).map((num) => (
                      <option key={num} value={num}>
                        Number {num}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {(!game?.game_type || game?.game_type === "SLOT") && (
                <div className="h-12 bg-[#040029]  border border-white/30 rounded flex items-center justify-center text-gray-500 text-xs font-bold uppercase">
                  Auto-Match
                </div>
              )}
            </div>

            {/* Bet Input */}
            <div className="flex-1 max-w-[150px]">
              <label className="text-[9px] text-purple-500 font-bold uppercase tracking-widest mb-1 flex justify-between">
                <span>Wager</span>
                <span className="text-gray-600">Max ${game?.max_bet}</span>
              </label>
              <div className="relative h-12">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-purple-500 font-bold">
                  $
                </span>
                <input
                  type="number"
                  className="w-full h-full bg-[#040029]  border border-white/30 pl-7 pr-3 rounded text-white text-lg font-mono font-bold outline-none focus:border-purple-500/70 transition-all"
                  placeholder="0"
                  value={bet}
                  onChange={(e) => setBet(e.target.value)}
                />
              </div>
            </div>
          </div>

          <button
            onClick={handlePlay}
            disabled={!bet || spinning}
            className="w-full md:w-auto h-16 px-10 bg-white text-black font-black text-xl tracking-[0.2em] rounded-sm shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed disabled:shadow-none transition-all clip-path-polygon flex items-center justify-center"
            style={{
              clipPath:
                "polygon(10% 0, 100% 0, 100% 80%, 90% 100%, 0 100%, 0 20%)",
            }}
          >
            {spinning ? (
              <div className="w-5 h-5 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
            ) : (
              "PLAY"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
