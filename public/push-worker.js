self.addEventListener("push", (event) => {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { body: event.data.text() };
    }
  }

  const title = data.title || "Recordatorio de Asistencia";
  const options = {
    body: data.body || "Es hora de registrar tu asistencia.",
    icon: data.icon || "/pwa-192x192-v2.png",
    badge: data.badge || "/pwa-192x192-v2.png",
    vibrate: [200, 100, 200],
    data: {
      url: data.url || "/home",
      ...data.data,
    },
    actions: data.actions || [],
    tag: data.tag || "reloj-asistencia-tag",
    renotify: true,
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/home";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ("focus" in client) {
          if (client.url.includes(targetUrl)) {
            return client.focus();
          }
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener("pushsubscriptionchange", (event) => {
  event.waitUntil(
    self.registration.pushManager
      .subscribe(event.oldSubscription ? event.oldSubscription.options : { userVisibleOnly: true })
      .then((subscription) => {
        return fetch("/api/notificaciones/suscribir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            subscriptionJson: JSON.stringify(subscription),
          }),
        });
      })
  );
});
