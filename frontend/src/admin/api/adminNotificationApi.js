import { axiosClient } from "../../api/axiosClient.js";

export const adminNotificationApi = {
  subscribe: (payload) => axiosClient.post("/admin/notifications/subscribe", payload),
  unsubscribe: (payload) => axiosClient.delete("/admin/notifications/subscribe", { data: payload }),
};
