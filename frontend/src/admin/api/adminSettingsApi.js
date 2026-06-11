import { axiosClient } from "../../api/axiosClient.js";

export const adminSettingsApi = {
  get: () => axiosClient.get("/admin/settings"),
  update: (payload) => axiosClient.put("/admin/settings", payload),
};
