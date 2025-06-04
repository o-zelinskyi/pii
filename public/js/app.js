import { Student } from "./models.js";
import { setupNavigationAndMenus } from "./navigation.js";
import { setupStudentTable } from "./studentTable.js";
import { setupModalWindows } from "./modals.js";

document.addEventListener("DOMContentLoaded", () => {
  // Use globally available setupNotifications function
  if (window.setupNotifications) {
    setupNotifications();
  }

  setupNavigationAndMenus();

  setupStudentTable();

  setupModalWindows();
});

// if ("serviceWorker" in navigator) {
//   window.addEventListener("load", () => {
//     navigator.serviceWorker
//       .register("/sw.js")
//       .then((registration) => {
//         console.log("Service Worker registered successfully.", registration);

//         registration.addEventListener("updatefound", () => {
//           const newWorker = registration.installing;
//           newWorker.addEventListener("statechange", () => {
//             if (
//               newWorker.state === "installed" &&
//               navigator.serviceWorker.controller
//             ) {
//               if (confirm("Нова версія додатку доступна. Оновити зараз?")) {
//                 registration.waiting.postMessage({ action: "skipWaiting" });
//                 window.location.reload();
//               }
//             }
//           });
//         });
//       })
//       .catch((error) => {
//         console.error("Service Worker registration failed", error);
//       });

//     let refreshing = false;
//     navigator.serviceWorker.addEventListener("controllerchange", () => {
//       if (!refreshing) {
//         window.location.reload();
//         refreshing = true;
//       }
//     });
//   });
// }
