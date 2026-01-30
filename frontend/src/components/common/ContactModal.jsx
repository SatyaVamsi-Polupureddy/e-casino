import React from "react";
import { X, Mail } from "lucide-react";
import ContactForm from "./ContactForm";

const ContactModal = ({ isOpen, onClose, userRole }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#040029] w-full max-w-md p-6 rounded-2xl border border-white/20 relative shadow-2xl animate-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={20} />
        </button>

        <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
          <Mail className="text-yellow-500" /> Contact Support
        </h2>
        <p className="text-xs text-gray-400 mb-6">
          Direct line to Platform Super Admin.
        </p>

        <ContactForm userRole={userRole} onSuccess={onClose} />
      </div>
    </div>
  );
};

export default ContactModal;
