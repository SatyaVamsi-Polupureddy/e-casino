import api from "./api";

const authService = {
  //   login: (credentials) => api.post("/auth/login", credentials),

  // --- ADD THIS LINE ---
  logout: () => api.post("/auth/logout"),

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),

  // ... keep your existing register or other functions ...
  //   register: (data) => api.post("/players/register", data),
};

export default authService;
