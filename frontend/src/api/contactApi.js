import { apiConfig } from "../config/apiConfig.js";
import { axiosClient } from "./axiosClient.js";

export const contactApi = {
  submitContact: (payload) => axiosClient.post(apiConfig.endpoints.contact, payload),
};
