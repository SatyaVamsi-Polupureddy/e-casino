import React, { useState, useEffect } from "react"; // Added useEffect
import emailjs from "@emailjs/browser";
import toast from "react-hot-toast";
import { Send } from "lucide-react";
import GoldButton from "../ui/GoldButton";
import InputField from "../ui/InputField";

// ADDED PROPS: initialName, initialEmail
const ContactForm = ({
  userRole,
  tenantSupportEmail,
  initialName = "",
  initialEmail = "",
  onSuccess,
}) => {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  // NEW STATE
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);

  // Auto-fill state if props change (e.g. data loads late)
  useEffect(() => {
    if (initialName) setName(initialName);
    if (initialEmail) setEmail(initialEmail);
  }, [initialName, initialEmail]);

  // CONFIG
  const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_USER_ID;
  const SUPER_ADMIN_EMAIL = "n200346@rguktn.ac.in";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let destinationEmail = "";

    if (userRole === "PLAYER") {
      destinationEmail = tenantSupportEmail || SUPER_ADMIN_EMAIL;
    } else {
      destinationEmail = SUPER_ADMIN_EMAIL;
    }

    const templateParams = {
      to_email: destinationEmail,
      subject: subject,
      message: message,
      role: userRole,
      // --- NEW FIELDS ---
      from_name: name,
      from_email: email,
      reply_to: email, // This is the magic key for "Reply" button
    };

    try {
      await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
      toast.success("Support request sent!");
      setSubject("");
      setMessage("");
      // Don't clear Name/Email as user might send another
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      toast.error("Failed to send message.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* --- NEW INPUTS --- */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
            Name
          </label>
          <InputField
            // className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
            value={name}
            placeholder="John Doe.."
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
            Your Email
          </label>
          <InputField
            type="email"
            // className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500"
            value={email}
            placeholder="John@gmail.com"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
          Subject
        </label>
        <InputField
          // className="w-full bg-black/40 border border-white/20 p-3 rounded text-white outline-none focus:border-yellow-500 transition-colors"
          placeholder="Issue regarding..."
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1 uppercase">
          Message
        </label>
        <textarea
          className="w-full h-32 bg-black/40 border border-white/20 rounded-xl p-4 text-white resize-none outline-none focus:border-yellow-500"
          placeholder="Describe your issue in detail..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <GoldButton
        fullWidth
        type="submit"
        disabled={loading}
        className="flex justify-center items-center gap-2"
      >
        {loading ? (
          "Sending..."
        ) : (
          <>
            Send Request
            <Send size={16} />
          </>
        )}
      </GoldButton>
    </form>
  );
};

export default ContactForm;
