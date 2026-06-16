import { apiConfig } from "../config/apiConfig.js";
import { axiosClient } from "./axiosClient.js";

export const faqApi = {
  getAll: () => axiosClient.get(apiConfig.endpoints.faqs),
};
