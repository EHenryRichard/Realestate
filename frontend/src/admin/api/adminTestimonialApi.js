import { axiosClient } from "../../api/axiosClient.js";

export const adminTestimonialApi = {
  list: () => axiosClient.get("/admin/testimonials"),
  getById: (id) => axiosClient.get(`/admin/testimonials/${id}`),
  create: (payload) => axiosClient.post("/admin/testimonials", payload),
  update: (id, payload) => axiosClient.put(`/admin/testimonials/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/testimonials/${id}`),
  toggleVisible: (id, payload) => axiosClient.patch(`/admin/testimonials/${id}/visible`, payload),
};
