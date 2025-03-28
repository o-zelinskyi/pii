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
