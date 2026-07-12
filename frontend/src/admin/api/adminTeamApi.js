import { axiosClient } from "../../api/axiosClient.js";

export const adminTeamApi = {
  list: (params) => axiosClient.get("/admin/team", { params }),
  getById: (id) => axiosClient.get(`/admin/team/${id}`),
  create: (payload) => axiosClient.post("/admin/team", payload),
  update: (id, payload) => axiosClient.put(`/admin/team/${id}`, payload),
  remove: (id) => axiosClient.delete(`/admin/team/${id}`),
  toggleVisible: (id) => axiosClient.patch(`/admin/team/${id}/visible`),
};
