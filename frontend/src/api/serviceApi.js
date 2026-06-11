import { apiConfig } from "../config/apiConfig.js";
import { axiosClient } from "./axiosClient.js";

export const serviceApi = {
  getAll: () => axiosClient.get(apiConfig.endpoints.services),
};
