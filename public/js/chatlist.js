class ChatList {
  constructor() {
    this.chats = new Map();
    this.unreadCounts = new Map();
    this.users = new Map();
    this.selectedUsers = new Set();
    this.initializeEventListeners();
  }

  updateChatList(chatId, lastMessage = null) {
    const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
    if (chatElement && lastMessage) {
      // Update last message
      const lastMessageEl = chatElement.querySelector(".last-message");
      if (lastMessageEl) {
        lastMessageEl.textContent =
          lastMessage.content.substring(0, 30) + "...";
      }

      // Update timestamp
      const timeEl = chatElement.querySelector(".chat-time");
      if (timeEl) {
        timeEl.textContent = this.formatTime(lastMessage.createdAt);
      }

      // Move to top of list
      const chatList = document.querySelector(".chat-list");
      chatList.insertBefore(chatElement, chatList.firstChild);
    }
  }

  updateUnreadCount(chatId, increment = true) {
    const currentCount = this.unreadCounts.get(chatId) || 0;
    const newCount = increment ? currentCount + 1 : 0;
    this.unreadCounts.set(chatId, newCount);

    const chatElement = document.querySelector(`[data-chat-id="${chatId}"]`);
    const badgeElement = chatElement?.querySelector(".unread-badge");

    if (newCount > 0) {
      if (!badgeElement) {
        const badge = document.createElement("span");
        badge.className = "unread-badge";
        badge.textContent = newCount;
        chatElement.appendChild(badge);
      } else {
        badgeElement.textContent = newCount;
      }
    } else if (badgeElement) {
      badgeElement.remove();
    }
  }

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    if (diff < 60000) return "Now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h";
    return date.toLocaleDateString();
  }

  // Initialize event listeners for chat creation
  initializeEventListeners() {
    // Create chat button
    const createChatBtn = document.getElementById("createChatBtn");
    if (createChatBtn) {
      createChatBtn.addEventListener("click", () => this.openCreateChatModal());
    }

    // User search functionality
    const userSearch = document.getElementById("userSearch");
    if (userSearch) {
      userSearch.addEventListener("input", (e) =>
        this.searchUsers(e.target.value)
      );
    }

    // Confirm create chat button
    const confirmBtn = document.getElementById("confirmCreateChatBtn");
    if (confirmBtn) {
      confirmBtn.addEventListener("click", () => this.createChat());
    }

    // Modal close functionality
    const modal = document.getElementById("createChatModal");
    const closeBtn = modal?.querySelector(".close-button");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.closeCreateChatModal());
    }

    // Close modal when clicking outside
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) {
          this.closeCreateChatModal();
        }
      });
    }
  }

  // Open create chat modal and load users
  async openCreateChatModal() {
    const modal = document.getElementById("createChatModal");
    if (modal) {
      modal.style.display = "block";
      await this.loadUsers();
    }
  }

  // Close create chat modal
  closeCreateChatModal() {
    const modal = document.getElementById("createChatModal");
    if (modal) {
      modal.style.display = "none";
      this.selectedUsers.clear();
      this.updateCreateChatButton();
    }
  }

  // Load users from MariaDB
  async loadUsers(search = "") {
    const container = document.getElementById("usersListContainer");
    if (!container) return;

    try {
      // Use the correct API endpoint: URLROOT is defined in config.php, adjust if necessary for JS context
      // Assuming URLROOT is accessible globally or passed to this class
      const urlRoot =
        document.body.dataset.urlroot || "http://localhost/newpiiwithmvc"; // Fallback if not set
      const currentUserId = this.getCurrentUserId();
      const response = await fetch(
        `${urlRoot}/api/user/list?search=${search}&exclude_id=${currentUserId}`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();

      if (data.success && data.users) {
        this.users.clear(); // Clear existing users map
        data.users.forEach((user) => this.users.set(user.id, user)); // Populate users map
        this.renderUsers(data.users); // Call renderUsers to display the users
      } else {
        container.innerHTML = "<p>No users found or error fetching users.</p>";
        console.error(
          "Error loading users:",
          data.message || "No users array in response"
        );
      }
    } catch (error) {
      console.error("Failed to load users:", error);
      container.innerHTML =
        "<p>Error loading users. Please try again later.</p>";
    }
  }

  // Render users in the modal
  renderUsers(users) {
    const container = document.getElementById("usersListContainer");
    if (!container) return;

    if (users.length === 0) {
      container.innerHTML = `
        <div class="no-users">
          <p>No users found</p>
        </div>
      `;
      return;
    }

    container.innerHTML = users
      .map(
        (user) => `
      <div class="user-item" data-user-id="${user.id}">
        <div class="user-avatar">
          <img src="${user.photo}" alt="${user.firstname} ${user.lastname}" 
               onerror="this.src='${
                 window.location.origin
               }/newPiiWithMvc/public/img/avatar.webp'">
          <span class="status-indicator ${
            user.isOnline ? "online" : "offline"
          }"></span>
        </div>
        <div class="user-info">
          <h4>${user.firstname} ${user.lastname}</h4>
          <span class="user-status">${user.status}</span>
          ${
            user.studygroup
              ? `<span class="user-group">${user.studygroup}</span>`
              : ""
          }
        </div>
        <input type="checkbox" name="user" value="${user.id}" 
               onchange="window.chatList.toggleUserSelection(${
                 user.id
               }, this.checked)">
      </div>
    `
      )
      .join("");
  }

  // Search users
  searchUsers(query) {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.loadUsers(query);
    }, 300);
  }

  // Toggle user selection
  toggleUserSelection(userId, selected) {
    if (selected) {
      this.selectedUsers.add(userId);
    } else {
      this.selectedUsers.delete(userId);
    }
    this.updateCreateChatButton();
  }

  // Update create chat button state
  updateCreateChatButton() {
    const btn = document.getElementById("confirmCreateChatBtn");
    if (btn) {
      btn.disabled = this.selectedUsers.size === 0;
      btn.textContent =
        this.selectedUsers.size > 1
          ? `Create Group (${this.selectedUsers.size})`
          : "Start Conversation";
    }
  }

  // Create chat with selected users
  async createChat() {
    if (this.selectedUsers.size === 0) return;

    try {
      const selectedUserIds = Array.from(this.selectedUsers);
      const selectedUserData = selectedUserIds.map((id) => this.users.get(id));

      // Send request to create chat
      const response = await fetch(
        `${window.location.origin}/newPiiWithMvc/chat-server/api/create-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            participants: selectedUserIds,
            chatType: selectedUserIds.length > 1 ? "group" : "direct",
            createdBy: this.getCurrentUserId(),
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        // Close modal
        this.closeCreateChatModal();

        // Redirect to new chat or refresh chat list
        if (result.chatId) {
          window.location.href = `${window.location.origin}/newPiiWithMvc/chats/view/${result.chatId}`;
        }
      } else {
        throw new Error(result.message || "Failed to create chat");
      }
    } catch (error) {
      console.error("Error creating chat:", error);
      alert("Failed to create chat. Please try again.");
    }
  }

  // Get current user ID from session or data attribute
  getCurrentUserId() {
    // Try to get from PHP session data if available
    const userDataElement = document.querySelector("[data-user-id]");
    if (userDataElement) {
      return parseInt(userDataElement.getAttribute("data-user-id"));
    }

    // Alternative: get from localStorage or other source
    const userId = localStorage.getItem("user_id");
    return userId ? parseInt(userId) : null;
  }

  // Sync user data with MongoDB when needed
  async syncUserData(action, userData) {
    try {
      const response = await fetch(
        `${window.location.origin}/newPiiWithMvc/public/api/users.php`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action: action,
            user: userData,
          }),
        }
      );

      const result = await response.json();
      return result.success;
    } catch (error) {
      console.error("Error syncing user data:", error);
      return false;
    }
  }
}

// Initialize ChatList when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  window.chatList = new ChatList();
});

// Export for use in other modules
if (typeof module !== "undefined" && module.exports) {
  module.exports = ChatList;
}
