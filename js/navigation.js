function setupNavigationAndMenus() {
  const profile = document.querySelector(".profile");
  const profileMenu = document.querySelector(".profile-menu");

  if (profile && profileMenu) {
    const isTouchDevice = () => {
      return "ontouchstart" in window || navigator.maxTouchPoints > 0;
    };

    if (isTouchDevice()) {
      profile.addEventListener("click", (event) => {
        event.stopPropagation();
        profileMenu.style.display =
          profileMenu.style.display === "flex" ? "none" : "flex";
      });

      document.addEventListener("click", (event) => {
        if (
          !profile.contains(event.target) &&
          !profileMenu.contains(event.target)
        ) {
          profileMenu.style.display = "none";
        }
      });

      profileMenu.addEventListener("click", (event) => {
        event.stopPropagation();
      });
    } else {
      profile.addEventListener("mouseenter", () => {
        profileMenu.style.display = "flex";
      });

      profileMenu.addEventListener("mouseenter", () => {
        profileMenu.style.display = "flex";
      });

      profile.addEventListener("mouseleave", (event) => {
        if (
          !event.relatedTarget ||
          !profileMenu.contains(event.relatedTarget)
        ) {
          setTimeout(() => {
            if (!profileMenu.matches(":hover")) {
              profileMenu.style.display = "none";
            }
          }, 50);
        }
      });

      profileMenu.addEventListener("mouseleave", (event) => {
        if (!event.relatedTarget || !profile.contains(event.relatedTarget)) {
          profileMenu.style.display = "none";
        }
      });
    }
  }

  const toggleBtn = document.getElementById("toggle-btn");
  const sidebar = document.getElementById("sidebar");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("close");
      toggleBtn.classList.toggle("close");
    });
  }
}

export { setupNavigationAndMenus };
