import { axiosClient } from "../../api/axiosClient.js";
import { adminApiPath } from "../../config/adminConfig.js";

export const adminAgentsApi = {
  list:         (params) => axiosClient.get(adminApiPath("auth/agents"), { params }),
  getById:      (id)     => axiosClient.get(adminApiPath(`auth/agents/${id}`)),
  create:       (data)   => axiosClient.post(adminApiPath("auth/agents"), data),
  update:       (id, data) => axiosClient.patch(adminApiPath(`auth/agents/${id}`), data),
  toggle:       (id)     => axiosClient.patch(adminApiPath(`auth/agents/${id}/toggle`)),
  remove:       (id)     => axiosClient.delete(adminApiPath(`auth/agents/${id}`)),
  updateMe:     (data)   => axiosClient.patch(adminApiPath("auth/me"), data),
  changePassword: (data) => axiosClient.post(adminApiPath("auth/me/change-password"), data),
};
