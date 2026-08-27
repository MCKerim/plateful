// Tear-down worker. Plateful dropped its PWA/service worker; this file exists
// only so installs that already registered one remove themselves.
//
// Deleting sw.js is NOT enough: a registered worker keeps serving its cached
// app shell indefinitely, which would pin browsers and installed Android
// builds to the bundle that was current when they last updated. The browser
// fetches this script directly (service-worker scripts bypass the active
// worker), so shipping a self-destroying one is what actually frees them.
//
// Safe to delete once the field has cycled through a release or two.
self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await Promise.all((await caches.keys()).map((key) => caches.delete(key)));
      await self.registration.unregister();
      const clients = await self.clients.matchAll({ type: "window" });
      for (const client of clients) client.navigate(client.url);
    })()
  );
});
