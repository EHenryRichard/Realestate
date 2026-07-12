import { axiosClient } from "../../api/axiosClient.js";

export const adminAboutApi = {
  get: () => axiosClient.get("/admin/about"),
  update: (content) => axiosClient.put("/admin/about", { content }),
};
