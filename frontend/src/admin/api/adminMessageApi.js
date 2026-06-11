import { axiosClient } from "../../api/axiosClient.js";

export const adminMessageApi = {
  list: (params = {}) => axiosClient.get("/admin/messages", { params }),
  getById: (id) => axiosClient.get(`/admin/messages/${id}`),
  markRead: (id) => axiosClient.patch(`/admin/messages/${id}/read`),
  updateStatus: (id, payload) => axiosClient.patch(`/admin/messages/${id}/status`, payload),
  remove: (id) => axiosClient.delete(`/admin/messages/${id}`),
};
