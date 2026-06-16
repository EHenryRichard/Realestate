import { axiosClient } from "../../api/axiosClient.js";

export const adminFaqApi = {
  list: () => axiosClient.get("/admin/faqs"),
  getById: (id) => axiosClient.get(`/admin/faqs/${id}`),
  create: (payload) => axiosClient.post("/admin/faqs", payload),
  update: (id, payload) => axiosClient.put(`/admin/faqs/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/faqs/${id}`),
  toggleVisible: (id) => axiosClient.patch(`/admin/faqs/${id}/visible`),
};
