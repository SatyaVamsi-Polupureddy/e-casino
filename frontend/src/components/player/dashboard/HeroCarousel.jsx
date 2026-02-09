import React, { useState, useEffect } from "react";
import {
  PlayCircle,
  Trophy,
  Star,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import GoldButton from "../../ui/GoldButton";

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

  // 2. Add Winner Slide to the END (Last Slide) if a winner exists
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

  // Auto-rotate logic
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000); // Increased to 5s for better readability
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () =>
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div className="relative rounded-2xl overflow-hidden h-[320px] border border-white/10 shadow-2xl group bg-[#020015]">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ${
            index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        >
          {/* Background Image with Zoom Effect */}
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10000ms] ease-linear scale-110 group-hover:scale-100"
            style={{ backgroundImage: `url('${slide.bg}')` }}
          ></div>

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"></div>

          {/* Winner Sparkles Effect */}
          {slide.id === "winner_spotlight" && (
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 animate-pulse pointer-events-none"></div>
          )}

          {/* Text Content */}
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

      {/* Controls: Prev/Next */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-white/10 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronLeft size={24} />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/50 hover:bg-white/10 text-white border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <ChevronRight size={24} />
      </button>

      {/* Dots Indicators */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentSlide(idx)}
            className={`h-2 rounded-full transition-all duration-300 ${
              idx === currentSlide
                ? "bg-yellow-500 w-8"
                : "bg-white/30 hover:bg-white/60 w-2"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default HeroCarousel;
