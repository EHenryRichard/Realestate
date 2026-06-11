import { apiConfig } from "../config/apiConfig.js";
import { axiosClient } from "./axiosClient.js";

export const newsletterApi = {
  subscribe: (payload) => axiosClient.post(apiConfig.endpoints.newsletter, payload),
};
