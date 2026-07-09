import { axiosClient } from "../../api/axiosClient.js";
import { adminApiPath } from "../../config/adminConfig.js";

// Admin review of "become an agent" applications (admin-only on the server).
export const adminAgentRequestsApi = {
  list:    (params) => axiosClient.get(adminApiPath("agent-requests"), { params }),
  approve: (id)     => axiosClient.patch(adminApiPath(`agent-requests/${id}/approve`)),
  reject:  (id)     => axiosClient.patch(adminApiPath(`agent-requests/${id}/reject`)),
};
