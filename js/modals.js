function setupModalWindows() {
  const delWindow = document.querySelector(".modal-delete-window");
  const addEditWindow = document.querySelector(".modal-add-edit-window");
  const form = document.querySelector(".add-edit-student-form");

  if (!delWindow || !addEditWindow || !form) return;

  const addNewBtn = document.getElementById("new-student");
  if (addNewBtn) {
    addNewBtn.addEventListener("click", () => {
      const head = addEditWindow.querySelector(".modal-h2");
      if (head) head.textContent = "Add student";
      const createBtn = addEditWindow.querySelector("#submit");
      if (createBtn) createBtn.value = "Create";
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

  const submitBtn = addEditWindow.querySelector("#submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const groupSelect = document.getElementById("group");
      const firstNameInput = document.getElementById("first-name");
      const lastNameInput = document.getElementById("last-name");
      const genderSelect = document.getElementById("gender");
      const birthdayInput = document.getElementById("birthday");
      const submitBtn = document.getElementById("submit");

      const validationRules = {
        group: {
          pattern: /^PZ-\d+$/,
          message: "Please select a valid group",
          required: true,
        },
        firstName: {
          pattern: /^[A-Za-z]{2,}$/,
          message:
            "First name must contain at least 2 letters and only alphabetic characters",
          required: true,
        },
        lastName: {
          pattern: /^[A-Za-z]{2,}$/,
          message:
            "Last name must contain at least 2 letters and only alphabetic characters",
          required: true,
        },
        gender: {
          pattern: /^(Male|Female|Other)$/,
          message: "Please select a gender",
          required: true,
        },
        birthday: {
          validate: function (value) {
            if (!value) return false;
            const date = new Date(value);
            const today = new Date();
            const minDate = new Date("1910-01-01");
            return date <= today && date >= minDate;
          },
          message:
            "Please enter a valid birth date (between 1910-01-01 and today)",
          required: true,
        },
      };

      groupSelect.addEventListener("change", () =>
        validateField(groupSelect, validationRules.group)
      );
      firstNameInput.addEventListener("input", () =>
        validateField(firstNameInput, validationRules.firstName)
      );
      lastNameInput.addEventListener("input", () =>
        validateField(lastNameInput, validationRules.lastName)
      );
      genderSelect.addEventListener("change", () =>
        validateField(genderSelect, validationRules.gender)
      );
      birthdayInput.addEventListener("change", () =>
        validateField(birthdayInput, validationRules.birthday)
      );

      form.addEventListener("submit", function (e) {
        e.preventDefault();

        let isValid = true;

        isValid = validateField(groupSelect, validationRules.group) && isValid;
        isValid =
          validateField(firstNameInput, validationRules.firstName) && isValid;
        isValid =
          validateField(lastNameInput, validationRules.lastName) && isValid;
        isValid =
          validateField(genderSelect, validationRules.gender) && isValid;
        isValid =
          validateField(birthdayInput, validationRules.birthday) && isValid;

        if (isValid) {
          if (submitBtn.value === "Edit") {
            updateStudent();
          } else {
            addNewStudent();
          }

          const addEditWindow = document.querySelector(
            ".modal-add-edit-window"
          );
          if (addEditWindow) {
            addEditWindow.style.display = "none";
            document.body.classList.remove("modal-open");
          }
          resetForm();
        }
      });

      function validateField(field, rules) {
        const errorElement = field.nextElementSibling;
        const value = field.value.trim();
        let isValid = true;

        if (rules.required && value === "") {
          isValid = false;
          showError(field, errorElement, "This field is required");
          return isValid;
        }

        if (value === "" && !rules.required) {
          clearError(field, errorElement);
          return true;
        }

        if (rules.pattern && !rules.pattern.test(value)) {
          isValid = false;
          showError(field, errorElement, rules.message);
        } else if (rules.validate && !rules.validate(value)) {
          isValid = false;
          showError(field, errorElement, rules.message);
        } else {
          clearError(field, errorElement);
        }

        return isValid;
      }

      function showError(field, errorElement, message) {
        field.classList.add("invalid");
        if (errorElement && errorElement.classList.contains("error-message")) {
          errorElement.textContent = message;
        }
      }

      function clearError(field, errorElement) {
        field.classList.remove("invalid");
        if (errorElement && errorElement.classList.contains("error-message")) {
          errorElement.textContent = "";
        }
      }
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

  function addNewStudent() {
    const table = document.getElementById("student-table");
    if (!table) return;

    const tbody = table.querySelector("tbody") || table;
    const row = tbody.insertRow();

    const cell0 = row.insertCell(0);
    cell0.setAttribute("data-cell", "check");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "checkbox";
    checkbox.setAttribute("aria-label", "check");
    cell0.appendChild(checkbox);

    const cell1 = row.insertCell(1);
    cell1.setAttribute("data-cell", "group");
    const cell2 = row.insertCell(2);
    cell2.setAttribute("data-cell", "name");
    const cell3 = row.insertCell(3);
    cell3.setAttribute("data-cell", "gender");
    const cell4 = row.insertCell(4);
    cell4.setAttribute("data-cell", "birthday");
    const cell5 = row.insertCell(5);
    cell5.setAttribute("data-cell", "status");
    const cell6 = row.insertCell(6);
    cell6.setAttribute("data-cell", "options");

    cell1.textContent = groupSelect ? groupSelect.value : "";
    cell2.textContent = `${firstNameInput ? firstNameInput.value : ""} ${
      lastNameInput ? lastNameInput.value : ""
    }`;
    cell3.textContent = genderSelect ? genderSelect.value : "";
    cell4.textContent = birthdayInput ? birthdayInput.value : "";

    // status indicator
    cell5.innerHTML = `<svg class="status-indicator" width="20" height="20" viewBox="0 0 10 10">
        <circle class="status-circle" cx="5" cy="5" r="4" fill="#F44336" />
      </svg>`;

    // edit + delete buttons
    cell6.innerHTML = `
        <button disabled class="table-button edit" aria-label="Edit">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#bebebe">
            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 [...]
          </svg>
        </button>
        <button disabled class="table-button delete" aria-label="Delete">
          <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#bebebe">
            <path d="M640-520v-80h240v80H640Zm-280 40q-66 0-113-47t-47-113q0-66 47-113t113-47q66 0 113 47t47 113q0 66-47 113t-113 47ZM40-160v-112q0-34 17.5-62.5T104-378q62-31 126-46.5T360-440q66 [...]
          </svg>
        </button>`;

    console.log(
      JSON.stringify({
        group: groupSelect.value,
        firstName: firstNameInput.value,
        lastName: lastNameInput.value,
        gender: genderSelect.value,
        birthday: birthdayInput.value,
      })
    );

    if (window.studentTableFunctions) {
      window.studentTableFunctions.setupChildCheckboxListeners([checkbox]);
    }
  }

  function updateStudent() {
    const table = document.getElementById("student-table");
    if (!table) return;

    const groupSelect = document.getElementById("group");
    const firstNameInput = document.getElementById("first-name");
    const lastNameInput = document.getElementById("last-name");
    const genderSelect = document.getElementById("gender");
    const birthdayInput = document.getElementById("birthday");
    const submitBtn = document.getElementById("submit");

    const selectedCheckbox = document.querySelector(".checkbox:checked");
    if (selectedCheckbox) {
      const row = selectedCheckbox.closest("tr");
      if (row) {
        const groupCell =
          row.querySelector('[data-cell="group"]') || row.cells[1];
        const nameCell =
          row.querySelector('[data-cell="name"]') || row.cells[2];
        const genderCell =
          row.querySelector('[data-cell="gender"]') || row.cells[3];
        const birthdayCell =
          row.querySelector('[data-cell="birthday"]') || row.cells[4];

        groupCell.textContent = groupSelect ? groupSelect.value : "";
        nameCell.textContent = `${firstNameInput ? firstNameInput.value : ""} ${
          lastNameInput ? lastNameInput.value : ""
        }`;
        genderCell.textContent = genderSelect ? genderSelect.value : "";
        birthdayCell.textContent = birthdayInput ? birthdayInput.value : "";

        console.log(
          JSON.stringify({
            group: groupSelect.value,
            firstName: firstNameInput.value,
            lastName: lastNameInput.value,
            gender: genderSelect.value,
            birthday: birthdayInput.value,
          })
        );

        if (
          window.studentTableFunctions &&
          window.studentTableFunctions.updateSelectedStudents
        ) {
          window.studentTableFunctions.updateSelectedStudents();
        }
      }
    }
  }
}

export { setupModalWindows };
