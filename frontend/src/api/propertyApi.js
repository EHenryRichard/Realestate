import { apiConfig } from "../config/apiConfig.js";
import { axiosClient } from "./axiosClient.js";

export const propertyApi = {
  getAll: (params) => axiosClient.get(apiConfig.endpoints.properties, { params }),
  getFeatured: () => axiosClient.get(apiConfig.endpoints.featuredProperties),
  getBySlug: (slug) => axiosClient.get(`${apiConfig.endpoints.properties}/${slug}`),
};
