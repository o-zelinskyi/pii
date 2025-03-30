import { Student } from "./models.js";
import { setupNotifications } from "./notifications.js";
import { setupNavigationAndMenus } from "./navigation.js";
import { setupStudentTable } from "./studentTable.js";
import { setupModalWindows } from "./modals.js";

document.addEventListener("DOMContentLoaded", () => {
  setupNotifications();

  setupNavigationAndMenus();

  setupStudentTable();

  setupModalWindows();
});

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/js/sw.js")
    .then((register) =>
      console.log("Service Worker registered successfully.", register)
    )
    .catch((error) =>
      console.error("Service Worker registration failed", error)
    );
}
