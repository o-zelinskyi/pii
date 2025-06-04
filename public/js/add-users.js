// Add Users to Group Chat Manager
class AddUsersManager {
  constructor(chatId = null) {
    this.selectedUsers = new Set();
    this.currentChatId = chatId;
    this.currentChatName = "";
    this.users = new Map();
    this.existingParticipants = new Set();
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    // Modal open/close events
    const closeBtn = document.getElementById("closeAddUsersModal");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeModal());
    }

    // Search functionality
    const searchInput = document.getElementById("addUsersSearch");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        this.searchUsers(e.target.value);
      });
    }

    // Confirm button
    const confirmBtn = document.getElementById("confirmAddUsersBtn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this.addSelectedUsers());
    }

    // Click outside to close
    const modal = document.getElementById("addUsersModal");
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeModal();
        }
      });
    }
  }
  async openModal(chatId = null, chatName = null, existingParticipants = []) {
    // Use provided chatId or fallback to constructor chatId
    this.currentChatId = chatId || this.currentChatId;

    if (!this.currentChatId) {
      console.error("AddUsersManager: No chat ID provided");
      return;
    }

    console.log("AddUsersManager: Opening modal for chat:", {
      chatId: this.currentChatId,
      chatName,
      existingParticipants,
    });

    // Get chat name from the active chat if not provided
    if (chatName) {
      this.currentChatName = chatName;
    } else {
      // Try to get chat name from the current active chat
      const activeChatItem = document.querySelector(".chat-item.active");
      if (activeChatItem) {
        const chatNameElement = activeChatItem.querySelector(".chat-name");
        this.currentChatName = chatNameElement
          ? chatNameElement.textContent
          : "Group Chat";
      } else {
        this.currentChatName = "Group Chat";
      }
    }

    this.existingParticipants = new Set(
      existingParticipants.map((p) => parseInt(p.user_id))
    );

    // Update modal title
    const titleElement = document.getElementById("addUsersModalChatName");
    if (titleElement) {
      titleElement.textContent = this.currentChatName;
    }

    // Show modal
    const modal = document.getElementById("addUsersModal");
    if (modal) {
      modal.style.display = "block";
    }

    // Load available users
    await this.loadAvailableUsers();
  }

  closeModal() {
    const modal = document.getElementById("addUsersModal");
    if (modal) {
      modal.style.display = "none";
    }

    // Reset state
    this.selectedUsers.clear();
    this.currentChatId = null;
    this.currentChatName = "";
    this.existingParticipants.clear();
    this.updateConfirmButton();
  }

  async loadAvailableUsers() {
    try {
      const container = document.getElementById("addUsersListContainer");
      if (!container) return;

      // Show loading
      container.innerHTML = `
        <div class="loading-users">
          <div class="spinner"></div>
          <p>Loading users...</p>
        </div>
      `;

      // Get users from global students data or fetch from API
      let users = [];
      if (window.students && Array.isArray(window.students)) {
        users = window.students;
      } else {
        // Fallback: fetch from API
        const response = await fetch(`${window.urlRoot}/api/students.php`);
        const data = await response.json();
        users = data.students || [];
      }

      // Filter out existing participants and current user
      const currentUserId = window.currentUser
        ? parseInt(window.currentUser.user_id)
        : null;
      const availableUsers = users.filter((user) => {
        const userId = parseInt(user.id);
        return (
          userId !== currentUserId && !this.existingParticipants.has(userId)
        );
      });

      // Store users in map for easy access
      this.users.clear();
      availableUsers.forEach((user) => {
        this.users.set(parseInt(user.id), user);
      });

      this.renderUsers(availableUsers);
    } catch (error) {
      console.error("Error loading available users:", error);
      const container = document.getElementById("addUsersListContainer");
      if (container) {
        container.innerHTML =
          '<p class="error">Failed to load users. Please try again.</p>';
      }
    }
  }

  renderUsers(users) {
    const container = document.getElementById("addUsersListContainer");
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML =
        '<p class="no-users">No users available to add.</p>';
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
      <div class="user-item" data-user-id="${user.id}">
        <div class="user-info">
          <img src="/github/public/img/avatar.webp" alt="${user.firstname} ${
          user.lastname
        }" class="user-avatar">
          <div class="user-details">
            <span class="user-name">${user.firstname} ${user.lastname}</span>
            <span class="user-email">${user.email}</span>
            ${
              user.studygroup
                ? `<span class="user-group">${user.studygroup}</span>`
                : ""
            }
          </div>
        </div>
        <input type="checkbox" name="addUser" value="${user.id}" 
               onchange="window.addUsersManager.toggleUserSelection(${
                 user.id
               }, this.checked)">
      </div>
    `
      )
      .join("");
  }

  searchUsers(query) {
    if (!query.trim()) {
      // Show all available users
      this.renderUsers(Array.from(this.users.values()));
      return;
    }

    const filtered = Array.from(this.users.values()).filter((user) => {
      const fullName = `${user.firstname} ${user.lastname}`.toLowerCase();
      const email = user.email.toLowerCase();
      const searchTerm = query.toLowerCase();

      return fullName.includes(searchTerm) || email.includes(searchTerm);
    });

    this.renderUsers(filtered);
  }

  toggleUserSelection(userId, selected) {
    const normalizedUserId = parseInt(userId);

    if (selected) {
      this.selectedUsers.add(normalizedUserId);
    } else {
      this.selectedUsers.delete(normalizedUserId);
    }

    this.updateConfirmButton();
  }

  updateConfirmButton() {
    const btn = document.getElementById("confirmAddUsersBtn");
    if (btn) {
      btn.disabled = this.selectedUsers.size === 0;

      if (this.selectedUsers.size > 0) {
        btn.textContent = `Add ${this.selectedUsers.size} User${
          this.selectedUsers.size > 1 ? "s" : ""
        }`;
      } else {
        btn.textContent = "Add Selected Users";
      }
    }
  }
  async addSelectedUsers() {
    if (this.selectedUsers.size === 0 || !this.currentChatId) {
      return;
    }

    try {
      console.log(
        `Adding ${this.selectedUsers.size} users to chat ${this.currentChatId}`
      );

      // Show loading state
      const confirmBtn = document.getElementById("confirmAddUsersBtn");
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.textContent = "Adding users...";
      }

      // Add each selected user to the chat
      const addPromises = Array.from(this.selectedUsers).map((userId) => {
        return new Promise((resolve, reject) => {
          if (
            window.chatWS &&
            window.chatWS.socket &&
            window.chatWS.socket.connected &&
            typeof window.chatWS.addUserToChat === "function"
          ) {
            console.log(`Adding user ${userId} to chat ${this.currentChatId}`);

            // Create a temporary listener for this specific add operation
            const successHandler = (data) => {
              if (
                data.chatId === this.currentChatId &&
                data.userId === userId
              ) {
                window.chatWS.socket.off("userAddedToChat", successHandler);
                window.chatWS.socket.off("error", errorHandler);
                resolve(data);
              }
            };

            const errorHandler = (error) => {
              window.chatWS.socket.off("userAddedToChat", successHandler);
              window.chatWS.socket.off("error", errorHandler);
              reject(new Error(error.message || "Failed to add user"));
            };

            // Set up temporary listeners
            window.chatWS.socket.on("userAddedToChat", successHandler);
            window.chatWS.socket.on("error", errorHandler);

            // Send the add user request
            window.chatWS.addUserToChat(this.currentChatId, userId);

            // Set a timeout to prevent hanging
            setTimeout(() => {
              window.chatWS.socket.off("userAddedToChat", successHandler);
              window.chatWS.socket.off("error", errorHandler);
              reject(new Error("Timeout adding user"));
            }, 5000);
          } else {
            reject(new Error("WebSocket not available or not connected"));
          }
        });
      });

      // Wait for all users to be added
      await Promise.all(addPromises);

      // Show success message
      if (typeof showNotification === "function") {
        showNotification(
          `${this.selectedUsers.size} user(s) added to the chat`,
          "success"
        );
      } // Refresh the chat list to show updated participant count
      if (
        window.chatWS &&
        typeof window.chatWS.refreshUserChats === "function"
      ) {
        window.chatWS.refreshUserChats();
      }

      // Close modal
      this.closeModal();
    } catch (error) {
      console.error("Error adding users to chat:", error);

      // Reset button state
      const confirmBtn = document.getElementById("confirmAddUsersBtn");
      if (confirmBtn) {
        confirmBtn.disabled = false;
        this.updateConfirmButton(); // Reset button text
      }

      if (typeof showNotification === "function") {
        showNotification(
          "Failed to add users to chat: " + error.message,
          "error"
        );
      }
    }
  }

  getCurrentUserId() {
    return window.currentUser ? parseInt(window.currentUser.user_id) : null;
  }
}

// Initialize the add users manager
window.addUsersManager = new AddUsersManager();
