import api from "./api";

const playerService = {
  getDashboard: () => api.get("/players/dashboard"),
  // src/services/playerService.js
  getGameDetails: (gameId) => api.get(`/players/game/${gameId}`),

  // --- NEW SESSION FLOW ---
  startSession: (gameId) =>
    api.post("/players/session/start", { game_id: gameId }),
  endSession: (sessionId) =>
    api.post("/players/session/end", { session_id: sessionId }),
  playRound: (gameId, amount, prediction, walletType) =>
    api.post(`/engine/play/${gameId}`, {
      // <--- Note the URL change
      bet_amount: parseFloat(amount),
      use_wallet_type: walletType,
      bet_data: {
        prediction: prediction,
      },
    }),

  submitKYC: (url) =>
    api.post("/kyc/player/submit", {
      document_url: url,
      document_type: "ID_CARD",
    }),
  getTransactions: () => api.get("/players/my-transactions"),
  depositSelf: (amount) =>
    api.post("/players/deposit/self", { amount: parseFloat(amount) }),
  withdrawSelf: (amount) =>
    api.post("/players/withdraw/self", { amount: parseFloat(amount) }),
  // Jackpots
  getJackpots: () => api.get("/players/jackpots"),
  enterJackpot: (eventId, walletType) =>
    api.post("/players/jackpots/enter", {
      jackpot_event_id: eventId,
      wallet_type: walletType,
    }),

  getLatestWinner: () => api.get("/players/jackpots/latest-winner"),
  updatePassword: (oldPassword, newPassword) => {
    return api.put("/players/profile/password", {
      old_password: oldPassword,
      new_password: newPassword,
    });
  },
};

export default playerService;
