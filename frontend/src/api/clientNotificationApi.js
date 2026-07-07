// Client web-push subscribe/unsubscribe. Uses the authenticated clientAxios so
// the subscription is tied to the signed-in client on the server.
import { clientAxios } from "./clientAxios.js";

export const clientNotificationApi = {
  subscribe: (payload) => clientAxios.post("/client/notifications/subscribe", payload),
  // axios sends a body on DELETE via the `data` option.
  unsubscribe: (payload) =>
    clientAxios.delete("/client/notifications/subscribe", { data: payload }),
};
