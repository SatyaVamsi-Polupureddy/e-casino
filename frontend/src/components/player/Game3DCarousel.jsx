import React, { useState, useEffect, useRef } from "react";
import { Lock, ChevronLeft, ChevronRight } from "lucide-react";

const Game3DCarousel = ({ games, profile, onPlay }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef(null);
  const autoPlayRef = useRef(null);

  // CONFIGURATION
  const CARD_WIDTH = 260; // Width of the central card
  const CARD_HEIGHT = 360; // Height of the central card
  const SPACING = 160; // How far apart the cards appear horizontally
  const ROTATION = 45; // Rotation angle for side cards
  const DEPTH = 300; // How far back side cards are pushed

  const gameCount = games.length;

  // --- AUTO PLAY LOGIC ---
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [activeIndex]); // Restart timer on manual change

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      handleNext();
    }, 1000);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) clearInterval(autoPlayRef.current);
  };

  // --- NAVIGATION ---
  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % gameCount);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + gameCount) % gameCount);
  };

  const handleCardClick = (index, game) => {
    // If clicking the active card, PLAY
    if (index === activeIndex) {
      onPlay(game);
    } else {
      // If clicking a side card, make it ACTIVE
      setActiveIndex(index);
    }
  };

  // Helper to calculate style for each card
  const getCardStyle = (index) => {
    // Determine offset relative to active card
    // We handle wrapping so the last card appears to the left of the first card if needed
    let offset = index - activeIndex;

    // Adjust for infinite wrapping visual
    if (offset > gameCount / 2) offset -= gameCount;
    if (offset < -gameCount / 2) offset += gameCount;

    // Only show nearby cards to save performance/visual clutter
    const isVisible = Math.abs(offset) <= 3;

    if (!isVisible) return { display: "none" };

    const isCenter = offset === 0;
    const direction = offset > 0 ? 1 : -1; // 1 for right, -1 for left

    // Calculate Transform
    const translateX = offset * SPACING;
    const translateZ = isCenter ? 0 : -DEPTH; // Push side cards back
    const rotateY = isCenter ? 0 : -direction * ROTATION; // Rotate inwards
    const scale = isCenter ? 1.1 : 0.9; // Magnify center
    const zIndex = 100 - Math.abs(offset); // Center is on top
    const opacity = isCenter ? 1 : 0.6; // Fade side cards

    return {
      transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
      zIndex: zIndex,
      opacity: opacity,
      filter: isCenter ? "none" : "brightness(0.5) blur(1px)",
    };
  };

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
      {/* 3D STAGE */}
      <div className="relative w-full max-w-6xl h-full flex items-center justify-center perspective-container">
        <style>{`
          .perspective-container {
            perspective: 1000px;
            transform-style: preserve-3d;
          }
        `}</style>

        {games.map((game, index) => (
          <div
            key={game.game_id}
            onClick={() => handleCardClick(index, game)}
            onMouseEnter={stopAutoPlay}
            onMouseLeave={startAutoPlay}
            className={`absolute transition-all duration-500 ease-out cursor-pointer rounded-2xl border border-white/10 overflow-hidden shadow-2xl
               ${index === activeIndex ? "border-yellow-500 shadow-yellow-500/20" : "hover:brightness-125"}
            `}
            style={{
              width: `${CARD_WIDTH}px`,
              height: `${CARD_HEIGHT}px`,
              ...getCardStyle(index),
              left: "50%",
              marginLeft: `-${CARD_WIDTH / 2}px`, // Center horizontally
            }}
          >
            {/* IMAGE */}
            <img
              src={game.thumbnail_url}
              alt={game.game_name}
              className="w-full h-full object-cover"
            />

            {/* OVERLAY */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90"></div>

            {/* KYC LOCK */}
            {profile?.kyc_status !== "APPROVED" && (
              <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center bg-black/80 backdrop-blur-sm z-20">
                <Lock className="text-red-500" size={32} />
                <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">
                  KYC Required
                </span>
              </div>
            )}

            {/* TEXT (Only Visible on Active or Hover) */}
            <div
              className={`absolute bottom-0 w-full p-6 transition-opacity duration-300 ${index === activeIndex ? "opacity-100" : "opacity-0"}`}
            >
              <h3 className="font-display text-2xl text-white text-center mb-1 drop-shadow-md">
                {game.game_name}
              </h3>
              <div className="flex justify-center">
                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded border border-yellow-400/20 uppercase tracking-wider">
                  {index === activeIndex ? "Click to Play" : ""}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CONTROLS (Arrows) */}
      <button
        onClick={handlePrev}
        className="absolute left-4 md:left-10 z-50 p-3 rounded-full  border border-transparent  hover:border-yellow-500 transition-all group"
      >
        <ChevronLeft
          className="text-white group-hover:text-yellow-400"
          size={32}
        />
      </button>

      <button
        onClick={handleNext}
        className="absolute right-4 md:right-10 z-50 p-3 rounded-full  border border-transparent  hover:border-yellow-500 transition-all group"
      >
        <ChevronRight
          className="text-white group-hover:text-yellow-400"
          size={32}
        />
      </button>

      {/* INDICATORS (Dots) */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-50">
        {games.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${i === activeIndex ? "w-8 bg-yellow-500" : "w-2 bg-white/20"}`}
          />
        ))}
      </div>
    </div>
  );
};

export default Game3DCarousel;
