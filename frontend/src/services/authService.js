import api from "./api";

const authService = {
  logout: () => api.post("/auth/logout"),

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
};

export default authService;
