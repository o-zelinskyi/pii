/**
 * Global Notification System
 * Provides toast-style notifications for the application
 */

// Global notification function
window.showNotification = function (message, type = "info", duration = 4000) {
  // Create notification container if it doesn't exist
  let container = document.getElementById("notification-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "notification-container";
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  // Create notification element
  const notification = document.createElement("div");
  notification.className = `notification-toast notification-${type}`;

  // Icon based on type
  const icons = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  };

  notification.innerHTML = `
    <div class="notification-icon">${icons[type] || icons.info}</div>
    <div class="notification-message">${message}</div>
    <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
  `;

  // Add to container
  container.appendChild(notification);

  // Animate in
  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  // Auto remove after duration
  setTimeout(() => {
    if (notification.parentElement) {
      notification.classList.remove("show");
      setTimeout(() => {
        if (notification.parentElement) {
          notification.remove();
        }
      }, 300);
    }
  }, duration);

  return notification;
};

// Initialize notification styles
function initNotificationStyles() {
  // Check if styles already exist
  if (document.getElementById("notification-styles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "notification-styles";
  style.textContent = `
    .notification-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      pointer-events: none;
    }

    .notification-toast {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      margin-bottom: 8px;
      border-radius: 8px;
      background: white;
      border-left: 4px solid #007bff;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      min-width: 300px;
      max-width: 500px;
      opacity: 0;
      transform: translateX(100%);
      transition: all 0.3s ease;
      pointer-events: auto;
    }

    .notification-toast.show {
      opacity: 1;
      transform: translateX(0);
    }

    .notification-toast.notification-success {
      border-left-color: #28a745;
      background: #d4edda;
      color: #155724;
    }

    .notification-toast.notification-error {
      border-left-color: #dc3545;
      background: #f8d7da;
      color: #721c24;
    }

    .notification-toast.notification-warning {
      border-left-color: #ffc107;
      background: #fff3cd;
      color: #856404;
    }

    .notification-toast.notification-info {
      border-left-color: #007bff;
      background: #d1ecf1;
      color: #0c5460;
    }

    .notification-icon {
      font-size: 18px;
      font-weight: bold;
      flex-shrink: 0;
    }

    .notification-message {
      flex: 1;
      font-size: 14px;
      line-height: 1.4;
    }

    .notification-close {
      background: none;
      border: none;
      font-size: 18px;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: background 0.2s ease;
      flex-shrink: 0;
    }

    .notification-close:hover {
      background: rgba(0, 0, 0, 0.1);
    }
  `;

  document.head.appendChild(style);
}

// Initialize when DOM is loaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initNotificationStyles);
} else {
  initNotificationStyles();
}
