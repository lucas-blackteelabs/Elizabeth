// Network-first, just enough to be installable and survive a flaky connection.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET" || new URL(e.request.url).pathname.startsWith("/api/")) return;
  e.respondWith(fetch(e.request).then((r) => { const c = r.clone(); caches.open("fos-v1").then((cache) => cache.put(e.request, c)); return r; }).catch(() => caches.match(e.request)));
});
