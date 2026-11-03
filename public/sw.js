// Service worker: shows push notifications and opens the right page on click.
// Kept minimal on purpose (no offline caching), so it never serves stale app code.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: "English for me", body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "English for me";
  event.waitUntil(
    self.registration.showNotification(title, {
      body: data.body || "",
      icon: "/icon-192.png",
      badge: "/badge-96.png",
      tag: data.tag || undefined,
      renotify: Boolean(data.tag),
      // Make sure the OS may play its sound; desktop keeps study reminders on screen until dismissed.
      // (Sound/vibration on phones is controlled by the OS notification settings for this app.)
      silent: false,
      requireInteraction: Boolean(data.sticky),
      vibrate: [200, 100, 200],
      data: { url: data.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = new URL((event.notification.data && event.notification.data.url) || "/", self.location.origin).href;
  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of windows) {
        if (client.url === url && "focus" in client) return client.focus();
      }
      for (const client of windows) {
        if ("navigate" in client && "focus" in client) {
          await client.navigate(url);
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })(),
  );
});
