import { axiosClient } from "../../api/axiosClient.js";

export const adminServiceApi = {
  list: () => axiosClient.get("/admin/services"),
  getById: (id) => axiosClient.get(`/admin/services/${id}`),
  create: (payload) => axiosClient.post("/admin/services", payload),
  update: (id, payload) => axiosClient.put(`/admin/services/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/services/${id}`),
  toggleActive: (id, payload) => axiosClient.patch(`/admin/services/${id}/active`, payload),
};
