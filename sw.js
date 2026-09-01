const CACHE_NAME = "shift-calendar-firebase-sync-v12";

const APP_SHELL = [
  "./manifest.webmanifest",
  "./icons/icon-180.png",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    Promise.all([
      caches.keys().then(keys =>
        Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
      ),
      self.clients.claim()
    ])
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET") return;

  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(
      fetch(req, {cache:"no-store"})
        .then(resp => resp)
        .catch(() => caches.match("./index.html"))
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(cached =>
      cached || fetch(req).then(resp => {
        if (resp && resp.ok && new URL(req.url).origin === self.location.origin) {
          caches.open(CACHE_NAME).then(cache => cache.put(req, resp.clone()));
        }
        return resp;
      })
    )
  );
});
