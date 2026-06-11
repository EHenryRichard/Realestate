import { axiosClient } from "../../api/axiosClient.js";

export const adminPropertyApi = {
  list: (params = {}) => axiosClient.get("/admin/properties", { params }),
  getById: (id) => axiosClient.get(`/admin/properties/${id}`),
  create: (payload) => axiosClient.post("/admin/properties", payload),
  update: (id, payload) => axiosClient.put(`/admin/properties/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/properties/${id}`),
  toggleFeatured: (id, payload) => axiosClient.patch(`/admin/properties/${id}/featured`, payload),
  updateStatus: (id, payload) => axiosClient.patch(`/admin/properties/${id}/status`, payload),
};
