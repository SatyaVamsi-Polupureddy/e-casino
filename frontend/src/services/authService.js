import api from "./api";

const authService = {
  //   login: (credentials) => api.post("/auth/login", credentials),

  // --- ADD THIS LINE ---
  logout: () => api.post("/auth/logout"),

  // ... keep your existing register or other functions ...
  //   register: (data) => api.post("/players/register", data),
};

export default authService;
