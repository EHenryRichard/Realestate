import { axiosClient } from "./axiosClient.js";

export const aboutApi = {
  get: () => axiosClient.get("/about"),
};
