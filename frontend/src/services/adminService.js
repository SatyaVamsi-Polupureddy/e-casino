import api from "./api";

const adminService = {
  //  KYC
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

  // tenant
  getAllTenants: () => api.get("/admin/tenants/all"),

  createTenant: (data) => api.post("/admin/tenants", data),

  updateTenantStatus: (tenantId, status) =>
    api.put("/admin/tenants/status", { tenant_id: tenantId, status }),

  // currency
  getCurrencies: () => api.get("/admin/currencies"),
  createCurrency: (data) => api.post("/admin/currencies", data),

  // country
  getCountries: () => api.get("/admin/countries"),
  createCountry: (data) => api.post("/admin/countries", data),

  // exchange rates
  getExchangeRates: () => api.get("/admin/exchange-rates"),
  createExchangeRate: (data) => api.post("/admin/exchange-rates", data),

  // earnings
  getPlatformEarnings: (filters = {}) => {
    // Convert object { group_by: 'GAME', time_range: '1W' } into query string
    const params = new URLSearchParams(filters).toString();
    return api.get(`/admin/earnings?${params}`);
  },

  // super ADMIN
  getAllAdmins: () => api.get("/admin/admins/all"),

  createSuperAdmin: (email, password) =>
    api.post("/admin/users", { email, password }),

  updateSuperAdminStatus: (email, status) =>
    api.put("/admin/users/status", { email, status }),

  // password
  updateMyPassword: (oldPassword, newPassword) =>
    api.put("/admin/me/password", {
      old_password: oldPassword,
      new_password: newPassword,
    }),

  // JACKPOT
  // createJackpot: (data) => api.post("/tenant-admin/jackpot/create", data),
  // getJackpots: () => api.get("/tenant-admin/jackpot/list"),
  // drawWinner: (eventId) => api.post(`/tenant-admin/jackpot/draw/${eventId}`),

  // games
  getPlatformGames: () => api.get("/admin/games/platform"),

  addPlatformGame: (gameData) => api.post("/admin/games/platform", gameData),

  togglePlatformGame: (gameId, isActive) =>
    api.patch(`/admin/games/platform/${gameId}`, { is_active: isActive }),
};

export default adminService;
