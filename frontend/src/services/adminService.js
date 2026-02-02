import api from "./api";

const adminService = {
  // --- 1. KYC MANAGEMENT ---
  getPendingKYC: () => api.get("/kyc/super-admin/pending-tenants"),

  approveKYC: (tenantId) =>
    api.put("/kyc/tenant/review", {
      tenant_id: tenantId,
      status: "APPROVED",
      remarks: "Approved by Super Admin",
    }),

  rejectKYC: (tenantId, reason) =>
    api.put("/kyc/tenant/review", {
      tenant_id: tenantId,
      status: "REJECTED",
      remarks: reason,
    }),

  getAllTenants: () => api.get("/admin/tenants/all"),

  // --- 2. TENANT & CONFIG ---
  createTenant: (data) => api.post("/admin/tenants", data),
  updateTenantStatus: (tenantId, status) =>
    api.put("/admin/tenants/status", { tenant_id: tenantId, status }),

  getCurrencies: () => api.get("/admin/currencies"),
  createCurrency: (data) => api.post("/admin/currencies", data),

  getCountries: () => api.get("/admin/countries"),
  createCountry: (data) => api.post("/admin/countries", data),

  getExchangeRates: () => api.get("/admin/exchange-rates"),
  createExchangeRate: (data) => api.post("/admin/exchange-rates", data),

  // --- 3. DASHBOARD ANALYTICS ---
  getPlatformEarnings: (filters = {}) => {
    // Convert object { group_by: 'GAME', time_range: '1W' } into query string
    const params = new URLSearchParams(filters).toString();
    return api.get(`/admin/earnings?${params}`);
  },

  // --- 4. ADMIN USER MANAGEMENT ---
  getAllAdmins: () => api.get("/admin/admins/all"),
  createSuperAdmin: (email, password) =>
    api.post("/admin/users", { email, password }),

  updateSuperAdminStatus: (email, status) =>
    api.put("/admin/users/status", { email, status }),

  updateMyPassword: (oldPassword, newPassword) =>
    api.put("/admin/me/password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  // --- 5. JACKPOT MANAGEMENT ---
  createJackpot: (data) => api.post("/tenant-admin/jackpot/create", data),
  getJackpots: () => api.get("/tenant-admin/jackpot/list"),
  drawWinner: (eventId) => api.post(`/tenant-admin/jackpot/draw/${eventId}`),

  // --- 6. PLATFORM GAME LIBRARY (NEW) ---
  // Fetches the global list of games available for tenants to install
  getPlatformGames: () => api.get("/admin/games/platform"),

  // Adds a new game definition (Title, Thumbnail, Type) to the library
  addPlatformGame: (gameData) => api.post("/admin/games/platform", gameData),

  // Toggles a game between Active/Inactive globally
  togglePlatformGame: (gameId, isActive) =>
    api.patch(`/admin/games/platform/${gameId}`, { is_active: isActive }),
};

export default adminService;
