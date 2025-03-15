document.addEventListener("DOMContentLoaded", () => {
  setupNotifications();

  setupNavigationAndMenus();

  setupStudentTable();

  setupModalWindows();
});

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
      if (!event.relatedTarget || !notification.contains(event.relatedTarget)) {
        notificationWindow.style.display = "none";
      }
    });
  }
}

function setupNavigationAndMenus() {
  const profile = document.querySelector(".profile");
  const profileMenu = document.querySelector(".profile-menu");

  if (profile && profileMenu) {
    profile.addEventListener("mouseenter", () => {
      profileMenu.style.display = "flex";
    });

    profileMenu.addEventListener("mouseenter", () => {
      profileMenu.style.display = "flex";
    });

    profile.addEventListener("mouseleave", (event) => {
      if (!event.relatedTarget || !profileMenu.contains(event.relatedTarget)) {
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

  const toggleBtn = document.getElementById("toggle-btn");
  const sidebar = document.getElementById("sidebar");

  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener("click", () => {
      sidebar.classList.toggle("close");
      toggleBtn.classList.toggle("close");
    });
  }
}

function setupStudentTable() {
  const mainCheckbox = document.getElementById("main-checkbox");
  const table = document.getElementById("student-table");
  let selectedStudents = [];

  if (!table || !mainCheckbox) return;

  initializeCheckboxes();

  // disable all buttons at start
  updateButtonsState();

  const birthdayDatePicker = document.getElementById("birthday");
  if (birthdayDatePicker) {
    birthdayDatePicker.max = new Date().toISOString().split("T")[0];
  }

  function initializeCheckboxes() {
    mainCheckbox.addEventListener("click", () => {
      const childCheckboxes = document.querySelectorAll(".checkbox");

      childCheckboxes.forEach((checkbox) => {
        checkbox.checked = mainCheckbox.checked;
      });

      updateButtonsState();
      updateSelectedStudents();
    });

    setupChildCheckboxListeners();
  }

  function setupChildCheckboxListeners(checkboxes = null) {
    const childCheckboxes =
      checkboxes || document.querySelectorAll(".checkbox");

    childCheckboxes.forEach((checkbox) => {
      checkbox.removeEventListener("click", checkboxClickHandler);
      checkbox.addEventListener("click", checkboxClickHandler);
    });
  }

  function checkboxClickHandler(event) {
    event.stopPropagation();

    const childCheckboxes = document.querySelectorAll(".checkbox");
    const allChecked = Array.from(childCheckboxes).every((cb) => cb.checked);
    mainCheckbox.checked = allChecked;

    updateButtonsState();
    updateSelectedStudents();
  }

  function updateButtonsState() {
    const childCheckboxes = document.querySelectorAll(".checkbox");
    const checkedCount = Array.from(childCheckboxes).filter(
      (cb) => cb.checked
    ).length;
    const totalCheckboxes = childCheckboxes.length;
    const allSelected = checkedCount === totalCheckboxes && totalCheckboxes > 0;

    Array.from(childCheckboxes).forEach((checkbox) => {
      const row = checkbox.closest("tr");
      if (!row) return;

      const editBtn = row.querySelector(".edit");
      const deleteBtn = row.querySelector(".delete");

      if (checkbox.checked) {
        if (deleteBtn) {
          deleteBtn.removeAttribute("disabled");
          const deleteSvg = deleteBtn.querySelector("svg");
          if (deleteSvg) deleteSvg.setAttribute("fill", "#e3e3e3");
        }

        if (editBtn) {
          if (allSelected || checkedCount > 1) {
            editBtn.setAttribute("disabled", "disabled");
            const editSvg = editBtn.querySelector("svg");
            if (editSvg) editSvg.setAttribute("fill", "#bebebe");
          } else {
            editBtn.removeAttribute("disabled");
            const editSvg = editBtn.querySelector("svg");
            if (editSvg) editSvg.setAttribute("fill", "#e3e3e3");
          }
        }
      } else {
        if (editBtn) {
          editBtn.setAttribute("disabled", "disabled");
          const editSvg = editBtn.querySelector("svg");
          if (editSvg) editSvg.setAttribute("fill", "#bebebe");
        }

        if (deleteBtn) {
          deleteBtn.setAttribute("disabled", "disabled");
          const deleteSvg = deleteBtn.querySelector("svg");
          if (deleteSvg) deleteSvg.setAttribute("fill", "#bebebe");
        }
      }
    });

    setupButtonListeners();
  }

  function updateSelectedStudents() {
    const childCheckboxes = document.querySelectorAll(".checkbox");
    selectedStudents = [];

    childCheckboxes.forEach((checkbox) => {
      if (checkbox.checked) {
        const row = checkbox.closest("tr");
        if (row) {
          const studentNameCell =
            row.querySelector('[data-cell="name"]') || row.cells[2]; // Fallback to 3rd cell if data-cell attribute not set
          selectedStudents.push(studentNameCell.textContent);
        }
      }
    });
  }

  function setupButtonListeners() {
    const deleteButtons = document.querySelectorAll(".table-button.delete");
    deleteButtons.forEach((btn) => {
      btn.removeEventListener("click", showDeleteModal);
      btn.addEventListener("click", showDeleteModal);
    });

    const editButtons = document.querySelectorAll(".table-button.edit");
    editButtons.forEach((btn) => {
      btn.removeEventListener("click", showEditModal);
      btn.addEventListener("click", showEditModal);
    });
  }

  function showDeleteModal() {
    if (this.hasAttribute("disabled")) return;

    const delWindow = document.querySelector(".modal-delete-window");
    if (!delWindow) return;

    document.body.classList.add("modal-open");
    delWindow.style.display = "flex";

    const modalSure = document.getElementById("modal-sure");
    const list = document.getElementById("list-of-users-to-del");
    const childCheckboxes = document.querySelectorAll(".checkbox");

    if (modalSure && list) {
      if (
        mainCheckbox.checked ||
        selectedStudents.length === childCheckboxes.length
      ) {
        modalSure.textContent =
          "Are you sure you want to delete this students?";
        list.textContent = "";
      } else {
        modalSure.innerHTML = `Are you sure you want to delete ${selectedStudents.length} selected student(s)?`;
        list.innerHTML = selectedStudents.join(", ");
      }
    }
  }

  function showEditModal() {
    if (this.hasAttribute("disabled")) return;

    const addEditWindow = document.querySelector(".modal-add-edit-window");
    if (!addEditWindow) return;

    const head = addEditWindow.querySelector(".modal-h2");
    if (head) head.textContent = "Edit student";

    document.body.classList.add("modal-open");
    addEditWindow.style.display = "flex";
  }

  // expose these functions to be used in modal window setup
  window.studentTableFunctions = {
    updateButtonsState,
    updateSelectedStudents,
    setupChildCheckboxListeners,
    selectedStudents,
  };
}

function setupModalWindows() {
  const delWindow = document.querySelector(".modal-delete-window");
  const addEditWindow = document.querySelector(".modal-add-edit-window");

  if (!delWindow || !addEditWindow) return;

  const addNewBtn = document.getElementById("new-student");
  if (addNewBtn) {
    addNewBtn.addEventListener("click", () => {
      const head = addEditWindow.querySelector(".modal-h2");
      if (head) head.textContent = "Add student";
      addEditWindow.style.display = "flex";

      document.body.classList.add("modal-open");
    });
  }

  const confirmDelBtn = delWindow.querySelector(".modal-delete");
  if (confirmDelBtn) {
    confirmDelBtn.addEventListener("click", () => {
      const studentTable = document.getElementById("student-table");
      if (!studentTable) return;

      const tableBody = studentTable.querySelector("tbody");
      const checkboxes = tableBody.querySelectorAll(".checkbox");

      Array.from(checkboxes).forEach((checkbox) => {
        if (checkbox.checked) {
          const row = checkbox.closest("tr");
          if (row) tableBody.removeChild(row);
        }
      });

      const mainCheckbox = document.getElementById("main-checkbox");
      if (mainCheckbox) mainCheckbox.checked = false;

      if (window.studentTableFunctions) {
        window.studentTableFunctions.updateButtonsState();
        window.studentTableFunctions.updateSelectedStudents();
      }

      document.body.classList.remove("modal-open");
      delWindow.style.display = "none";
    });
  }

  const createBtn = addEditWindow.querySelector(".modal-create");
  if (createBtn) {
    createBtn.addEventListener("click", () => {
      const group = document.getElementById("group")?.value || "";
      const firstName = document.getElementById("first-name")?.value || "";
      const lastName = document.getElementById("last-name")?.value || "";
      const gender = document.getElementById("gender")?.value || "";
      const birthday = document.getElementById("birthday")?.value || "";

      if (firstName === "" || lastName === "" || birthday === "") {
        alert("Please fill in all required fields");
        return;
      }

      const table = document.getElementById("student-table");
      if (!table) return;

      const tbody = table.querySelector("tbody") || table;
      const row = tbody.insertRow();

      const cell0 = row.insertCell(0);
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.className = "checkbox";
      cell0.appendChild(checkbox);

      const cell1 = row.insertCell(1);
      const cell2 = row.insertCell(2);
      cell2.setAttribute("data-cell", "name");
      const cell3 = row.insertCell(3);
      const cell4 = row.insertCell(4);
      const cell5 = row.insertCell(5);
      const cell6 = row.insertCell(6);

      cell1.textContent = group;
      cell2.textContent = `${firstName} ${lastName}`;
      cell3.textContent = gender;
      cell4.textContent = birthday;

      // status indicator
      cell5.innerHTML = `<svg class="status-indicator" width="20" height="20" viewBox="0 0 10 10">
        <circle class="status-circle" cx="5" cy="5" r="4" fill="#F44336" />
      </svg>`;

      // edit + delete buttons
      cell6.innerHTML = `
        <button disabled class="table-button edit">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#bebebe">
            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
          </svg>
        </button>
        <button disabled class="table-button delete">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#bebebe">
            <path d="M640-520v-80h240v80H640Zm-280 40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 0 130 15.5T616-378q29 15 46.5 43.5T680-272v112H40Zm80-80h480v-32q0-11-5.5-20T580-306q-54-27-109-40.5T360-360q-56 0-111 13.5T140-306q-9 5-14.5 14t-5.5 20v32Zm240-320q33 0 56.5-23.5T440-640q0-33-23.5-56.5T360-720q-33 0-56.5 23.5T280-640q0 33 23.5 56.5T360-560Zm0-80Zm0 400Z" />
          </svg>
        </button>`;

      if (window.studentTableFunctions) {
        window.studentTableFunctions.setupChildCheckboxListeners([checkbox]);
        window.studentTableFunctions.updateButtonsState();
      }

      resetForm();
      document.body.classList.remove("modal-open");
      addEditWindow.style.display = "none";
    });
  }

  const closeButtons = document.querySelectorAll(".modal-close, .modal-cancel");
  closeButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      delWindow.style.display = "none";
      addEditWindow.style.display = "none";
      document.body.classList.remove("modal-open");
      resetForm();
    });
  });

  function resetForm() {
    const form = addEditWindow.querySelector("form");
    if (form) form.reset();
  }
}
