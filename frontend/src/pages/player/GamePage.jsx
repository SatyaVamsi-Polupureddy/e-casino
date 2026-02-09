import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { useParams, useNavigate } from "react-router-dom";
import playerService from "../../services/playerService";
import authService from "../../services/authService";
import api from "../../services/api";
import ProfileSidebar from "../../components/player/ProfileSidebar";

// Import Refactored Sub-Components
import GameHeader from "../../components/player/game/GameHeader";
import GameCanvas from "../../components/player/game/GameCanvas";
import GameControls from "../../components/player/game/GameControls";

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

const GamePage = () => {
  const { gameId } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const initialized = useRef(false);

  // --- STATE ---
  const [game, setGame] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [profileData, setProfileData] = useState(null);

  // UI State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState("menu");
  const [loading, setLoading] = useState(true);
  const [spinning, setSpinning] = useState(false);
  const [muted, setMuted] = useState(true);

  // Wallet / Game Logic State
  const [realBalance, setRealBalance] = useState(0);
  const [bonusBalance, setBonusBalance] = useState(0);
  const [selectedWallet, setSelectedWallet] = useState("REAL");
  const [bet, setBet] = useState("");
  const [prediction, setPrediction] = useState("");
  const [result, setResult] = useState(null);

  // --- DATA FETCHING ---
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

  // --- ACTIONS ---
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

    try {
      const res = await playerService.playRound(
        gameId,
        bet,
        prediction,
        selectedWallet,
      );

      if (res.data.session_id) {
        setSessionId(res.data.session_id);
      }

      setResult(null);
      setSpinning(true);

      setTimeout(() => {
        setSpinning(false);
        setResult(res.data);
        if (selectedWallet === "REAL") {
          setRealBalance(res.data.balance_after);
        } else {
          fetchProfileData();
        }
      }, 6500);
    } catch (err) {
      console.error(err);
      setSpinning(false);
      const errorMsg = err.response?.data?.detail || "Error playing round.";
      toast.error(errorMsg);
    }
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

  const handleLeaveLobby = async () => {
    try {
      if (sessionId) {
        await api.post("/players/session/end", { session_id: sessionId });
        console.log("Session closed cleanly.");
      }
    } catch (e) {
      console.warn("Session close failed (might already be closed)", e);
    } finally {
      navigate("/players/dashboard");
    }
  };

  if (loading)
    return (
      <div className="h-screen bg-[#040029] flex items-center justify-center text-cyan-500 animate-pulse font-mono tracking-widest">
        LOADING GAME ASSETS...
      </div>
    );

  // Asset Logic
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
    <div className="h-screen w-screen bg-[#040029] text-white flex flex-col overflow-hidden font-sans">
      <ProfileSidebar
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={profileData?.profile}
        activeOtp={profileData?.active_otp}
        onLogout={handleLogout}
        refreshData={fetchProfileData}
        initialView={sidebarView}
      />

      {/* 1. HEADER SECTION */}
      <GameHeader
        onLeave={handleLeaveLobby}
        realBalance={realBalance}
        bonusBalance={bonusBalance}
        selectedWallet={selectedWallet}
        setSelectedWallet={setSelectedWallet}
        profileData={profileData}
        openSidebar={openSidebar}
      />

      {/* 2. GAME CANVAS */}
      <GameCanvas
        game={game}
        spinning={spinning}
        result={result}
        videoRef={videoRef}
        videoUrl={videoUrl}
        backgroundUrl={backgroundUrl}
        muted={muted}
        setMuted={setMuted}
        setResult={setResult}
      />

      {/* 3. CONTROLS */}
      <GameControls
        game={game}
        prediction={prediction}
        setPrediction={setPrediction}
        bet={bet}
        setBet={setBet}
        spinning={spinning}
        handlePlay={handlePlay}
      />
    </div>
  );
};

export default GamePage;
