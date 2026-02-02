import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const InputField = ({ label, type, placeholder, value, onChange, name }) => {
  // Internal state to toggle password visibility
  const [showPassword, setShowPassword] = useState(false);

  // Determine if this is a password field
  const isPassword = type === "password";

  // Dynamic input type (if password & show is true -> text, else -> original type)
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-casino-muted uppercase tracking-wider mb-2">
        {label}
      </label>

      <div className="relative">
        <input
          type={inputType}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-casino-silver focus:outline-none focus:border-casino-gold transition-colors placeholder-gray-700 pr-10" // Added pr-10 for icon space
        />

        {/* Toggle Icon (Only renders if type is password) */}
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-casino-muted hover:text-casino-gold transition-colors hover:cursor-pointer"
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
    </div>
  );
};

export default InputField;
