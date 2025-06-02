// Chat Application JavaScript
window.chatApp = window.chatApp || {}; // Ensure namespace exists globally at the top

document.addEventListener("DOMContentLoaded", function () {
  initializeChatApp();
});

// Add a stub for initializeChatApp to prevent ReferenceError
function initializeChatApp() {
  // Initialization logic can be added here if needed
  console.log("initializeChatApp called (stub).");
}

// Define the cleanupEditUI function first
window.chatApp.cleanupEditUI = function (
  showEditButton = true,
  nameToSetAndUpdate = null
) {
  const chatDetailsContainer = document.querySelector(".chat-details");
  if (!chatDetailsContainer) {
    console.error("cleanupEditUI: .chat-details container not found");
    return;
  }
  const headerNameH3 =
    chatDetailsContainer.querySelector("h3#chat-name") ||
    chatDetailsContainer.querySelector("h3") ||
    document.querySelector("#chat-name");
  const editChatNameBtn = document.getElementById("edit-chat-name-btn");

  console.log(
    "cleanupEditUI: chatDetailsContainer found:",
    chatDetailsContainer
  );
  console.log("cleanupEditUI: headerNameH3:", headerNameH3);
  console.log("cleanupEditUI: editChatNameBtn:", editChatNameBtn);

  // Directly query from document to find elements within .chat-details
  const inputField = document.querySelector(
    ".chat-details input.edit-chat-name-input"
  );
  const saveBtn = document.querySelector(
    ".chat-details button.save-chat-name-btn"
  );
  const cancelBtn = document.querySelector(
    ".chat-details button.cancel-chat-name-btn"
  );

  console.log(
    "cleanupEditUI: Elements to remove - input:",
    inputField,
    "save:",
    saveBtn,
    "cancel:",
    cancelBtn
  );

  if (inputField) inputField.remove();
  if (saveBtn) saveBtn.remove();
  if (cancelBtn) cancelBtn.remove();

  if (headerNameH3) {
    if (nameToSetAndUpdate) {
      let trimmedName = "";
      if (typeof nameToSetAndUpdate === "string") {
        trimmedName = nameToSetAndUpdate.trim();
      } else {
        trimmedName = String(nameToSetAndUpdate).trim();
      }

      if (trimmedName) {
        headerNameH3.textContent = trimmedName;
        console.log(
          `cleanupEditUI: Set headerNameH3.textContent to "${trimmedName}"`
        );
        if (editChatNameBtn) {
          editChatNameBtn.dataset.currentName = trimmedName;
        }
      } else {
        console.warn(
          `cleanupEditUI: Provided name "${nameToSetAndUpdate}" trims to empty. Retaining previous name: "${headerNameH3.textContent}"`
        );
      }
    }

    headerNameH3.style.display = "block"; // Explicitly set to 'block'

    console.log(
      `cleanupEditUI: Attempted to set headerNameH3 display to 'block'. Current textContent: "${
        headerNameH3.textContent
      }", Inline style: "${headerNameH3.style.display}", Computed style: "${
        window.getComputedStyle(headerNameH3).display
      }"`
    );
  } else {
    console.error(
      "cleanupEditUI: headerNameH3 not found, cannot update name or visibility."
    );
  }

  if (editChatNameBtn) {
    if (showEditButton) {
      editChatNameBtn.style.display = "inline-block";
    } else {
      editChatNameBtn.style.display = "none";
    }
  }
};

// Define the handleChatNameUpdatedInUI function
window.chatApp.handleChatNameUpdatedInUI = function (chatId, newName) {
  console.log(
    `chat.js: handleChatNameUpdatedInUI called for chatId=${chatId}, newName=${newName}`
  );

  // Update the chat list item
  const chatListItem = document.querySelector(
    `.chat-item[data-chat-id="${chatId}"]`
  );
  if (chatListItem) {
    const chatNameElement = chatListItem.querySelector(".chat-name");
    if (chatNameElement) {
      chatNameElement.textContent = newName;
    }
    chatListItem.dataset.dbName = newName; // Update the data-db-name attribute as well
    console.log(
      `chat.js: Updated chat list item for ${chatId} to name ${newName}`
    );
  } else {
    console.warn(
      `chat.js: Could not find chat list item for chatId=${chatId} to update name.`
    );
  }

  // Update the chat header if this is the currently active chat
  const activeChatItem = document.querySelector(".chat-item.active");
  if (activeChatItem && activeChatItem.dataset.chatId === chatId) {
    console.log(
      `chat.js: Active chat is ${chatId}, updating header directly with newName: \"${newName}\"`
    );
    const headerNameH3 = document.querySelector(".chat-details h3#chat-name");
    if (headerNameH3) {
      const nameToDisplay = newName ? newName.trim() : "Chat";
      headerNameH3.textContent = nameToDisplay || "Chat"; // Use newName from server, fallback to "Chat"
      headerNameH3.style.display = "block"; // Ensure header is visible
      console.log(
        `chat.js: Set active chat header to \"${headerNameH3.textContent}\" and display to 'block'`
      );

      const editBtn = document.getElementById("edit-chat-name-btn");
      if (editBtn) {
        // Update edit button's stored name too
        editBtn.dataset.currentName = nameToDisplay || "Chat";
      }
    }
  } else {
    console.log(
      `chat.js: Chat ${chatId} is not the active chat, header not updated by handleChatNameUpdatedInUI directly.`
    );
  }

  // If the edit UI was open for this chat, clean it up using the newName from server.
  const currentInputField = document.querySelector(
    ".chat-details input.edit-chat-name-input"
  );
  if (
    currentInputField &&
    activeChatItem &&
    activeChatItem.dataset.chatId === chatId
  ) {
    console.log(
      "handleChatNameUpdatedInUI: Edit UI was open for the updated active chat, calling cleanupEditUI."
    );
    window.chatApp.cleanupEditUI(true, newName); // Pass newName from server
  }
};

// Chat Header Status Update
window.chatApp.updateChatHeaderStatus = (userId, isOnline) => {
  const chatHeader = document.getElementById("chat-header");
  const currentChatId = window.chatWS?.currentChatId;

  if (!chatHeader || !currentChatId) return;

  const activeChatListItem = document.querySelector(
    `.chat-item.active[data-chat-id="${currentChatId}"]`
  );
  if (!activeChatListItem) return;

  const isGroupChat = activeChatListItem.dataset.isGroup === "true";

  if (!isGroupChat) {
    // For direct chats, the 'userId' is the other participant.
    // We need to get the other participant's ID from the chat data.
    // This logic assumes you have a way to get participants of the currentChatId
    const participants = window.chatList?.getChatParticipants(currentChatId);
    const otherParticipant = participants?.find(
      (p) => p.user_id !== window.currentUser?.user_id
    );

    if (otherParticipant && otherParticipant.user_id === userId) {
      const statusElement = chatHeader.querySelector("#chat-status");
      const onlineIndicator = chatHeader.querySelector("#online-indicator");

      if (statusElement && onlineIndicator) {
        if (isOnline) {
          statusElement.textContent = "Online";
          statusElement.style.color = "green";
          onlineIndicator.style.backgroundColor = "green";
        } else {
          const now = new Date();
          statusElement.textContent = `Last seen at ${now.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
          )} ${now.toLocaleDateString()}`;
          statusElement.style.color = "red";
          onlineIndicator.style.backgroundColor = "red";
        }
      }
    }
  } else {
    // For group chats, you might want to update a general status or list of online members
    // For now, we'll just log it.
    console.log(
      `User ${userId} status changed to ${
        isOnline ? "online" : "offline"
      } in group chat ${currentChatId}`
    );
    // Potentially update a list of online users in the group chat header if UI supports it.
  }
};

setupChatListEventListeners(); // Renamed for clarity
setupChatInput();
setupModals();
setupSearchFunctionality();
setupFilterTabs();
initializeEditChatName(); // Add this line

// Chat List Management using Event Delegation
function setupChatListEventListeners() {
  const chatListContainer = document.getElementById("chatListContainer");

  if (chatListContainer) {
    chatListContainer.addEventListener("click", function (event) {
      const chatItem = event.target.closest(".chat-item");
      if (chatItem) {
        // Remove active class from currently active item
        const currentlyActive =
          chatListContainer.querySelector(".chat-item.active");
        if (currentlyActive) {
          currentlyActive.classList.remove("active");
        }
        // Add active class to clicked item
        chatItem.classList.add("active");

        const chatId = chatItem.dataset.chatId;
        const chatName =
          chatItem.querySelector(".chat-name")?.textContent || "Chat";
        // Participants data might need to be fetched or stored on the element if needed by showChatInterface
        const participants = []; // Placeholder

        if (window.chatWS) {
          window.chatWS.currentChatId = chatId;
          window.chatWS.loadMessages(chatId);
        }

        updateChatHeader(chatItem); // Updates the main chat header

        if (typeof window.showChatInterface === "function") {
          window.showChatInterface(chatId, chatName, participants); // Shows the chat panel, clears messages
        } else {
          console.error("showChatInterface function is not defined.");
        }

        const noChatMessage = document.getElementById("noChatMessage");
        if (noChatMessage) {
          noChatMessage.style.display = "none";
        }
      }
    });
  }
}

// Update chat header when switching chats
function updateChatHeader(chatItem) {
  // Use dataset for the original DB name and isGroup status
  const dbChatNameRaw = chatItem.dataset.dbName;
  const isGroupChat = chatItem.dataset.isGroup === "true";
  const chatId = chatItem.dataset.chatId;

  const dbChatName = dbChatNameRaw ? dbChatNameRaw.trim() : "";
  const listItemChatNameRaw = chatItem.querySelector(".chat-name")?.textContent;
  const listItemChatName = listItemChatNameRaw
    ? listItemChatNameRaw.trim()
    : "";

  // chatNameToDisplay will be the dbChatName (trimmed) or listItemChatName (trimmed),
  // falling back to "Chat" if both are empty after trimming.
  const chatNameToDisplay = dbChatName || listItemChatName || "Chat";

  const avatarSrcFromListItem = chatItem.querySelector(".chat-avatar img")?.src;
  const hasOnlineIndicator = chatItem.querySelector(".online-indicator");

  const headerAvatar = document.querySelector(".chat-header .chat-avatar img");
  const headerNameH3 = document.querySelector(".chat-details h3#chat-name");
  const headerStatus = document.querySelector(".chat-details .status");
  const editChatNameBtn = document.getElementById("edit-chat-name-btn");

  if (headerAvatar && avatarSrcFromListItem) {
    headerAvatar.src = avatarSrcFromListItem;
  }

  if (headerNameH3) {
    headerNameH3.textContent = chatNameToDisplay; // Already incorporates trimming and "Chat" fallback
    headerNameH3.style.display = "block"; // Ensure header is visible when chat is switched
    // Store the actually displayed name (which might be "Chat") back to the edit button's dataset
    // if the edit button is for the currently active chat.
    const editBtn = document.getElementById("edit-chat-name-btn");
    if (editBtn && editBtn.dataset.chatId === chatId) {
      // This ensures that if "Chat" is displayed, cancelling an edit reverts to "Chat"
      // editBtn.dataset.currentName = chatNameToDisplay; // Revisit this if it causes issues with original name
    }
  }

  if (editChatNameBtn) {
    if (isGroupChat) {
      editChatNameBtn.style.display = "inline-block";
      editChatNameBtn.dataset.chatId = chatId;
      editChatNameBtn.dataset.currentName = chatNameToDisplay; // Store the potentially friendly name
    } else {
      editChatNameBtn.style.display = "none";
    }
  }

  if (headerStatus) {
    // TODO: Implement actual online status fetching for individual chats
    headerStatus.textContent = hasOnlineIndicator
      ? "Online • Last seen recently"
      : "Last seen recently";
  }
}

window.chatApp.updateChatHeaderStatus = (userId, isOnline) => {
  const chatHeader = document.getElementById("chat-header");
  const currentChatId = window.chatWS?.currentChatId;

  if (!chatHeader || !currentChatId) return;

  const activeChatListItem = document.querySelector(
    `.chat-item.active[data-chat-id="${currentChatId}"]`
  );
  if (!activeChatListItem) return;

  const isGroupChat = activeChatListItem.dataset.isGroup === "true";

  if (!isGroupChat) {
    // For direct chats, the 'userId' is the other participant.
    // We need to get the other participant's ID from the chat data.
    // This logic assumes you have a way to get participants of the currentChatId
    const participants = window.chatList?.getChatParticipants(currentChatId);
    const otherParticipant = participants?.find(
      (p) => p.user_id !== window.currentUser?.user_id
    );

    if (otherParticipant && otherParticipant.user_id === userId) {
      const statusElement = chatHeader.querySelector("#chat-status");
      const onlineIndicator = chatHeader.querySelector("#online-indicator");

      if (statusElement && onlineIndicator) {
        if (isOnline) {
          statusElement.textContent = "Online";
          statusElement.style.color = "green";
          onlineIndicator.style.backgroundColor = "green";
        } else {
          const now = new Date();
          statusElement.textContent = `Last seen at ${now.toLocaleTimeString(
            [],
            { hour: "2-digit", minute: "2-digit" }
          )} ${now.toLocaleDateString()}`;
          statusElement.style.color = "red";
          onlineIndicator.style.backgroundColor = "red";
        }
      }
    }
  } else {
    // For group chats, you might want to update a general status or list of online members
    // For now, we'll just log it.
    console.log(
      `User ${userId} status changed to ${
        isOnline ? "online" : "offline"
      } in group chat ${currentChatId}`
    );
    // Potentially update a list of online users in the group chat header if UI supports it.
  }
};

function initializeEditChatName() {
  const editChatNameBtn = document.getElementById("edit-chat-name-btn");
  const chatHeaderDetails = document.querySelector(".chat-details"); // Parent of h3 and button

  if (editChatNameBtn && chatHeaderDetails) {
    editChatNameBtn.addEventListener("click", function () {
      // 'this' is editChatNameBtn
      const chatId = this.dataset.chatId;
      const currentName = this.dataset.currentName;
      const headerNameH3 = chatHeaderDetails.querySelector("h3#chat-name");

      if (!headerNameH3) {
        console.error(
          "Edit button clicked, but h3#chat-name not found in .chat-details."
        );
        return;
      }

      // Prevent multiple edit UIs if clicked rapidly
      if (chatHeaderDetails.querySelector("input.edit-chat-name-input")) {
        console.warn(
          "Edit UI is already present. Aborting new edit UI creation."
        );
        return;
      }

      console.log(
        `Edit chat name button clicked for chat ID: ${chatId}, current name: "${currentName}"`
      );

      // Hide H3 and edit button
      headerNameH3.style.display = "none";
      this.style.display = "none";

      // Create input field
      const inputField = document.createElement("input");
      inputField.type = "text";
      inputField.value = currentName;
      inputField.className = "edit-chat-name-input"; // For styling and selection
      inputField.style.marginRight = "5px";

      // Create Save button
      const saveBtn = document.createElement("button");
      saveBtn.textContent = "Save";
      saveBtn.className = "save-chat-name-btn primary-btn"; // For styling and selection
      saveBtn.style.marginRight = "5px";

      // Create Cancel button
      const cancelBtn = document.createElement("button");
      cancelBtn.textContent = "Cancel";
      cancelBtn.className = "cancel-chat-name-btn secondary-btn"; // For styling and selection

      // Insert input and buttons after H3 (which is hidden)
      headerNameH3.parentNode.insertBefore(
        inputField,
        headerNameH3.nextSibling
      );
      inputField.parentNode.insertBefore(saveBtn, inputField.nextSibling);
      saveBtn.parentNode.insertBefore(cancelBtn, saveBtn.nextSibling);

      inputField.focus();
      saveBtn.addEventListener("click", () => {
        const newName = inputField.value.trim();
        console.log(
          `Save button clicked. Chat ID: ${chatId}, New name: "${newName}", Current name: "${currentName}"`
        );

        // Validate the new name
        if (!newName) {
          console.log("New name is empty. Staying in edit mode.");
          // Show validation error but keep edit mode active
          if (typeof showNotification === "function") {
            showNotification("Chat name cannot be empty", "error");
          }
          inputField.focus();
          return;
        }

        if (newName === currentName) {
          console.log("Name not changed. Closing edit mode.");
          window.chatApp.cleanupEditUI(true, currentName);
          return;
        }

        // Name is valid and changed, proceed with update
        if (
          window.chatWS &&
          typeof window.chatWS.updateChatName === "function"
        ) {
          console.log(
            `Calling window.chatWS.updateChatName("${chatId}", "${newName}")`
          );

          // Immediately update the UI to show the new name (optimistic update)
          window.chatApp.cleanupEditUI(true, newName);

          // Send the update to server
          window.chatWS.updateChatName(chatId, newName);

          // Note: If the server update fails, the WebSocket error handler should revert the name
        } else {
          console.error(
            "window.chatWS.updateChatName function is not available. Reverting UI."
          );
          // Fallback: revert to original name
          window.chatApp.cleanupEditUI(true, currentName);
          if (typeof showNotification === "function") {
            showNotification(
              "Unable to update chat name. Not connected to server.",
              "error"
            );
          }
        }
      });

      cancelBtn.addEventListener("click", () => {
        console.log("Cancel button clicked. Reverting UI.");
        window.chatApp.cleanupEditUI(true, currentName); // Revert to current name, show edit button
      });
    });
  } else {
    if (!editChatNameBtn)
      console.error(
        "initializeEditChatName: #edit-chat-name-btn not found at init."
      );
    if (!chatHeaderDetails)
      console.error("initializeEditChatName: .chat-details not found at init.");
  }
}

// Chat Input Management
function setupChatInput() {
  const messageInput = document.getElementById("message-input");
  const sendBtn = document.getElementById("send-btn");
  const chatMessages = document.getElementById("chat-messages");

  if (!messageInput || !sendBtn || !chatMessages) return;

  // Auto-resize textarea
  messageInput.addEventListener("input", function () {
    this.style.height = "auto";
    this.style.height = Math.min(this.scrollHeight, 120) + "px";

    // Update send button state
    updateSendButtonState();
  });

  // Send message on Enter key (but allow Shift+Enter for new lines)
  messageInput.addEventListener("keypress", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });

  // Send message on button click
  sendBtn.addEventListener("click", sendMessage);

  // Send message on Enter key (but allow Shift+Enter for new lines)
  messageInput.addEventListener("click", sendMessage);

  // File attachment
  const attachBtn = document.querySelector(".input-action-btn");
  if (attachBtn) {
    attachBtn.addEventListener("click", function () {
      // Create hidden file input
      const fileInput = document.createElement("input");
      fileInput.type = "file";
      fileInput.multiple = true;
      fileInput.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx";

      fileInput.onchange = function () {
        handleFileUpload(this.files);
      };

      fileInput.click();
    });
  }

  function updateSendButtonState() {
    const hasText = messageInput.value.trim().length > 0;
    sendBtn.style.opacity = hasText ? "1" : "0.5";
    sendBtn.style.transform = hasText ? "scale(1)" : "scale(0.9)";
  }

  function sendMessage() {
    const message = messageInput.value.trim();
    if (message) {
      // Call the global addMessage function
      if (typeof window.addMessage === "function") {
        // Parameters: text, isSelf, timestamp, senderName, avatarUrl
        window.addMessage(message, true, null, null, null);
      } else {
        console.error("window.addMessage is not defined. Cannot send message.");
      }
      messageInput.value = "";
      messageInput.style.height = "auto";
      updateSendButtonState();

      // Simulate typing indicator
      showTypingIndicator();

      // Simulate response after delay
      setTimeout(() => {
        hideTypingIndicator();
        simulateResponse(message);
      }, 1000 + Math.random() * 2000);
    }
  }
}

// Add message to chat - moved to global scope and assigned to window
window.addMessage = function (
  text,
  isSelf = false,
  timestamp = null,
  senderName = null,
  avatarUrl = null
) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) {
    console.error("addMessage: chat-messages container not found.");
    return;
  }

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isSelf ? "sent" : "received"}`;

  const avatarHtml = avatarUrl
    ? `<div class="message-avatar"><img src="${escapeHtml(
        avatarUrl
      )}" alt="Avatar"></div>`
    : '<div class="message-avatar"><img src="/img/avatar.webp" alt="Avatar"></div>'; // Default avatar

  const senderNameHtml =
    !isSelf && senderName
      ? `<div class="message-sender-name">${escapeHtml(senderName)}</div>`
      : "";

  // Format timestamp
  let currentTime = "";
  if (timestamp) {
    const date = new Date(timestamp);
    currentTime = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } else {
    // Fallback if timestamp is null
    const now = new Date();
    currentTime = now.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  messageDiv.innerHTML =
    avatarHtml +
    '<div class="message-content">' +
    senderNameHtml +
    '<div class="message-bubble">' +
    "<p>" +
    escapeHtml(text) +
    "</p>" +
    "</div>" +
    '<div class="message-info">' +
    `<span class="message-time">${currentTime}</span>` +
    (isSelf ? '<span class="message-status">✓</span>' : "") +
    "</div>" +
    "</div>";

  chatMessages.appendChild(messageDiv);

  if (typeof window.scrollToBottom === "function") {
    window.scrollToBottom();
  } else {
    console.warn(
      "window.scrollToBottom function not found after appending message."
    );
  }

  // Animate message appearance
  messageDiv.style.opacity = "0";
  messageDiv.style.transform = "translateY(20px)";

  requestAnimationFrame(function () {
    messageDiv.style.transition = "all 0.3s ease";
    messageDiv.style.opacity = "1";
    messageDiv.style.transform = "translateY(0)";
  });
};

// Ensure scrollToBottom is available globally by assigning to window
window.scrollToBottom = function () {
  const chatMessages = document.getElementById("chat-messages");
  if (chatMessages) {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
};

// Helper function to escape HTML - ensure it's globally accessible if needed by addMessage
window.escapeHtml = function (text) {
  if (typeof text !== "string") {
    if (text === null || typeof text === "undefined") {
      return ""; // Return empty string for null or undefined
    }
    text = String(text); // Convert to string if it's another type (e.g., number)
  }
  var map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, function (m) {
    return map[m];
  });
};

// Modal Management
function setupModals() {
  const modal = document.getElementById("createChatModal");
  const createBtn = document.getElementById("createChatBtn");

  if (!modal || !createBtn) {
    console.error(
      "Create chat modal or button not found. Modal functionality will be limited."
    );
    return;
  }

  const closeBtn = modal.querySelector(".close-button");
  const confirmBtn = document.getElementById("confirmCreateChatBtn");
  const userSearchInput = modal.querySelector("#userSearch"); // Assuming #userSearch is inside the modal
  const userListContainer = modal.querySelector(".users-list"); // Corrected selector
  const chatNameInput = modal.querySelector("#chatName"); // Assuming #chatName is inside the modal

  if (!closeBtn || !confirmBtn || !userListContainer) {
    console.error(
      "Essential modal components (close, confirm, user list) are missing."
    );
    return;
  }

  createBtn.addEventListener("click", () => {
    loadUsersAndShowModal();
  });

  closeBtn.addEventListener("click", closeModal);

  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") {
      closeModal();
    }
  });

  function closeModal() {
    if (modal) modal.style.display = "none";
    if (typeof window.resetModalForm === "function") window.resetModalForm();
  }

  window.resetModalForm = function () {
    if (userSearchInput) userSearchInput.value = "";
    if (chatNameInput) chatNameInput.value = "";
    if (userListContainer) {
      userListContainer.innerHTML = "";
      const checkboxes = userListContainer.querySelectorAll(
        'input[type="checkbox"]'
      );
      if (checkboxes)
        checkboxes.forEach((checkbox) => (checkbox.checked = false));
      const selectedItems = userListContainer.querySelectorAll(
        ".user-item.selected"
      );
      if (selectedItems)
        selectedItems.forEach((item) => item.classList.remove("selected"));
    }
    // Assuming filterUsers is globally available or passed appropriately
    if (typeof filterUsersInModal === "function") {
      filterUsersInModal("");
    }
  };

  async function loadUsersAndShowModal() {
    console.log("loadUsersAndShowModal called");
    if (!userListContainer) {
      console.error(
        "User list container not found in modal. Cannot load users."
      );
      if (typeof showNotification === "function")
        showNotification("Error: Could not initialize user list.", "error");
      return;
    }
    userListContainer.innerHTML = "<p>Loading users...</p>";
    console.log("Set userListContainer to 'Loading users...'");
    if (modal) modal.style.display = "block";

    try {
      console.log(
        `Fetching users from: ${window.urlRoot}/public/api/users.php`
      );
      const response = await fetch(`${window.urlRoot}/public/api/users.php`);
      console.log("Fetch response received:", response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `HTTP error! status: ${response.status}, body: ${errorText}`
        );
        throw new Error(
          `HTTP error! status: ${
            response.status
          }. Server said: ${errorText.substring(0, 100)}`
        );
      }

      const contentType = response.headers.get("content-type");
      console.log("Response contentType:", contentType);
      if (!contentType || !contentType.includes("application/json")) {
        const textResponse = await response.text();
        console.error(
          "Non-JSON response from users API. ContentType:",
          contentType,
          "Body:",
          textResponse
        );
        throw new Error(
          `Received non-JSON response from server. Expected JSON but got ${contentType}. Check API endpoint: ${window.urlRoot}/public/api/users.php`
        );
      }

      const result = await response.json();
      console.log("Parsed JSON result from API:", result);
      let users = [];

      if (result && Array.isArray(result.data)) {
        users = result.data;
      } else if (result && Array.isArray(result.users)) {
        users = result.users;
      } else if (Array.isArray(result)) {
        users = result;
      } else {
        console.warn(
          "Users data is not in expected array format or is empty:",
          result
        );
        // Keep users as empty array, populateModalUserList will handle it
      }
      console.log("Processed users before filtering current user:", users);

      if (window.currentUser && window.currentUser.user_id) {
        users = users.filter(
          (user) => String(user.id) !== String(window.currentUser.user_id)
        );
        console.log("Users after filtering current user:", users);
      } else {
        console.warn(
          "Current user not found or missing ID; not filtering users list against current user."
        );
      }

      window.students = users;
      console.log("Calling populateModalUserList with users:", users);
      populateModalUserList(users);
      console.log("Calling setupModalUserSelectionHandlers");
      setupModalUserSelectionHandlers();
    } catch (error) {
      console.error("Failed to load users due to an error:", error);
      if (userListContainer) {
        userListContainer.innerHTML = `<p>Error loading users: ${error.message}. Please check console and try again.</p>`;
      }
      if (typeof showNotification === "function")
        showNotification(`Error loading users: ${error.message}`, "error");
    }
  }

  function populateModalUserList(users) {
    if (!userListContainer) return;
    userListContainer.innerHTML = "";

    if (!users || users.length === 0) {
      userListContainer.innerHTML =
        "<p>No users available to create a chat with.</p>";
      return;
    }

    users.forEach((user) => {
      if (
        !user ||
        typeof user.id === "undefined" ||
        typeof user.firstname === "undefined"
      ) {
        console.warn("Skipping user with missing id or firstname:", user);
        return;
      }

      const userItem = document.createElement("div");
      userItem.classList.add("user-item");
      userItem.dataset.userId = user.id;

      const avatarImg = document.createElement("img");
      avatarImg.src = user.avatar || `${window.urlRoot}/img/avatar.webp`;
      avatarImg.alt = user.firstname;
      avatarImg.classList.add("avatar");
      avatarImg.onerror = function () {
        this.src = `${window.urlRoot}/img/avatar.webp`;
      };

      const userName = document.createElement("h4");
      userName.textContent = `${user.firstname} ${user.lastname || ""}`;

      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = user.id;
      checkbox.classList.add("user-select-checkbox");
      checkbox.id = `user-checkbox-${user.id}`;

      const label = document.createElement("label");
      label.htmlFor = checkbox.id;
      label.classList.add("user-item-label");
      label.appendChild(avatarImg);
      label.appendChild(userName);

      userItem.appendChild(checkbox);
      userItem.appendChild(label);

      userListContainer.appendChild(userItem);
    });
  }

  function setupModalUserSelectionHandlers() {
    if (!userListContainer) return;
    const userItems = userListContainer.querySelectorAll(".user-item");
    const confirmBtn = document.getElementById("confirmCreateChatBtn"); // Ensure confirmBtn is accessible

    userItems.forEach((item) => {
      const checkbox = item.querySelector(".user-select-checkbox");
      if (checkbox) {
        checkbox.addEventListener("change", function () {
          item.classList.toggle("selected", this.checked);
          if (confirmBtn) {
            // Check if confirmBtn exists
            const selectedCheckboxes = userListContainer.querySelectorAll(
              ".user-select-checkbox:checked"
            );
            confirmBtn.disabled = selectedCheckboxes.length === 0;
          }
        });
      }
    });

    // Initial state of the button
    if (confirmBtn) {
      const selectedCheckboxes = userListContainer.querySelectorAll(
        ".user-select-checkbox:checked"
      );
      confirmBtn.disabled = selectedCheckboxes.length === 0;
    }
  }

  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (!userListContainer) return;
      const selectedCheckboxes = userListContainer.querySelectorAll(
        ".user-select-checkbox:checked"
      );
      const selectedUserIds = Array.from(selectedCheckboxes).map(
        (cb) => cb.value
      );

      let chatNameValue = "";
      if (chatNameInput && chatNameInput.value.trim() !== "") {
        chatNameValue = chatNameInput.value.trim();
      }

      if (selectedUserIds.length === 0) {
        if (typeof showNotification === "function")
          showNotification("Please select at least one user.", "warning");
        return;
      }

      if (typeof createNewChatWithWebSocket === "function") {
        createNewChatWithWebSocket(selectedUserIds, chatNameValue);
      } else {
        console.error("createNewChatWithWebSocket function is not defined.");
        if (typeof showNotification === "function")
          showNotification("Error: Chat creation function not found.", "error");
      }
    });
  } else {
    console.error("Confirm button not found in modal.");
  }

  if (userSearchInput) {
    userSearchInput.addEventListener("input", (e) => {
      if (typeof filterUsersInModal === "function") {
        filterUsersInModal(e.target.value.toLowerCase());
      } else {
        console.warn(
          "filterUsersInModal function is not available for user search input."
        );
      }
    });
  } else {
    console.warn("User search input not found in modal.");
  }

  // Renamed to avoid conflict if there's another filterUsers globally
  function filterUsersInModal(searchTerm) {
    console.log(`filterUsersInModal called with searchTerm: '${searchTerm}'`);
    if (!userListContainer) {
      console.warn("filterUsersInModal: userListContainer not found.");
      return;
    }
    const userItems = userListContainer.querySelectorAll(".user-item");
    console.log(`filterUsersInModal: Found ${userItems.length} user items.`);

    if (userItems.length === 0 && searchTerm === "") {
      // If called with empty search term (e.g. on reset) and list is empty, do nothing.
    } else if (userItems.length === 0) {
      console.warn("filterUsersInModal: No user items to filter.");
    }

    userItems.forEach((item, index) => {
      const userNameElement = item.querySelector("h4");
      if (userNameElement) {
        const userName = userNameElement.textContent.toLowerCase();
        if (userName.includes(searchTerm)) {
          item.style.display = "";
        } else {
          item.style.display = "none";
        }
      } else {
        console.warn(
          `filterUsersInModal: User item at index ${index} is missing h4 element.`
        );
      }
    });
  }
}

// Search Functionality (for main chat list)
function setupSearchFunctionality() {
  const searchInput = document.getElementById("searchInput"); // Changed "chatSearchInput" to "searchInput"
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      if (typeof filterChats === "function") {
        filterChats(e.target.value.toLowerCase());
      } else {
        console.warn(
          "filterChats function is not available for main chat search."
        );
      }
    });
  } else {
    console.warn("Chat search input not found for main search functionality.");
  }
}

function filterChats(searchTerm, chatListContainerSelector = ".chat-list ul") {
  const chatListContainer = document.querySelector(chatListContainerSelector);
  if (!chatListContainer) {
    console.error(
      `Chat list container not found with selector: ${chatListContainerSelector}`
    );
    return;
  }
  const chatItems = chatListContainer.querySelectorAll(".chat-item");
  let visibleChats = 0;

  chatItems.forEach((item) => {
    const chatNameElement = item.querySelector(".chat-name");
    const lastMessageElement = item.querySelector(
      ".last-message p, .last-message span"
    );

    let match = false;
    if (
      chatNameElement &&
      chatNameElement.textContent.toLowerCase().includes(searchTerm)
    ) {
      match = true;
    }
    if (
      lastMessageElement &&
      lastMessageElement.textContent &&
      lastMessageElement.textContent.toLowerCase().includes(searchTerm)
    ) {
      match = true;
    }

    if (match) {
      item.style.display = "";
      visibleChats++;
    } else {
      item.style.display = "none";
    }
  });

  const noResultsMessageContainer = chatListContainer.parentNode;
  if (!noResultsMessageContainer) return;
  let noResultsMessage = noResultsMessageContainer.querySelector(
    ".no-chat-search-results"
  );
  if (visibleChats === 0 && searchTerm.length > 0) {
    if (!noResultsMessage) {
      noResultsMessage = document.createElement("p");
      noResultsMessage.className = "no-chat-search-results";
      noResultsMessage.textContent = "No chats match your search.";
      if (chatListContainer.nextSibling) {
        chatListContainer.parentNode.insertBefore(
          noResultsMessage,
          chatListContainer.nextSibling
        );
      } else {
        chatListContainer.parentNode.appendChild(noResultsMessage);
      }
    }
    noResultsMessage.style.display = "block";
  } else if (noResultsMessage) {
    noResultsMessage.style.display = "none";
  }
}

// Filter Tabs
function setupFilterTabs() {
  const filterTabs = document.querySelectorAll(".filter-tab");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      // Remove active class from all tabs
      filterTabs.forEach((t) => t.classList.remove("active"));
      // Add active class to clicked tab
      this.classList.add("active");

      // Apply filter
      const filter = this.dataset.filter;
      applyFilter(filter);
    });
  });

  function applyFilter(filter) {
    const chatItems = document.querySelectorAll(
      "#chatListContainer .chat-item"
    );
    let visibleChats = 0;

    chatItems.forEach((item) => {
      let isVisible = false;

      switch (filter) {
        case "all":
          isVisible = true;
          break;
        case "unread":
          const unreadBadge = item.querySelector(".unread-badge");
          isVisible = unreadBadge && parseInt(unreadBadge.textContent) > 0;
          break;
        case "groups":
          isVisible = item.dataset.isGroup === "true";
          break;
        default:
          isVisible = true;
          break;
      }

      item.style.display = isVisible ? "" : "none";
      if (isVisible) {
        visibleChats++;
      }
    });

    const chatListContainer = document.getElementById("chatListContainer");
    const noChatMessage = document.getElementById("noChatMessage"); // General no chats message
    let noFilterResultsMessage =
      chatListContainer.querySelector(".no-filter-results");

    // Hide general no chats message if filters are active or search is active
    if (noChatMessage) {
      const searchInput = document.getElementById("searchInput");
      const isActiveFilter = filter !== "all";
      const isActiveSearch = searchInput && searchInput.value.trim().length > 0;
      if (isActiveFilter || isActiveSearch) {
        noChatMessage.style.display = "none";
      }
    }

    if (visibleChats === 0 && filter !== "all") {
      if (!noFilterResultsMessage) {
        noFilterResultsMessage = document.createElement("div");
        noFilterResultsMessage.className = "no-filter-results"; // Specific message for no filter results
        noFilterResultsMessage.style.textAlign = "center";
        noFilterResultsMessage.style.padding = "20px";
        noFilterResultsMessage.innerHTML = `<p>No chats match the current filter.</p>`;
        // Prepend to chatListContainer so it appears above any (hidden) chat items
        chatListContainer.insertBefore(
          noFilterResultsMessage,
          chatListContainer.firstChild
        );
      }
      noFilterResultsMessage.style.display = "block";
    } else if (noFilterResultsMessage) {
      noFilterResultsMessage.style.display = "none";
    }

    // If switching back to 'all' and no chats at all, show the general noChatMessage
    if (filter === "all" && chatItems.length === 0 && noChatMessage) {
      noChatMessage.style.display = "block"; // Or 'flex' depending on its original display type
    }
  }
}

// Load messages based on chat ID (simulated data) - This function should be removed or not used for actual loading
// function loadChatMessages(chatId) {
//   console.log(`Loading messages for chat ${chatId}... (using mock data)`);
//   const messages = getMockMessages(chatId);
//   const chatMessagesContainer = document.getElementById("chat-messages");
//   const noMessagesDiv = document.getElementById("no-messages");

//   if (!chatMessagesContainer || !noMessagesDiv) {
//     console.error("Chat messages container or noMessagesDiv not found");
//     return;
//   }

//   chatMessagesContainer.innerHTML = ""; // Clear previous messages

//   if (messages.length === 0) {
//     noMessagesDiv.style.display = "block";
//   } else {
//     noMessagesDiv.style.display = "none";
//     messages.forEach((msg) => {
//       addMessage(msg.text, msg.isSelf, msg.timestamp);
//     });
//   }
//   scrollToBottom();
// }
