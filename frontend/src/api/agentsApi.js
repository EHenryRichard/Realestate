import { apiConfig } from "../config/apiConfig.js";
import { axiosClient } from "./axiosClient.js";

export const agentsApi = {
  getAll: () => axiosClient.get(apiConfig.endpoints.agents),
  getBySlug: (slug) => axiosClient.get(`${apiConfig.endpoints.agents}/${slug}`),
};
