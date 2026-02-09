import React, { useState } from "react";
import toast from "react-hot-toast";
import { X, ShieldCheck } from "lucide-react";
import InputField from "../../ui/InputField";
import GoldButton from "../../ui/GoldButton";
import playerService from "../../../services/playerService";

const PasswordModal = ({ isOpen, onClose }) => {
  const [pwdForm, setPwdForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    if (pwdForm.newPassword.length < 6) {
      return toast.error("Password must be at least 6 characters");
    }

    const promise = playerService.updatePassword(
      pwdForm.oldPassword,
      pwdForm.newPassword,
    );

    toast.promise(promise, {
      loading: "Updating password...",
      success: () => {
        onClose();
        setPwdForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
        return "Password updated successfully!";
      },
      error: (err) => err.response?.data?.detail || "Failed to update password",
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-[#040029] w-full max-w-md p-8 rounded-2xl border border-white/10 relative shadow-2xl animate-in zoom-in duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
          <ShieldCheck className="text-yellow-500" /> Change Password
        </h2>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Current Password
            </label>
            <InputField
              type="password"
              value={pwdForm.oldPassword}
              onChange={(e) =>
                setPwdForm({ ...pwdForm, oldPassword: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              New Password
            </label>
            <InputField
              type="password"
              value={pwdForm.newPassword}
              onChange={(e) =>
                setPwdForm({ ...pwdForm, newPassword: e.target.value })
              }
              required
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
              Confirm New Password
            </label>
            <InputField
              type="password"
              value={pwdForm.confirmPassword}
              onChange={(e) =>
                setPwdForm({ ...pwdForm, confirmPassword: e.target.value })
              }
              required
            />
          </div>

          <div className="pt-2">
            <GoldButton fullWidth type="submit">
              Update Password
            </GoldButton>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordModal;
