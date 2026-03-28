"use strict";

const CACHE_NAME = "maphop-v1";

self.addEventListener("install", () => {
    // Activate immediately without waiting for old tabs to close
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    // Delete caches from old versions
    event.waitUntil(
        caches.keys()
            .then((keys) =>
                Promise.all(
                    keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
                )
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    const { request } = event;

    // Only cache same-origin GET requests (app shell assets).
    // Cross-origin tile/API requests go straight to the network.
    if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
        return;
    }

    // Network-first: try the network, fall back to the cache so the app
    // stays usable offline after the first visit.
    event.respondWith(
        caches.open(CACHE_NAME).then(async (cache) => {
            try {
                const response = await fetch(request);
                if (response.ok) {
                    cache.put(request, response.clone());
                }
                return response;
            } catch {
                const cached = await cache.match(request);
                if (cached) {
                    return cached;
                }
                return new Response("App is offline and this resource has not been cached yet.", {
                    status: 503,
                    headers: { "Content-Type": "text/plain" }
                });
            }
        })
    );
});
