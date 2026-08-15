self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open("campusresolve-static-v2").then((cache) =>
      cache.addAll(["/offline", "/manifest.webmanifest", "/icons/icon-192.png"]),
    ),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k.startsWith("campusresolve-") && k !== "campusresolve-static-v2")
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // Never cache auth/API/private app data
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/student") ||
    url.pathname.startsWith("/warden") ||
    url.pathname.startsWith("/worker") ||
    url.pathname.startsWith("/admin") ||
    url.hostname.includes("supabase")
  ) {
    event.respondWith(
      fetch(req).catch(() => caches.match("/offline").then((r) => r || Response.error())),
    );
    return;
  }

  // Network-first for navigations
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => res)
        .catch(() => caches.match("/offline").then((r) => r || Response.error())),
    );
    return;
  }

  // Cache-first only for static assets
  if (
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.endsWith(".webmanifest")
  ) {
    event.respondWith(
      caches.match(req).then((cached) => {
        const network = fetch(req).then((res) => {
          const copy = res.clone();
          caches.open("campusresolve-static-v2").then((cache) => cache.put(req, copy));
          return res;
        });
        return cached || network;
      }),
    );
  }
});
