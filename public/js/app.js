import { Student } from "./models.js";
import { setupNavigationAndMenus } from "./navigation.js";
import { setupStudentTable } from "./studentTable.js";
import { setupModalWindows } from "./modals.js";

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 App.js DOMContentLoaded fired");

  // Use globally available setupNotifications function
  console.log(
    "📋 Checking for setupNotifications function:",
    typeof window.setupNotifications
  );
  if (window.setupNotifications) {
    console.log("🔔 Calling setupNotifications...");
    setupNotifications();
  } else {
    console.error("❌ setupNotifications function not found on window object");
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
