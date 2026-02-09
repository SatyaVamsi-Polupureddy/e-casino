import React from "react";

const SidebarItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-3 w-full p-3 rounded transition-colors ${
      active
        ? "bg-casino-gold text-black font-bold"
        : "text-gray-400 hover:bg-white/5 hover:text-white"
    }`}
  >
    {icon} <span>{label}</span>
  </button>
);
export default SidebarItem;
