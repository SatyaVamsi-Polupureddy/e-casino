import api from "./api";

const tenantService = {
  // --- 1. PROFILE ---
  getTenantProfile: () => api.get("/tenant-admin/me"),
  updateMyPassword: (oldPassword, newPassword) =>
    api.put("/tenant-admin/me/password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),
  submitTenantKYC: (docType, docUrl) =>
    api.post("/kyc/tenant/submit", {
      document_type: docType,
      document_url: docUrl,
    }),

  //  PLAYERs
  getAllPlayers: () => api.get("/tenant-admin/players/all"),

  updatePlayerStatus: (email, status) =>
    api.put("/tenant-admin/player/status", { email, status }),

  updatePlayerLimitsByEmail: (email, limits) =>
    api.post("/tenant-admin/player/limits", { email, ...limits }),

  // kyc
  getPendingPlayers: () => api.get("/tenant-admin/players/pending"),

  reviewPlayerKYC: (playerId, status) =>
    api.put("/kyc/player/review", {
      player_id: playerId,
      status,
    }),

  // STAFF
  getAllStaff: () => api.get("/tenant-admin/staff/all"),

  createTenantUser: (email, password, role) =>
    api.post("/tenant-admin/create-user", { email, password, role }),

  updateUserStatus: (email, status) =>
    api.put("/tenant-admin/user/status", { email, status }),

  // SETTINGS
  updateDefaultLimits: (limits) =>
    api.put("/tenant-admin/settings/default-limits", limits),

  // CAMPAIGNS
  getCampaigns: () => api.get("/tenant-admin/bonus/campaigns"),
  createCampaign: (data) => api.post("/tenant-admin/bonus/campaigns", data),
  distributeBonus: (campaignId, amount) =>
    api.post(`/tenant-admin/bonus/campaign/${campaignId}/distribute-all`, {
      amount,
    }),

  getSummary: () => api.get("/tenant/stats/summary"),

  getPlayerStats: (filterType, threshold = 0, month = "") =>
    api.get("/tenant/stats/players", {
      params: {
        filter_type: filterType,
        threshold: threshold,
        month: month,
      },
    }),
};

export default tenantService;
