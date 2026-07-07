import { axiosClient } from "../../api/axiosClient.js";

export const adminAuthApi = {
  signup: (payload) => axiosClient.post("/admin/auth/signup", payload),
  login: (payload) => axiosClient.post("/admin/auth/login", payload),
  refresh: () => axiosClient.post("/admin/auth/refresh"),
  // Step 1 of password reset: ask the server to email a reset link. payload = { email }.
  forgotPassword: (payload) => axiosClient.post("/admin/auth/forgot-password", payload),
  // Step 2: send the token from the emailed link + the new password. payload = { token, newPassword }.
  resetPassword: (payload) => axiosClient.post("/admin/auth/reset-password", payload),
  me: () => axiosClient.get("/admin/auth/me"),
  logout: () => axiosClient.post("/admin/auth/logout"),
  listAgents: () => axiosClient.get("/admin/auth/agents"),
  registerAgent: (payload) => axiosClient.post("/admin/auth/agents", payload),
};
