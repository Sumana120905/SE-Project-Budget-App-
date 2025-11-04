const CACHE_NAME = "budget-tracker-cache-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/index.html",
  "/login.html",
  "/register.html",
  "/dashboard.html",
  "/reports.html",
  "/settings.html",
  "/sidebar.html",
  "/styles.css",
  "/main.js",
  "/icons/notify.png",
  "https://cdn.jsdelivr.net/npm/chart.js", // external dependency
];

// Install event – cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
  self.skipWaiting();
});

// Activate event – clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch event – serve cached files when offline
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return (
        cachedResponse ||
        fetch(event.request)
          .then((networkResponse) => {
            // Optionally cache new requests
            if (event.request.url.startsWith(self.location.origin)) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
              });
            }
            return networkResponse;
          })
          .catch(() => caches.match("/offline.html"))
      );
    })
  );
});

