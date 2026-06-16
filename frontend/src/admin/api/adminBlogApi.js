import { axiosClient } from "../../api/axiosClient.js";

export const adminBlogApi = {
  list: () => axiosClient.get("/admin/blog"),
  getById: (id) => axiosClient.get(`/admin/blog/${id}`),
  create: (payload) => axiosClient.post("/admin/blog", payload),
  update: (id, payload) => axiosClient.put(`/admin/blog/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/blog/${id}`),
  togglePublish: (id) => axiosClient.patch(`/admin/blog/${id}/publish`),
};
