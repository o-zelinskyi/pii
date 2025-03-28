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
    // Детектування тачскрін пристроїв
    const isTouchDevice = () => {
      return "ontouchstart" in window || navigator.maxTouchPoints > 0;
    };

    if (isTouchDevice()) {
      // Обробка для тачскрін пристроїв - використовуємо клік замість hover
      notification.addEventListener("click", (event) => {
        event.stopPropagation(); // Зупиняємо поширення події
        // Перемикаємо видимість
        notificationWindow.style.display =
          notificationWindow.style.display === "flex" ? "none" : "flex";

        // Приховуємо червону точку сповіщення
        document.querySelector(".notification")?.classList.add("hidden");
      });

      // Закриваємо при кліку поза елементом
      document.addEventListener("click", (event) => {
        if (
          !notification.contains(event.target) &&
          !notificationWindow.contains(event.target)
        ) {
          notificationWindow.style.display = "none";
        }
      });

      // Запобігаємо закриттю при кліку на вікно сповіщень
      notificationWindow.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    } else {
      // Оригінальна логіка для desktops (mouseenter/mouseleave)
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

export { setupNotifications };
