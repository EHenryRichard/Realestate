self.addEventListener("push", (event) => {
  let payload = {};

  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }

  const title = payload.title || "Sureboy Realty alert";
  const options = {
    body: payload.body || "A new lead was received.",
    icon: "/images/logo/logo.png",
    badge: "/images/logo/logo.png",
    data: {
      url: payload.url || "/",
    },
    tag: payload.tag || "sureboy-lead-alert",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = new URL(event.notification.data?.url || "/", self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ includeUncontrolled: true, type: "window" }).then((clientList) => {
      const sameOriginClient = clientList.find((client) => new URL(client.url).origin === self.location.origin);

      if (sameOriginClient) {
        sameOriginClient.focus();
        return sameOriginClient.navigate(targetUrl);
      }

      return clients.openWindow(targetUrl);
    }),
  );
});
