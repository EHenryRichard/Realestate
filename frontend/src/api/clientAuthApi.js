// Thin wrappers around the client-account endpoints. Each returns the response
// body ({ success, message, data }) because clientAxios unwraps `response.data`.
import { clientAxios } from "./clientAxios.js";

export const clientAuthApi = {
  register: (payload) => clientAxios.post("/client/auth/register", payload),
  login: (payload) => clientAxios.post("/client/auth/login", payload),
  refresh: () => clientAxios.post("/client/auth/refresh"),
  logout: () => clientAxios.post("/client/auth/logout"),
  me: () => clientAxios.get("/client/auth/me"),
  updateMe: (payload) => clientAxios.patch("/client/auth/me", payload),
  verifyEmail: (token) => clientAxios.post("/client/auth/verify-email", { token }),
  resendVerification: (email) =>
    clientAxios.post("/client/auth/resend-verification", { email }),
};
