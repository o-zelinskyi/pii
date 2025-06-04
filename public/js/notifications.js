function setupNotifications() {
  document.addEventListener("DOMContentLoaded", function () {
    // Set up notification bell icon
    const notificationBell = document.querySelector(".notification-bell");
    const notificationWindow = document.querySelector(".notification-window");

    if (notificationBell && notificationWindow) {
      const isTouchDevice = () => {
        return "ontouchstart" in window || navigator.maxTouchPoints > 0;
      };

      if (isTouchDevice()) {
        // Touch device behavior
        notificationBell.addEventListener("click", (event) => {
          event.stopPropagation();
          if (
            notificationWindow.style.display === "block" ||
            notificationWindow.style.display === "flex"
          ) {
            notificationWindow.style.display = "none";
          } else {
            notificationWindow.style.display = "block";
          }
        });

        document.addEventListener("click", (event) => {
          if (
            !notificationBell.contains(event.target) &&
            !notificationWindow.contains(event.target)
          ) {
            notificationWindow.style.display = "none";
          }
        });

        notificationWindow.addEventListener("click", (event) => {
          event.stopPropagation();
        });
      } else {
        // Mouse device behavior
        notificationBell.addEventListener("click", (event) => {
          event.stopPropagation();
          if (
            notificationWindow.style.display === "block" ||
            notificationWindow.style.display === "flex"
          ) {
            notificationWindow.style.display = "none";
          } else {
            notificationWindow.style.display = "block";
          }
        });

        document.addEventListener("click", (event) => {
          if (
            !notificationBell.contains(event.target) &&
            !notificationWindow.contains(event.target)
          ) {
            notificationWindow.style.display = "none";
          }
        });
      }
    }

    // Set up mark all as read functionality
    const markAllReadButton = document.querySelector(".mark-all-read");
    if (markAllReadButton) {
      markAllReadButton.addEventListener("click", markAllAsRead);
    }
  });
}

// Mark all notifications as read
function markAllAsRead() {
  // Clear all notifications
  const notificationContent = document.getElementById("notification-content");
  if (notificationContent) {
    // Remove all notification items
    const notificationItems =
      notificationContent.querySelectorAll(".notification-item");
    notificationItems.forEach((item) => item.remove());

    // Show no notifications message
    let noNotificationsMsg = document.getElementById("no-notifications");
    if (!noNotificationsMsg) {
      noNotificationsMsg = document.createElement("div");
      noNotificationsMsg.id = "no-notifications";
      noNotificationsMsg.className = "no-notifications";
      noNotificationsMsg.innerHTML = "<p>No new messages</p>";
      notificationContent.appendChild(noNotificationsMsg);
    }
    noNotificationsMsg.style.display = "block";

    // Update notification count
    if (
      window.chatWS &&
      typeof window.chatWS.updateNotificationCount === "function"
    ) {
      window.chatWS.updateNotificationCount();
    } else {
      const notificationCount = document.querySelector(".notification-count");
      if (notificationCount) {
        notificationCount.style.display = "none";
      }
    }
  }
}

// Expose functions to global scope for use in inline scripts
window.setupNotifications = setupNotifications;
window.markAllAsRead = markAllAsRead;
