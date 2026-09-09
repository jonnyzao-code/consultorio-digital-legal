// Service worker mínimo: permite mostrar notificaciones en celulares
// (incluido iPhone con la app agregada a la pantalla de inicio).
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((lista) => {
      for (const c of lista) {
        if ("focus" in c) return c.focus();
      }
      return self.clients.openWindow("/panel");
    }),
  );
});
