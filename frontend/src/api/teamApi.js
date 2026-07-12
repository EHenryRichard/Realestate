import { axiosClient } from "./axiosClient.js";

export const teamApi = {
  getAll: () => axiosClient.get("/team"),
  getBySlug: (slug) => axiosClient.get(`/team/${slug}`),
};
