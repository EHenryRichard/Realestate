import { axiosClient } from "../../api/axiosClient.js";
import { adminApiPath } from "../../config/adminConfig.js";

// Admin management of PUBLIC (client) accounts — the people who signed up on the
// website. Hits /api/<admin_api_path>/users (admin-only on the server).
export const adminUsersApi = {
  list:    (params) => axiosClient.get(adminApiPath("users"), { params }),
  getById: (id)     => axiosClient.get(adminApiPath(`users/${id}`)),
  update:  (id, data) => axiosClient.patch(adminApiPath(`users/${id}`), data),
  toggle:  (id)     => axiosClient.patch(adminApiPath(`users/${id}/toggle`)),
  remove:  (id)     => axiosClient.delete(adminApiPath(`users/${id}`)),
};
