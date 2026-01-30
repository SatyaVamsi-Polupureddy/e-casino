import api from "./api";

const tenantService = {
  // --- 1. PROFILE & STATUS (This was missing) ---
  getTenantProfile: () => api.get("/tenant-admin/me"),

  // --- 2. PLAYER KYC MANAGEMENT ---
  getPendingPlayers: () => api.get("/kyc/tenant-admin/pending-players"),

  reviewPlayerKYC: (playerId, status) =>
    api.put("/kyc/player/review", { player_id: playerId, status }),

  // --- 3. TENANT'S OWN KYC ---
  submitTenantKYC: (docType, docUrl) =>
    api.post("/kyc/tenant/submit", {
      document_type: docType,
      document_url: docUrl,
    }),

  // --- 4. STAFF MANAGEMENT (Updated for Role) ---
  createTenantUser: (email, password, role) =>
    api.post("/tenant-admin/users", { email, password, role }),

  updateUserStatus: (email, status) =>
    api.put("/tenant-admin/users/status", { email, status }),

  // --- 5. SETTINGS & LIMITS ---
  updateDefaultLimits: (limits) =>
    api.put("/tenant-admin/settings/default-limits", limits),

  updatePlayerLimitsByEmail: (email, limits) =>
    api.put("/tenant-admin/players/limits/update-by-email", {
      email,
      ...limits,
    }),
  // ... existing code ...
  updateMyPassword: (oldPassword, newPassword) =>
    api.put("/tenant-admin/me/password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),
  updatePlayerStatus: (email, status) =>
    api.put("/tenant-admin/players/status", { email, status }),

  // Players
  getAllPlayers: () => api.get("/tenant-admin/players"), // Assuming you have this

  // NEW: KYC & Bonus
  updateKYC: (email, status) =>
    api.put("/tenant-admin/players/kyc/update", { email, status }),

  // Campaigns
  getCampaigns: () => api.get("/tenant-admin/bonus/campaigns"), // You might need to add this getter in bonus.py
  createCampaign: (data) => api.post("/tenant-admin/bonus/campaigns", data), // Endpoint: /tenant-admin/campaigns (from previous steps)

  // Note: Check your bonus.py routes. If they are under /tenant-admin/bonus, use that.
  // Based on previous turn, creating campaign was in tenant_admin.py (moved to bonus.py)

  distributeBonus: (campaignId, amount) =>
    api.post(`/tenant-admin/bonus/campaign/${campaignId}/distribute-all`, {
      amount,
    }),
};

export default tenantService;
