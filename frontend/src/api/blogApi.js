import { apiConfig } from "../config/apiConfig.js";
import { axiosClient } from "./axiosClient.js";

export const blogApi = {
  getAll: () => axiosClient.get(apiConfig.endpoints.blog),
  getBySlug: (slug) => axiosClient.get(`${apiConfig.endpoints.blog}/${slug}`),
};
