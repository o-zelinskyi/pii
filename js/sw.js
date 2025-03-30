self.addEventListener("install", (evt) => {
  console.error("Service Worker installing...");
});

self.addEventListener("activate", (evt) => {
  console.error("Service Worker activating...");
});
