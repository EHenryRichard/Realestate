import { axiosClient } from "../../api/axiosClient.js";

export const adminDashboardApi = {
  getDashboard: () => axiosClient.get("/admin/dashboard"),
};
