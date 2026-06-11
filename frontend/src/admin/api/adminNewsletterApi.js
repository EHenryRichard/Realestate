import { axiosClient } from "../../api/axiosClient.js";

export const adminNewsletterApi = {
  list: (params = {}) => axiosClient.get("/admin/newsletter", { params }),
  remove: (id) => axiosClient.delete(`/admin/newsletter/${id}`),
  updateStatus: (id, payload) => axiosClient.patch(`/admin/newsletter/${id}/status`, payload),
};
