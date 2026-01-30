import React, { useRef } from "react";
import { gsap } from "gsap";

const GoldButton = ({
  children,
  onClick,
  className = "",
  fullWidth = false,
  type = "button",
  disabled = false,
}) => {
  const buttonRef = useRef(null);

  const handleMouseEnter = () => {
    if (!disabled)
      gsap.to(buttonRef.current, {
        scale: 1.05,
        duration: 0.2,
        ease: "power1.out",
      });
  };

  const handleMouseLeave = () => {
    if (!disabled)
      gsap.to(buttonRef.current, {
        scale: 1,
        duration: 0.2,
        ease: "power1.out",
      });
  };

  return (
    <button
      ref={buttonRef}
      type={type}
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`
        relative px-6 py-3 font-bold uppercase tracking-wider text-sm
        bg-casino-gold text-casino-black rounded-sm
        hover:bg-casino-gold-dim transition-colors
        shadow-[0_0_15px_rgba(212,175,55,0.3)]
        disabled:opacity-50 disabled:cursor-not-allowed
        ${fullWidth ? "w-full" : ""}
        ${className}
      `}
    >
      {children}
    </button>
  );
};

export default GoldButton;
