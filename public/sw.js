// Nox dashboard service worker: makes the app installable and the shell usable offline.
// Pages: network first, cached copy when offline. Build assets: cache first (they are content-hashed).
// Chain data (RPC calls) is never cached: proofs must always be computed from fresh chain data.
const CACHE = "nox-v1";
const SHELL = ["/", "/game/", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(req).then(
        (hit) => hit || fetch(req).then((res) => (caches.open(CACHE).then((c) => c.put(req, res.clone())), res)),
      ),
    );
    return;
  }

  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => (caches.open(CACHE).then((c) => c.put(url.pathname, res.clone())), res))
        .catch(() => caches.match(url.pathname).then((hit) => hit || caches.match("/"))),
    );
  }
});
