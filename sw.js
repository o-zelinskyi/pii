const CACHE_NAME = "cms-cache";
const BASE_URL = self.location.origin;
const URLS_TO_CACHE = [
  `${BASE_URL}/`,
  `${BASE_URL}/students.html`,
  `${BASE_URL}/tasks.html`,
  `${BASE_URL}/messages.html`,
  `${BASE_URL}/dashboard.html`,
  `${BASE_URL}/manifest.json`,
  `${BASE_URL}/css/style.css`,
  `${BASE_URL}/css/table.css`,
  `${BASE_URL}/css/navigation.css`,
  `${BASE_URL}/css/header.css`,
  `${BASE_URL}/css/main.css`,
  `${BASE_URL}/css/modal.css`,
  `${BASE_URL}/css/respon.css`,
  `${BASE_URL}/js/app.js`,
  `${BASE_URL}/js/models.js`,
  `${BASE_URL}/js/notifications.js`,
  `${BASE_URL}/js/navigation.js`,
  `${BASE_URL}/js/studentTable.js`,
  `${BASE_URL}/js/modals.js`,
  `${BASE_URL}/img/avatar.webp`,
  `${BASE_URL}/screenshots/pc.png`,
  `${BASE_URL}/screenshots/mobile.png`,
];

self.addEventListener("install", (event) => {
  console.log("Service Worker installing...");
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Opened cache");
      return cache.addAll(URLS_TO_CACHE).catch(console.error);
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
