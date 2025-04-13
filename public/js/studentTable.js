import { Student } from "./models.js";

function setupStudentTable() {
  const mainCheckbox = document.getElementById("main-checkbox");
  const table = document.getElementById("student-table");
  let selectedStudents = [];

  if (!table || !mainCheckbox) return;

  initializeCheckboxes();

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
          const groupCell =
            row.querySelector('[data-cell="group"]') || row.cells[1];
          const studentNameCell =
            row.querySelector('[data-cell="name"]') || row.cells[2];
          const [firstName, lastName] = studentNameCell.textContent.split(" ");
          const genderCell =
            row.querySelector('[data-cell="gender"]') || row.cells[3];
          const birthdayCell =
            row.querySelector('[data-cell="birthday"]') || row.cells[4];
          const statusCell =
            row.querySelector('td[data-cell="status"] p') || row.cells[5];

          let newStudent = new Student(
            groupCell.textContent,
            firstName,
            lastName,
            genderCell.textContent,
            birthdayCell.textContent,
            statusCell.textContent.trim()
          );

          selectedStudents.push(newStudent);
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
        list.innerHTML = selectedStudents.name.join(", ");
      }
    }
  }

  function showEditModal() {
    if (this.hasAttribute("disabled")) return;

    const addEditWindow = document.querySelector(".modal-add-edit-window");
    if (!addEditWindow) return;

    const head = addEditWindow.querySelector(".modal-h2");
    if (head) head.textContent = "Edit student";

    const groupField = document.getElementById("group");
    if (groupField) groupField.value = selectedStudents[0].group;

    const firstNameField = document.getElementById("first-name");
    if (firstNameField) firstNameField.value = selectedStudents[0].firstName;

    const lastNameField = document.getElementById("last-name");
    if (lastNameField) lastNameField.value = selectedStudents[0].lastName;

    const gender = document.getElementById("gender");
    if (gender) gender.value = selectedStudents[0].gender;

    const birthday = document.getElementById("birthday");
    if (birthday) birthday.value = selectedStudents[0].birthday;

    const editBtn = document.querySelector("#submit");
    if (editBtn) editBtn.value = "Edit";

    document.body.classList.add("modal-open");
    addEditWindow.style.display = "flex";
  }

  window.studentTableFunctions = {
    updateButtonsState,
    updateSelectedStudents,
    setupChildCheckboxListeners,
    selectedStudents,
  };
}

export { setupStudentTable };
