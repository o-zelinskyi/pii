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

      form.reset();

      form.action = "/tables/add";
      form.method = "post";

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
      const checkboxes = tableBody.querySelectorAll(".checkbox:checked");

      if (checkboxes.length === 0) {
        console.log("No students selected for deletion");
        return;
      }

      const studentIds = [];

      Array.from(checkboxes).forEach((checkbox) => {
        const row = checkbox.closest("tr");
        if (row && row.hasAttribute("data-student-id")) {
          const studentId = row.getAttribute("data-student-id");
          studentIds.push(studentId);
        }
      });

      if (studentIds.length > 0) {
        console.log("Deleting student IDs:", studentIds);

        const formData = new FormData();

        studentIds.forEach((id) => {
          formData.append("ids[]", id);
        });

        fetch(URLROOT + "/tables/delete", {
          method: "POST",
          body: formData,
        })
          .then((response) => {
            return response.json();
          })
          .then((data) => {
            console.log("Delete response:", data);

            Array.from(checkboxes).forEach((checkbox) => {
              const row = checkbox.closest("tr");
              if (row) tableBody.removeChild(row);
            });

            const mainCheckbox = document.getElementById("main-checkbox");
            if (mainCheckbox) mainCheckbox.checked = false;

            if (window.studentTableFunctions) {
              window.studentTableFunctions.updateButtonsState();
              window.studentTableFunctions.updateSelectedStudents();
            }
          })
          .finally(() => {
            document.body.classList.remove("modal-open");
            delWindow.style.display = "none";
          });
      } else {
        console.error("No valid student IDs found for deletion");
        document.body.classList.remove("modal-open");
        delWindow.style.display = "none";
      }
    });
  }

  const submitBtn = addEditWindow.querySelector("#submit");
  if (submitBtn) {
    submitBtn.addEventListener("click", () => {
      const groupSelect = document.getElementById("studygroup");
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
          pattern: /^[A-Za-zА-ЯІЇЄҐа-яіїєґ'\-]{2,}$/,
          message:
            "First name must contain at least 2 characters (letters, apostrophes or hyphens)",
          required: true,
        },
        lastName: {
          pattern: /^[A-Za-zА-ЯІЇЄҐа-яіїєґ'\-]{2,}$/,
          message:
            "First name must contain at least 2 characters (letters, apostrophes or hyphens)",
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

        if (!isValid) {
          return;
        }

        if (isValid) {
          if (submitBtn.value === "Edit") {
            updateStudent();
            console.log("yes, I'm here too");
          } else {
            sendNewStudent();
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

      function sendNewStudent() {
        const formData = new FormData();
        formData.append("studygroup", groupSelect.value);
        formData.append("firstname", firstNameInput.value);
        formData.append("lastname", lastNameInput.value);
        formData.append("gender", genderSelect.value);
        formData.append("birthday", birthdayInput.value);
        formData.append(
          "email",
          firstNameInput.value + "." + lastNameInput.value + "@student.ua"
        );
        formData.append("password", lastNameInput.value);

        fetch(URLROOT + "/tables/add", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            window.location.reload();
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }

      function updateStudent() {
        const formData = new FormData();
        formData.append("studygroup", groupSelect.value);
        formData.append("firstname", firstNameInput.value);
        formData.append("lastname", lastNameInput.value);
        formData.append("gender", genderSelect.value);
        formData.append("birthday", birthdayInput.value);

        const selectedCheckbox = document.querySelector(".checkbox:checked");
        console.log(selectedCheckbox);
        if (selectedCheckbox) {
          const row = selectedCheckbox.closest("tr");
          console.log(row);
          if (row && row.hasAttribute("data-student-id")) {
            console.log(row.getAttribute("data-student-id"));
            formData.append("id", row.getAttribute("data-student-id"));
          }
        }

        console.log("yes, I'm here");

        fetch(URLROOT + "/tables/edit", {
          method: "POST",
          body: formData,
        })
          .then((response) => response.json())
          .then((data) => {
            window.location.reload();
          })
          .catch((error) => {
            console.error("Error:", error);
          });
      }

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
}

export { setupModalWindows };
