import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import GoldButton from "../../components/ui/GoldButton";
import { Shield, Trophy, Zap, ArrowDown, Menu, X } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const navigate = useNavigate();

  // --- STATE ---
  const [isExiting, setIsExiting] = useState(false); // For smooth transition
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // Hamburger

  // --- REFS ---
  const heroSectionRef = useRef(null);
  const featureSectionRef = useRef(null);
  const gamesSectionRef = useRef(null);
  const heroTextRef = useRef(null);
  const heroDimRef = useRef(null);
  const featureDimRef = useRef(null);

  const isLoggedIn = !!localStorage.getItem("token");
  const role = localStorage.getItem("role");

  // GSAP
  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Hero Text Entry
      gsap.from(heroTextRef.current, {
        y: 100,
        opacity: 0,
        duration: 1.5,
        ease: "power4.out",
        delay: 0.2,
      });

      // 2. Dimming: Hero
      gsap.to(heroDimRef.current, {
        opacity: 0.8,
        ease: "none",
        scrollTrigger: {
          trigger: featureSectionRef.current,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });

      // 3. Parallax/Scale: Hero
      gsap.to(heroSectionRef.current, {
        scale: 0.95,
        ease: "none",
        scrollTrigger: {
          trigger: featureSectionRef.current,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });

      // 4. Dimming: Features
      gsap.to(featureDimRef.current, {
        opacity: 0.8,
        ease: "none",
        scrollTrigger: {
          trigger: gamesSectionRef.current,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });

      // 5. Parallax/Scale: Features
      gsap.to(featureSectionRef.current, {
        scale: 0.95,
        ease: "none",
        scrollTrigger: {
          trigger: gamesSectionRef.current,
          start: "top bottom",
          end: "top top",
          scrub: true,
        },
      });
    });
    return () => ctx.revert();
  }, []);

  const handleNavigation = (path) => {
    setIsMobileMenuOpen(false);
    setIsExiting(true);
    setTimeout(() => {
      navigate(path);
    }, 500);
  };

  const handlePlayClick = () => {
    if (isLoggedIn) {
      if (role === "PLAYER") handleNavigation("/players/dashboard");
      else if (role === "TENANT_ADMIN") handleNavigation("/tenant/dashboard");
      else handleNavigation("/admin/dashboard");
    } else {
      handleNavigation("/login");
    }
  };

  const scrollToGames = () => {
    gamesSectionRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div
      className={`relative bg-[#020010] text-white font-sans selection:bg-yellow-500 selection:text-black transition-opacity duration-500 ease-in-out ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      <section
        ref={heroSectionRef}
        className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center bg-[#020010] z-0"
      >
        {/* Background Video */}
        <div className="absolute inset-0 z-[-2]">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-60"
          >
            <source src="/casino-chip-3d.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#020010] via-transparent to-black/60" />
        </div>

        <div
          ref={heroDimRef}
          className="absolute inset-0 bg-black opacity-0 z-[-1] pointer-events-none"
        />

        {/* --- NAVBAR --- */}
        <nav className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-40">
          <div className="text-xl md:text-2xl font-display font-bold text-yellow-500 tracking-widest drop-shadow-md z-50">
            ROYAL<span className="text-white">CASINO</span>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex gap-4">
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavigation("/login")}
                  className="px-6 py-2 text-xs font-bold uppercase border border-white/20 text-white hover:bg-white/10 transition-all rounded-lg backdrop-blur-sm hover:scale-105 hover:cursor-pointer"
                >
                  LOGIN
                </button>
                <GoldButton
                  onClick={() => handleNavigation("/register")}
                  className="text-xs px-6 hover:scale-105"
                >
                  JOIN NOW
                </GoldButton>
              </>
            ) : (
              <button
                onClick={handlePlayClick}
                className="px-6 py-2 border border-yellow-500 text-yellow-500 font-bold rounded hover:bg-yellow-500/90 hover:text-black transition-all shadow-[0_0_15px_rgba(234,179,8,0.2)] hover:cursor-pointer"
              >
                DASHBOARD
              </button>
            )}
          </div>

          {/* Mobile Hamburger */}
          <button
            className="md:hidden text-white z-50"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </nav>

        {/* Dim the background when menu is open) */}
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 md:hidden ${
            isMobileMenuOpen
              ? "opacity-100 pointer-events-auto"
              : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setIsMobileMenuOpen(false)}
        />
        {/* sidebar for mobile */}
        <div
          className={`fixed top-0 right-0 h-full w-[75%] max-w-sm bg-[#040029] border-l border-white/10 z-50 transform transition-transform duration-300 ease-out shadow-2xl md:hidden flex flex-col ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex justify-between items-center p-6 border-b border-white/5">
            <div className="text-xl font-display font-bold text-yellow-500 tracking-widest">
              ROYAL<span className="text-white">CASINO</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* Menu Items */}
          <div className="flex-1 flex flex-col p-6 gap-4">
            {!isLoggedIn ? (
              <>
                <button
                  onClick={() => handleNavigation("/login")}
                  className="w-full py-4 text-center border border-white/20 hover:bg-white/10 text-white rounded-lg font-bold uppercase text-sm tracking-wider transition-all backdrop-blur-sm"
                >
                  Login
                </button>

                <button
                  onClick={() => handleNavigation("/register")}
                  className="w-full py-4 text-center bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-lg text-black font-bold uppercase text-sm tracking-wider shadow-lg hover:brightness-110 transition-all active:scale-95"
                >
                  Join Now
                </button>
              </>
            ) : (
              <button
                onClick={handlePlayClick}
                className="w-full py-4 text-center bg-yellow-500/10 border border-yellow-500 text-yellow-500 rounded-lg font-bold uppercase text-sm tracking-wider hover:bg-yellow-500 hover:text-black transition-all"
              >
                Go to Dashboard
              </button>
            )}
          </div>

          {/* Footer Section */}
          <div className="p-6 bg-black/20 text-center">
            <p className="text-xs text-gray-600">© 2024 Royal Casino</p>
          </div>
        </div>

        <div
          ref={heroTextRef}
          className="relative z-10 px-4 w-full max-w-5xl mx-auto text-center flex flex-col justify-center h-full pt-16"
        >
          <h1 className="text-5xl sm:text-6xl md:text-8xl font-display mb-4 leading-[0.9] tracking-tight drop-shadow-2xl">
            <span className="block text-white">EXPERIENCE</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600">
              LUXURY
            </span>
          </h1>
          <p className="text-gray-300 text-sm md:text-xl lg:text-2xl mb-8 md:mb-10 max-w-lg md:max-w-2xl mx-auto font-light tracking-wide px-2">
            High stakes. Instant payouts. The VIP standard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center w-full px-4">
            <GoldButton
              onClick={handlePlayClick}
              className="px-8 py-4 bg-gradient-to-r from-yellow-600 to-yellow-400 font-bold shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:scale-110 hover:shadow-[0_0_60px_rgba(234,179,8,0.6)] transition-all duration-300 w-50 sm:w-auto sm:min-w-[200px]"
            >
              {isLoggedIn ? "CONTINUE" : "START WINNING"}
            </GoldButton>

            <button
              onClick={scrollToGames}
              className="group px-8 py-4 border border-white/20 hover:bg-white/10 text-white font-bold text-xs md:text-sm rounded-lg transition-all backdrop-blur-sm flex items-center justify-center gap-2 w-50 sm:w-auto sm:min-w-[200px] hover:scale-105 hover:cursor-pointer"
            >
              VIEW GAMES{" "}
              <ArrowDown
                size={16}
                className="group-hover:translate-y-1 transition-transform"
              />
            </button>
          </div>
        </div>
      </section>

      <section
        ref={featureSectionRef}
        className="sticky top-0 h-screen w-full bg-[#040029] z-10 flex flex-col items-center justify-center p-4 md:p-8 shadow-[0_-50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div
          ref={featureDimRef}
          className="absolute inset-0 bg-black opacity-0 z-0 pointer-events-none"
        />

        <div className="relative z-10 max-w-6xl mx-auto w-full flex flex-col h-full justify-center">
          <div className="text-center mb-8 md:mb-16 flex-shrink-0">
            <h2 className="text-3xl md:text-5xl font-display text-white mb-2 md:mb-4">
              Why Choose Royal?
            </h2>
            <div className="h-1 w-16 md:w-24 bg-yellow-500 mx-auto rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 lg:gap-12 w-full ">
            <FeatureCard
              icon={Trophy}
              title="Massive Jackpots"
              desc="Daily prize pools exceeding $1,000,000 awaiting a winner."
            />
            <FeatureCard
              icon={Shield}
              title="Secure & Private"
              desc="Bank-grade encryption ensures your data and funds are always safe."
            />
            <FeatureCard
              icon={Zap}
              title="Instant Payouts"
              desc="No waiting days for your money. Withdraw via Crypto or Bank."
            />
          </div>
        </div>
      </section>

      <section
        ref={gamesSectionRef}
        className="sticky top-0 h-screen w-full bg-[#020010] z-20 flex flex-col relative shadow-[0_-50px_100px_rgba(0,0,0,0.5)] overflow-hidden"
      >
        <div className="flex-grow flex flex-col items-center justify-center p-4 w-full h-full relative z-10 pb-24 md:pb-28">
          <div className="w-full max-w-6xl mx-auto text-center flex flex-col h-full justify-center">
            <div className="flex-shrink-0 mb-6 md:mb-16 lg:mb-20">
              <h2 className="text-3xl md:text-5xl lg:text-6xl font-display text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                World Class Games
              </h2>
            </div>

            <div className="w-full flex-grow-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 justify-items-center mx-auto w-full max-w-sm md:max-w-none">
                <GameCard
                  name="Coin Mania"
                  image="/cointoss.jpg"
                  onClick={handlePlayClick}
                />
                <GameCard
                  name="Royal Slots"
                  image="/Stockslot.jpg"
                  onClick={handlePlayClick}
                />
                <GameCard
                  name="Blackjack Pro"
                  image="/cards.jpg"
                  onClick={handlePlayClick}
                />
                <GameCard
                  name="Roulette Live"
                  image="/wheel.jpg"
                  onClick={handlePlayClick}
                />
              </div>
            </div>

            <div className="mt-8 md:mt-12 flex-shrink-0">
              <GoldButton
                onClick={handlePlayClick}
                className="text-sm px-6 hover:scale-105"
              >
                BROWSE ALL GAMES
              </GoldButton>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="absolute bottom-0 left-0 right-0 border-t border-white/10 py-4 md:py-6 text-center text-gray-600 text-[10px] md:text-sm bg-[#020010]/90 backdrop-blur-sm z-30">
          <p>&copy; 2024 Royal Casino. All rights reserved.</p>
          <div className="flex justify-center gap-6 mt-2">
            <button
              onClick={() => handleNavigation("/tenant/login")}
              className="hover:text-white transition-colors"
            >
              Staff Login
            </button>
            <button
              onClick={() => handleNavigation("/super-admin/login")}
              className="hover:text-white transition-colors"
            >
              Admin Access
            </button>
          </div>
        </footer>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon: Icon, title, desc }) => (
  <div className="p-6 md:p-8 rounded-xl md:rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-yellow-500/30 transition-all duration-300 group hover:-translate-y-1 flex flex-col items-center text-center h-full justify-center">
    <div className="w-10 h-10 md:w-14 md:h-14 bg-yellow-500/10 rounded-full md:rounded-xl flex items-center justify-center mb-3 md:mb-5 text-yellow-500 group-hover:scale-110 transition-transform shadow-[0_0_20px_rgba(234,179,8,0.1)] shrink-0">
      <Icon size={20} className="md:w-7 md:h-7" />
    </div>
    <h3 className="text-lg md:text-2xl font-bold text-white mb-2 md:mb-3 font-display leading-tight">
      {title}
    </h3>
    <p className="text-gray-400 leading-snug text-[11px] md:text-sm">{desc}</p>
  </div>
);

const GameCard = ({ name, image, onClick }) => (
  <div
    onClick={onClick}
    className="group relative w-full aspect-[3/4] max-w-[160px] md:max-w-[200px] rounded-xl overflow-hidden cursor-pointer shadow-xl transition-all duration-500 hover:scale-105 hover:shadow-[0_0_40px_rgba(234,179,8,0.3)]"
  >
    <img
      src={image}
      alt={name}
      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
    />
    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-80 group-hover:opacity-60 transition-opacity" />

    <div className="absolute bottom-0 left-0 right-0 p-3 transform translate-y-2 group-hover:translate-y-0 transition-transform">
      <h3 className="font-bold text-sm md:text-base text-white mb-1 group-hover:text-yellow-400 transition-colors font-display tracking-wide truncate">
        {name}
      </h3>
      <div className="h-0.5 w-0 bg-yellow-500 group-hover:w-full transition-all duration-500" />
      <p className="text-[9px] md:text-[10px] text-gray-300 mt-1 md:mt-2 opacity-0 group-hover:opacity-100 transition-opacity delay-100 flex items-center gap-1">
        PLAY NOW <ArrowDown size={10} className="-rotate-90" />
      </p>
    </div>
    <div className="absolute inset-0 border-2 border-transparent group-hover:border-yellow-500/50 rounded-xl transition-colors pointer-events-none" />
  </div>
);

export default LandingPage;
