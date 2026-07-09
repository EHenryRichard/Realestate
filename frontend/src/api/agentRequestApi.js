// Public "become an agent" endpoints (no auth required).
import { axiosClient } from "./axiosClient.js";

export const agentRequestApi = {
  // Submit an application: { email, fullName?, phone?, message? }
  submit: (payload) => axiosClient.post("/agent-requests", payload),
  // Finish signup from the emailed invite link: { token, fullName, password, phone?, title?, bio? }
  completeSignup: (payload) => axiosClient.post("/agent-signup", payload),
};
