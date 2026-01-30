import api from "./api";

const staffService = {
  // ... Existing methods (lookup, register, deposit, withdraw) ...
  lookupPlayer: (email) => api.get(`/staff/lookup?email=${email}`),
  registerPlayer: (data) => api.post("/staff/register-player", data),
  initiateDeposit: (email, amount) =>
    api.post("/staff/deposit/initiate", {
      player_email: email,
      amount: parseFloat(amount),
    }),
  verifyDeposit: (email, otp) =>
    api.post("/staff/deposit/verify", { player_email: email, otp_code: otp }),
  initiateWithdrawal: (email, amount) =>
    api.post("/staff/withdraw/initiate", {
      player_email: email,
      amount: parseFloat(amount),
    }),
  verifyWithdrawal: (email, otp) =>
    api.post("/staff/withdraw/verify", { player_email: email, otp_code: otp }),

  // --- NEW FEATURES ---
  changePassword: (oldPassword, newPassword) =>
    api.put("/staff/me/password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),
  getMyTransactions: () => api.get("/staff/my-transactions"),

  // Fix the URL to match the new Pydantic endpoint
  uploadKYC: (email, url) =>
    api.post("/staff/player/upload-kyc-json", {
      player_email: email,
      doc_url: url,
    }),
};

export default staffService;
