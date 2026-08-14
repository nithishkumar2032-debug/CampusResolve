self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open("campusresolve-v1").then((cache) =>
      cache.addAll(["/", "/login", "/manifest.webmanifest"]),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  event.respondWith(
    caches.match(req).then((cached) => {
      const network = fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open("campusresolve-v1").then((cache) => cache.put(req, copy));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
