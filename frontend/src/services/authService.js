import api from "./api";
const TENANT_ID = import.meta.env.VITE_TENANT_ID;
const authService = {
  login: async (email, password, roleType = "PLAYER") => {
    const response = await api.post("/auth/login", {
      email,
      password,
      tenant_id: TENANT_ID,
      login_type: roleType,
    });
    return response;
  },
  logout: () => api.post("/auth/logout"),

  forgotPassword: (email) => api.post("/auth/forgot-password", { email }),
};

export default authService;
