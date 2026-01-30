import axios from "axios";

// Create base instance
const api = axios.create({
  baseURL: "http://localhost:8000", // Points to your FastAPI Backend
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
