function setupNotifications() {
  const initNotifications = () => {
    console.log("Initializing notifications...");

    // Set up notification bell icon
    const notificationBell = document.querySelector(".notification-bell");
    const notificationWindow = document.querySelector(".notification-window");

    console.log("Notification bell:", notificationBell);
    console.log("Notification window:", notificationWindow);
    if (notificationBell && notificationWindow) {
      console.log("✅ Both notification elements found successfully!");
      console.log("Bell element:", notificationBell);
      console.log("Window element:", notificationWindow);
      console.log("Window initial classes:", notificationWindow.className);
      console.log(
        "Window initial display:",
        getComputedStyle(notificationWindow).display
      );

      const isTouchDevice = () => {
        return "ontouchstart" in window || navigator.maxTouchPoints > 0;
      };

      let hoverTimeout;
      let isWindowOpen = false;
      const showNotificationWindow = () => {
        console.log("🔔 Showing notification window");
        clearTimeout(hoverTimeout);

        // Force display and add show class
        notificationWindow.style.display = "flex";
        notificationWindow.classList.add("show");
        isWindowOpen = true;

        console.log("Window classes:", notificationWindow.className);
        console.log("Window display style:", notificationWindow.style.display);
      };

      const hideNotificationWindow = () => {
        console.log("🔕 Hiding notification window");
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          notificationWindow.classList.remove("show");

          // Hide after transition
          setTimeout(() => {
            if (!notificationWindow.classList.contains("show")) {
              notificationWindow.style.display = "none";
            }
          }, 300); // Wait for CSS transition to complete

          isWindowOpen = false;
          console.log(
            "Window classes after hide:",
            notificationWindow.className
          );
        }, 200);
      };

      console.log("Is touch device:", isTouchDevice());

      if (isTouchDevice()) {
        console.log("📱 Setting up touch device events");
        // Touch device behavior
        notificationBell.addEventListener("click", (event) => {
          console.log("Touch device click event");
          event.stopPropagation();
          if (isWindowOpen) {
            hideNotificationWindow();
          } else {
            showNotificationWindow();
          }
        });

        document.addEventListener("click", (event) => {
          if (
            !notificationBell.contains(event.target) &&
            !notificationWindow.contains(event.target)
          ) {
            hideNotificationWindow();
          }
        });

        notificationWindow.addEventListener("click", (event) => {
          event.stopPropagation();
        });
      } else {
        console.log("🖱️ Setting up mouse hover events");

        // Mouse device behavior with hover
        notificationBell.addEventListener("mouseenter", () => {
          console.log("🖱️ Mouse entered notification bell");
          showNotificationWindow();
        });

        notificationBell.addEventListener("mouseleave", () => {
          console.log("🖱️ Mouse left notification bell");
          hideNotificationWindow();
        });

        notificationWindow.addEventListener("mouseenter", () => {
          console.log("🖱️ Mouse entered notification window");
          clearTimeout(hoverTimeout);
        });

        notificationWindow.addEventListener("mouseleave", () => {
          console.log("🖱️ Mouse left notification window");
          hideNotificationWindow();
        });

        // Also support click for mouse devices
        notificationBell.addEventListener("click", (event) => {
          console.log("🖱️ Mouse device click event");
          event.stopPropagation();
          if (isWindowOpen) {
            hideNotificationWindow();
          } else {
            showNotificationWindow();
          }
        });

        document.addEventListener("click", (event) => {
          if (
            !notificationBell.contains(event.target) &&
            !notificationWindow.contains(event.target)
          ) {
            hideNotificationWindow();
          }
        });
      }
      // Test the show/hide functionality immediately
      console.log("🧪 Testing notification window functionality...");
      console.log("🧪 Testing show manually in 2 seconds...");
      setTimeout(() => {
        console.log("🧪 Manual test - showing window");
        notificationWindow.classList.add("show");
        console.log(
          "🧪 Window classes after manual show:",
          notificationWindow.className
        );
        setTimeout(() => {
          console.log("🧪 Manual test - hiding window");
          notificationWindow.classList.remove("show");
          console.log(
            "🧪 Window classes after manual hide:",
            notificationWindow.className
          );
        }, 3000);
      }, 2000);
    } else {
      console.error("❌ Notification elements not found!");
      console.log("Available elements with notification classes:");
      document.querySelectorAll('[class*="notification"]').forEach((el) => {
        console.log("- ", el.className, el);
      });
    }

    // Set up mark all as read functionality
    const markAllReadButton = document.querySelector(".mark-all-read");
    if (markAllReadButton) {
      markAllReadButton.addEventListener("click", markAllAsRead);
    }
  };

  // Initialize immediately if DOM is already loaded, otherwise wait for DOMContentLoaded
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initNotifications);
  } else {
    initNotifications();
  }
}

// Mark all notifications as read
function markAllAsRead() {
  console.log("Mark all as read clicked");

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
