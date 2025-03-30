const CACHE_NAME = "cms-cache";
const URLS_TO_CACHE = [
  "/",
  "/students.html",
  "/tasks.html",
  "/messages.html",
  "/dashboard.html",
  "/manifest.json",
  "/css/style.css",
  "/css/table.css",
  "/css/navigation.css",
  "/css/header.css",
  "/css/main.css",
  "/css/modal.css",
  "/css/respon.css",
  "/js/app.js",
  "/js/models.js",
  "/js/notifications.js",
  "/js/navigation.js",
  "/js/studentTable.js",
  "/js/modals.js",
  "/img/avatar.webp",
  "/screenshots/pc.png",
  "/screenshots/mobile.png",
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(URLS_TO_CACHE);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker activating...");
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            console.log("Removing old cache", key);
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request)
        .then((response) => {
          if (
            !response ||
            response.status !== 200 ||
            response.type !== "basic"
          ) {
            return response;
          }

          const responseToCache = response.clone();

          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });

          return response;
        })
        .catch(() => {
          if (event.request.mode === "navigate") {
            return caches.match("/students.html");
          }
          return new Response("Offline content not available.");
        });
    })
  );
});

self.addEventListener("message", (event) => {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});
