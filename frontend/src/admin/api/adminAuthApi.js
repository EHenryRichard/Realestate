import { axiosClient } from "../../api/axiosClient.js";

export const adminAuthApi = {
  signup: (payload) => axiosClient.post("/admin/auth/signup", payload),
  login: (payload) => axiosClient.post("/admin/auth/login", payload),
  refresh: () => axiosClient.post("/admin/auth/refresh"),
  me: () => axiosClient.get("/admin/auth/me"),
  logout: () => axiosClient.post("/admin/auth/logout"),
  listAgents: () => axiosClient.get("/admin/auth/agents"),
  registerAgent: (payload) => axiosClient.post("/admin/auth/agents", payload),
};
