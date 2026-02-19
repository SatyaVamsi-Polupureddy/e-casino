import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useLayoutEffect,
} from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { LifeBuoy } from "lucide-react";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import playerService from "../../services/playerService";
import authService from "../../services/authService";
import ProfileSidebar from "../../components/player/ProfileSidebar";
import ContactForm from "../../components/common/ContactForm";
import CelebrationOverlay from "../../components/player/dashboard/CelebrationOverlay";
import PasswordModal from "../../components/player/dashboard/PasswordModal";
import PlayerNavbar from "../../components/player/dashboard/PlayerNavbar";
import HeroCarousel from "../../components/player/dashboard/HeroCarousel";
import WalletCards from "../../components/player/dashboard/WalletCards";
import GamesSection from "../../components/player/dashboard/GamesSection";
import JackpotsSection from "../../components/player/dashboard/JackpotsSection";
import PlayerFooter from "../../components/player/dashboard/PlayerFooter";

gsap.registerPlugin(ScrollTrigger);

const PlayerDashboard = () => {
  const navigate = useNavigate();
  const contactSectionRef = useRef(null);
  const dashboardRef = useRef(null);

  const [data, setData] = useState(null);
  const [jackpots, setJackpots] = useState([]);
  const [latestWinner, setLatestWinner] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [sidebarView, setSidebarView] = useState("menu");
  const [showConfetti, setShowConfetti] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  //gsap effects
  useLayoutEffect(() => {
    if (loading) return;

    let ctx = gsap.context(() => {
      if (!showConfetti) {
        gsap.from(".hero-anim", {
          duration: 2.0,
          scale: 0.9,
          y: 100,
          opacity: 0,
          ease: "slow",
          delay: 0.2,
        });

        gsap.from(".wallets-anim > div ", {
          duration: 1.2,
          y: 150,
          opacity: 0,
          rotationX: -15,
          stagger: 0.2,
          ease: "slow",
          delay: 1.4,
        });
      }

      gsap.from(".games-section-anim", {
        scrollTrigger: {
          trigger: ".games-section-anim",
          start: "top bottom",
          end: "bottom 10%",
          toggleActions: "play none none none",
        },
        y: 100,
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        delay: 0.4,
        ease: "slow",
      });

      gsap.from(".jackpots-section-anim", {
        scrollTrigger: {
          trigger: ".jackpots-section-anim",
          start: "top 80%",
          end: "bottom 10%",
          toggleActions: "play none none none",
        },
        y: 100,
        opacity: 0,
        scale: 0.95,
        duration: 0.8,
        delay: 0.2,
        ease: "slow",
      });

      gsap.from(".contact-anim", {
        scrollTrigger: {
          trigger: ".contact-anim",
          start: "top 85%",
          end: "bottom 10%",
          toggleActions: "play none none none",
        },
        y: 100,
        opacity: 0,
        duration: 0.8,
        ease: "slow",
        delay: 0.2,
      });
    }, dashboardRef);

    return () => ctx.revert();
  }, [loading]);

  // window width & height
  useEffect(() => {
    const handleResize = () =>
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // get dashboard data
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

  // scroll from footer to contact form
  const scrollToContact = () => {
    contactSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  const openSidebar = (view = "menu") => {
    setSidebarView(view);
    setIsProfileOpen(true);
  };

  const handleEnterJackpot = async (jackpot) => {
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
      toast.error("Please verify identity first.");
      openSidebar("menu");
      return;
    }
    navigate(`/play/${game.game_id}`);
  };

  const handleLogout = async () => {
    try {
      // to end current sessions
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

  if (loading)
    return (
      <div className="h-screen bg-[#040029] flex items-center justify-center text-yellow-500 animate-pulse font-bold tracking-widest text-xl">
        LOADING CASINO...
      </div>
    );

  return (
    <div
      ref={dashboardRef}
      className="min-h-screen bg-[#040029] text-white font-sans md:pb-0 relative overflow-x-hidden flex flex-col perspective-1000"
    >
      <CelebrationOverlay
        show={showConfetti}
        windowSize={windowSize}
        latestWinner={latestWinner}
      />
      <PasswordModal
        isOpen={isPasswordModalOpen}
        onClose={() => setIsPasswordModalOpen(false)}
      />

      <ProfileSidebar
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        profile={data?.profile}
        activeOtp={data?.active_otp}
        onLogout={handleLogout}
        refreshData={fetchAllData}
        initialView={sidebarView}
        onChangePassword={() => setIsPasswordModalOpen(true)}
      />

      <PlayerNavbar
        profile={data?.profile}
        activeOtp={data?.active_otp}
        openSidebar={openSidebar}
      />

      <div className="relative z-10 pt-24 px-4 md:px-8 w-full space-y-16 flex-1">
        {/* HERO */}
        <div className="hero-anim">
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
        </div>

        {/* WALLETS */}
        <div className="wallets-anim">
          <WalletCards profile={data?.profile} openSidebar={openSidebar} />
        </div>

        {/* GAMES */}
        <div className="games-section-anim">
          <GamesSection
            games={data?.games || []}
            profile={data?.profile}
            onPlay={handlePlayRequest}
          />
        </div>

        {/* JACKPOTS */}
        <div className="jackpots-section-anim">
          <JackpotsSection
            jackpots={jackpots}
            kycStatus={data?.profile?.kyc_status}
            onEnter={handleEnterJackpot}
            openSidebar={openSidebar}
          />
        </div>

        {/* CONTACT */}
        <div className="contact-anim" ref={contactSectionRef}>
          <div className="pb-10 mb-10 max-w-3xl mx-auto">
            <h2 className="text-2xl font-display text-white mb-6 flex items-center justify-center gap-2 text-center">
              <LifeBuoy className="text-yellow-500" /> Need Help?
            </h2>

            <div className="bg-[#040029] p-8 rounded-2xl border border-yellow-500/30 shadow-2xl">
              <div className="text-center mb-8">
                <p className="text-gray-400 text-sm">
                  Facing issues with deposits, games, or account verification?
                  Send a direct message to our support team.
                </p>
              </div>
              <ContactForm
                userRole="PLAYER"
                tenantSupportEmail={data?.tenant_contact_email}
                initialName={data?.profile?.username}
                initialEmail={data?.profile?.email}
              />
            </div>
          </div>
        </div>
      </div>

      <PlayerFooter onContactClick={scrollToContact} />
    </div>
  );
};
export default PlayerDashboard;
