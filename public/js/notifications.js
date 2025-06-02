function setupNotifications() {
  document.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      let notificationElement = document.querySelector(".notification");
      if (notificationElement) {
        notificationElement.classList.add("animate");
        setTimeout(() => {
          notificationElement.classList.remove("hidden");
        }, 3000);
      }
    }
  });

  const notification = document.querySelector(".notification-section");
  const notificationWindow = document.querySelector(".notification-window");

  if (notification && notificationWindow) {
    const isTouchDevice = () => {
      return "ontouchstart" in window || navigator.maxTouchPoints > 0;
    };

    if (isTouchDevice()) {
      notification.addEventListener("click", (event) => {
        event.stopPropagation();
        notificationWindow.style.display =
          notificationWindow.style.display === "flex" ? "none" : "flex";

        document.querySelector(".notification")?.classList.add("hidden");
      });

      document.addEventListener("click", (event) => {
        if (
          !notification.contains(event.target) &&
          !notificationWindow.contains(event.target)
        ) {
          notificationWindow.style.display = "none";
        }
      });

      notificationWindow.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    } else {
      notification.addEventListener("mouseenter", () => {
        notificationWindow.style.display = "flex";
        document.querySelector(".notification")?.classList.add("hidden");
      });

      notificationWindow.addEventListener("mouseenter", () => {
        notificationWindow.style.display = "flex";
      });

      notification.addEventListener("mouseleave", (event) => {
        if (
          !event.relatedTarget ||
          !notificationWindow.contains(event.relatedTarget)
        ) {
          setTimeout(() => {
            if (!notificationWindow.matches(":hover")) {
              notificationWindow.style.display = "none";
            }
          }, 50);
        }
      });

      notificationWindow.addEventListener("mouseleave", (event) => {
        if (
          !event.relatedTarget ||
          !notification.contains(event.relatedTarget)
        ) {
          notificationWindow.style.display = "none";
        }
      });
    }
  }
}

// Function to mark all notifications as read
function markAllAsRead() {
  console.log("Marking all notifications as read");

  // Clear all notification items from the notification window
  const notificationContent = document.getElementById("notification-content");
  if (notificationContent) {
    // Remove all message notifications
    const messageNotifications = notificationContent.querySelectorAll(
      ".message-notification"
    );
    messageNotifications.forEach((notification) => notification.remove());

    // Show "No new messages" placeholder
    const noNotificationsPlaceholder =
      notificationContent.querySelector(".no-notifications");
    if (noNotificationsPlaceholder) {
      noNotificationsPlaceholder.style.display = "block";
    } else {
      // Create placeholder if it doesn't exist
      const placeholder = document.createElement("div");
      placeholder.className = "no-notifications";
      placeholder.innerHTML = "<p>No new messages</p>";
      notificationContent.appendChild(placeholder);
    }
  }

  // Reset notification count to 0
  if (
    window.chatWS &&
    typeof window.chatWS.updateNotificationBell === "function"
  ) {
    window.chatWS.updateNotificationBell(0);
  } else {
    // Fallback to direct DOM manipulation
    const countElement = document.querySelector(".notification-count");
    if (countElement) {
      countElement.textContent = "0";
      countElement.style.display = "none";
    }
  }

  // Hide notification window after marking as read
  const notificationWindow = document.getElementById("notification-window");
  if (notificationWindow) {
    notificationWindow.style.display = "none";
  }

  // Optional: Send to server to mark as read on the backend
  if (window.chatWS && window.chatWS.socket && window.chatWS.socket.connected) {
    window.chatWS.socket.emit("markAllAsRead", {
      userId: window.currentUser ? window.currentUser.user_id : null,
    });
  }
}

// Make markAllAsRead globally available
window.markAllAsRead = markAllAsRead;

export { setupNotifications };
