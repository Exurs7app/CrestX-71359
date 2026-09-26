const CACHE_NAME = "crestx-shell-v8-icons";
const CACHE_PREFIX = "crestx-shell-";
const ICON_VERSION = "?v=crestx-2026-09-26-2";
const APP_SHELL = [
  new URL("./", self.registration.scope).href,
  new URL("./index.html", self.registration.scope).href,
  new URL("./crestx-manifest.webmanifest" + ICON_VERSION, self.registration.scope).href,
  new URL("./crestx-icon-180.png" + ICON_VERSION, self.registration.scope).href,
  new URL("./crestx-icon-192.png" + ICON_VERSION, self.registration.scope).href,
  new URL("./crestx-icon-512.png" + ICON_VERSION, self.registration.scope).href
];
const INDEX_URL = new URL("./index.html", self.registration.scope).href;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
      caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const requestUrl = new URL(event.request.url);
  if (requestUrl.origin !== self.location.origin) return;

  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone();
            event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put("./index.html", copy)));
          }
          return response;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match(INDEX_URL)))
    );
    return;
  }

  const isBrandIcon = /^crestx-icon-\d+\.png$/i.test(requestUrl.pathname.split("/").pop() || "");
  event.respondWith(
    fetch(event.request, isBrandIcon ? { cache: "reload" } : undefined)
      .then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy)));
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});