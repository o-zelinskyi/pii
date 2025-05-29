// Chat Application JavaScript
document.addEventListener("DOMContentLoaded", function () {
  initializeChatApp();
});

function initializeChatApp() {
  setupChatList();
  setupChatInput();
  setupModals();
  setupSearchFunctionality();
  setupFilterTabs();
}

// Chat List Management
function setupChatList() {
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    item.addEventListener("click", function () {
      // Remove active class from all items
      chatItems.forEach((i) => i.classList.remove("active"));
      // Add active class to clicked item
      this.classList.add("active");

      // Update chat header with selected chat info
      updateChatHeader(this);

      // Load messages for selected chat
      loadChatMessages(this.dataset.chatId);
    });
  });
}

// Update chat header when switching chats
function updateChatHeader(chatItem) {
  const chatName = chatItem.querySelector(".chat-name").textContent;
  const avatar = chatItem.querySelector(".chat-avatar img");
  const hasOnlineIndicator = chatItem.querySelector(".online-indicator");

  const headerAvatar = document.querySelector(".chat-header .chat-avatar img");
  const headerName = document.querySelector(".chat-details h3");
  const headerStatus = document.querySelector(".chat-details .status");

  if (headerAvatar && avatar) {
    headerAvatar.src = avatar.src;
  }

  if (headerName) {
    headerName.textContent = chatName;
  }

  if (headerStatus) {
    headerStatus.textContent = hasOnlineIndicator
      ? "Online • Last seen recently"
      : "Last seen recently";
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
      addMessage(message, true);
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

  function addMessage(text, isSelf = false, timestamp = null) {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${isSelf ? "self" : "other"}`;

    const currentTime =
      timestamp ||
      new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });

    const avatarHtml = !isSelf
      ? `
            <div class="message-avatar">
                <img src="${getAvatarUrl()}" alt="Avatar">
            </div>
        `
      : "";

    messageDiv.innerHTML = `
            ${avatarHtml}
            <div class="message-content">
                <div class="message-bubble">
                    <p>${escapeHtml(text)}</p>
                </div>
                <div class="message-info">
                    <span class="message-time">${currentTime}</span>
                    ${isSelf ? '<span class="message-status">✓</span>' : ""}
                </div>
            </div>
        `;

    chatMessages.appendChild(messageDiv);
    scrollToBottom();

    // Animate message appearance
    messageDiv.style.opacity = "0";
    messageDiv.style.transform = "translateY(20px)";

    requestAnimationFrame(() => {
      messageDiv.style.transition = "all 0.3s ease";
      messageDiv.style.opacity = "1";
      messageDiv.style.transform = "translateY(0)";
    });
  }

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  function getAvatarUrl() {
    // In a real app, this would come from the selected chat
    return (
      document.querySelector(".chat-header .chat-avatar img")?.src ||
      "/img/avatar.webp"
    );
  }

  function escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Typing indicator
  function showTypingIndicator() {
    const typingIndicator = document.querySelector(".typing-indicator");
    if (typingIndicator) {
      typingIndicator.style.display = "block";
      scrollToBottom();
    }
  }

  function hideTypingIndicator() {
    const typingIndicator = document.querySelector(".typing-indicator");
    if (typingIndicator) {
      typingIndicator.style.display = "none";
    }
  }

  // Simulate bot/user responses
  function simulateResponse(originalMessage) {
    const responses = [
      "That's interesting! Tell me more.",
      "I completely agree with you on that.",
      "Thanks for sharing that with me.",
      "That's a great point!",
      "I'll look into that and get back to you.",
      "Sounds good! Let's proceed with that plan.",
      "I appreciate you bringing this up.",
      "That makes perfect sense.",
    ];

    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    addMessage(randomResponse, false);

    // Update message status to read
    setTimeout(() => {
      const lastSelfMessage = document.querySelector(
        ".message.self:last-of-type .message-status"
      );
      if (lastSelfMessage) {
        lastSelfMessage.textContent = "✓✓";
        lastSelfMessage.style.color = "var(--accent-clr)";
      }
    }, 500);
  }

  // File upload handling
  function handleFileUpload(files) {
    Array.from(files).forEach((file) => {
      const fileMessage = `📎 Shared a file: ${file.name}`;
      addMessage(fileMessage, true);
    });
  }

  // Initialize send button state
  updateSendButtonState();
}

// Modal Management
function setupModals() {
  const modal = document.getElementById("createChatModal");
  const createBtn = document.getElementById("createChatBtn");
  const closeBtn = document.querySelector(".close-button");
  const confirmBtn = document.getElementById("confirmCreateChatBtn");

  if (!modal || !createBtn || !closeBtn || !confirmBtn) return;

  createBtn.addEventListener("click", () => {
    modal.style.display = "block";
    document.body.style.overflow = "hidden"; // Prevent background scroll
  });

  closeBtn.addEventListener("click", closeModal);

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });

  // Close modal on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && modal.style.display === "block") {
      closeModal();
    }
  });

  function closeModal() {
    modal.style.display = "none";
    document.body.style.overflow = "auto";
    resetModalForm();
  }

  function resetModalForm() {
    const checkboxes = modal.querySelectorAll('input[type="checkbox"]');
    checkboxes.forEach((cb) => (cb.checked = false));
    confirmBtn.disabled = true;

    const searchInput = modal.querySelector("#userSearch");
    if (searchInput) {
      searchInput.value = "";
    }
  }

  // User selection handling
  const userCheckboxes = document.querySelectorAll('input[name="user"]');
  userCheckboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      const checkedBoxes = document.querySelectorAll(
        'input[name="user"]:checked'
      );
      confirmBtn.disabled = checkedBoxes.length === 0;

      // Update button text based on selection
      if (checkedBoxes.length === 1) {
        confirmBtn.textContent = "Start Conversation";
      } else if (checkedBoxes.length > 1) {
        confirmBtn.textContent = `Create Group (${checkedBoxes.length})`;
      } else {
        confirmBtn.textContent = "Start Conversation";
      }
    });
  });

  // Create chat confirmation
  confirmBtn.addEventListener("click", () => {
    const selectedUsers = Array.from(
      document.querySelectorAll('input[name="user"]:checked')
    );
    if (selectedUsers.length > 0) {
      createNewChat(selectedUsers);
      closeModal();
    }
  });

  // User search in modal
  const userSearch = document.getElementById("userSearch");
  if (userSearch) {
    userSearch.addEventListener("input", function () {
      filterUsers(this.value);
    });
  }

  function filterUsers(searchTerm) {
    const userItems = document.querySelectorAll(".user-item");
    userItems.forEach((item) => {
      const userName = item
        .querySelector(".user-info h4")
        .textContent.toLowerCase();
      const isVisible = userName.includes(searchTerm.toLowerCase());
      item.style.display = isVisible ? "flex" : "none";
    });
  }

  function createNewChat(selectedUsers) {
    // In a real application, this would make an API call
    console.log(
      "Creating new chat with users:",
      selectedUsers.map((u) => u.value)
    );

    // For demo purposes, add a new chat to the list
    const chatList = document.querySelector(".chat-list");
    const newChatItem = createNewChatItem(selectedUsers);
    chatList.insertBefore(newChatItem, chatList.firstChild);

    // Select the new chat
    newChatItem.click();

    // Show success message
    showNotification("New conversation started!", "success");
  }

  function createNewChatItem(selectedUsers) {
    const li = document.createElement("li");
    li.className = "chat-item";
    li.dataset.chatId = "new_" + Date.now();

    const userName =
      selectedUsers.length === 1
        ? document.querySelector(
            `[data-user-id="${selectedUsers[0].value}"] .user-info h4`
          ).textContent
        : `Group Chat (${selectedUsers.length})`;

    li.innerHTML = `
            <div class="chat-avatar">
                <img src="/img/avatar.webp" alt="User Avatar">
                <div class="online-indicator"></div>
            </div>
            <div class="chat-info">
                <div class="chat-header-info">
                    <h4 class="chat-name">${userName}</h4>
                    <span class="chat-time">now</span>
                </div>
                <div class="chat-preview">
                    <p class="last-message">Say hello to start the conversation!</p>
                    <div class="chat-badges"></div>
                </div>
            </div>
        `;

    // Add click handler
    li.addEventListener("click", function () {
      document
        .querySelectorAll(".chat-item")
        .forEach((item) => item.classList.remove("active"));
      this.classList.add("active");
      updateChatHeader(this);
      loadChatMessages(this.dataset.chatId);
    });

    return li;
  }
}

// Search Functionality
function setupSearchFunctionality() {
  const searchBtn = document.getElementById("searchChatsBtn");
  const searchContainer = document.getElementById("searchContainer");
  const searchInput = document.getElementById("searchInput");

  if (!searchBtn || !searchContainer || !searchInput) return;

  searchBtn.addEventListener("click", () => {
    const isVisible = searchContainer.style.display !== "none";
    searchContainer.style.display = isVisible ? "none" : "block";

    if (!isVisible) {
      searchInput.focus();
    } else {
      searchInput.value = "";
      filterChats(""); // Reset filter
    }
  });

  searchInput.addEventListener("input", function () {
    filterChats(this.value);
  });

  function filterChats(searchTerm) {
    const chatItems = document.querySelectorAll(".chat-item");
    chatItems.forEach((item) => {
      const chatName = item
        .querySelector(".chat-name")
        .textContent.toLowerCase();
      const lastMessage = item
        .querySelector(".last-message")
        .textContent.toLowerCase();
      const isVisible =
        chatName.includes(searchTerm.toLowerCase()) ||
        lastMessage.includes(searchTerm.toLowerCase());
      item.style.display = isVisible ? "flex" : "none";
    });
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
    const chatItems = document.querySelectorAll(".chat-item");

    chatItems.forEach((item) => {
      let isVisible = true;

      switch (filter) {
        case "all":
          isVisible = true;
          break;
        case "unread":
          isVisible = item.querySelector(".unread-count") !== null;
          break;
        case "groups":
          isVisible = item.querySelector(".group-avatar") !== null;
          break;
        default:
          isVisible = true;
      }

      item.style.display = isVisible ? "flex" : "none";
    });
  }
}

// Load chat messages (simulated)
function loadChatMessages(chatId) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  // Clear current messages except date divider
  const messages = chatMessages.querySelectorAll(".message");
  messages.forEach((msg) => msg.remove());

  // Hide typing indicator
  const typingIndicator = document.querySelector(".typing-indicator");
  if (typingIndicator) {
    typingIndicator.style.display = "none";
  }

  // Load messages based on chat ID (simulated data)
  const mockMessages = getMockMessages(chatId);

  mockMessages.forEach((msg, index) => {
    setTimeout(() => {
      addMessage(msg.text, msg.isSelf, msg.time);
    }, index * 100); // Stagger message loading for smooth effect
  });
}

// Mock message data
function getMockMessages(chatId) {
  const messageSets = {
    1: [
      { text: "Hey! How are you doing?", isSelf: false, time: "10:30 AM" },
      {
        text: "Hi there! I'm doing great, thanks for asking. How about you?",
        isSelf: true,
        time: "10:32 AM",
      },
      {
        text: "I'm doing well too! Working on some exciting projects.",
        isSelf: false,
        time: "10:35 AM",
      },
      {
        text: "Yes! The new features look amazing 🚀",
        isSelf: true,
        time: "10:36 AM",
      },
    ],
    2: [
      {
        text: "Good morning! How's the project coming along?",
        isSelf: false,
        time: "9:15 AM",
      },
      {
        text: "Morning! It's going really well. We're ahead of schedule actually.",
        isSelf: true,
        time: "9:18 AM",
      },
      {
        text: "That's fantastic news! The team is doing great work.",
        isSelf: false,
        time: "9:20 AM",
      },
      {
        text: "Thanks for the update on the project status",
        isSelf: false,
        time: "1:15 PM",
      },
    ],
    3: [
      {
        text: "Team meeting reminder: Tomorrow at 10 AM",
        isSelf: false,
        time: "11:30 AM",
      },
      {
        text: "Thanks for the reminder! I'll be there.",
        isSelf: true,
        time: "11:32 AM",
      },
      {
        text: "Let's schedule a meeting for tomorrow",
        isSelf: false,
        time: "12:45 PM",
      },
    ],
    default: [
      { text: "Welcome to the conversation!", isSelf: false, time: "now" },
    ],
  };

  return messageSets[chatId] || messageSets.default;
}

// Add message function (enhanced version)
function addMessage(text, isSelf = false, timestamp = null) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;

  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isSelf ? "self" : "other"}`;

  const currentTime =
    timestamp ||
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const avatarHtml = !isSelf
    ? `
        <div class="message-avatar">
            <img src="${getAvatarUrl()}" alt="Avatar">
        </div>
    `
    : "";

  messageDiv.innerHTML = `
        ${avatarHtml}
        <div class="message-content">
            <div class="message-bubble">
                <p>${escapeHtml(text)}</p>
            </div>
            <div class="message-info">
                <span class="message-time">${currentTime}</span>
                ${isSelf ? '<span class="message-status">✓</span>' : ""}
            </div>
        </div>
    `;

  chatMessages.appendChild(messageDiv);

  // Smooth scroll to bottom
  requestAnimationFrame(() => {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}

// Utility functions
function getAvatarUrl() {
  return (
    document.querySelector(".chat-header .chat-avatar img")?.src ||
    "/img/avatar.webp"
  );
}

function escapeHtml(text) {
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

// Notification system
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `chat-notification ${type}`;
  notification.textContent = message;

  notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: var(--accent-clr);
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        z-index: 1001;
        transform: translateX(100%);
        transition: transform 0.3s ease;
    `;

  document.body.appendChild(notification);

  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = "translateX(0)";
  });

  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(100%)";
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

// Enhanced Chat Features
let currentReplyTo = null;
let isRecording = false;
let recordingStartTime = null;
let recordingTimer = null;

// Message Reactions
function toggleReactionPicker(messageId) {
  const picker = document.getElementById("reactionPicker");
  const message = document.querySelector(`[data-message-id="${messageId}"]`);

  if (!picker || !message) return;

  // Position the picker near the message
  const rect = message.getBoundingClientRect();
  picker.style.left = rect.left + "px";
  picker.style.top = rect.top - picker.offsetHeight - 10 + "px";

  // Store current message ID for reaction
  picker.dataset.currentMessage = messageId;

  // Toggle visibility
  if (picker.style.display === "none" || !picker.style.display) {
    picker.style.display = "flex";
    // Hide after 3 seconds if no interaction
    setTimeout(() => {
      if (picker.style.display === "flex") {
        picker.style.display = "none";
      }
    }, 3000);
  } else {
    picker.style.display = "none";
  }
}

function addReaction(emoji) {
  const picker = document.getElementById("reactionPicker");
  const messageId = picker.dataset.currentMessage;
  const message = document.querySelector(`[data-message-id="${messageId}"]`);

  if (!message) return;

  let reactionsContainer = message.querySelector(".message-reactions");
  if (!reactionsContainer) {
    reactionsContainer = document.createElement("div");
    reactionsContainer.className = "message-reactions";
    message.appendChild(reactionsContainer);
  }

  // Check if reaction already exists
  let existingReaction = reactionsContainer.querySelector(
    `[data-reaction="${emoji}"]`
  );
  if (existingReaction) {
    // Increment count
    const countSpan = existingReaction.querySelector(".count");
    const currentCount = parseInt(countSpan.textContent);
    countSpan.textContent = currentCount + 1;
  } else {
    // Add new reaction
    const reactionElement = document.createElement("span");
    reactionElement.className = "reaction";
    reactionElement.dataset.reaction = emoji;
    reactionElement.innerHTML = `${emoji} <span class="count">1</span>`;
    reactionsContainer.appendChild(reactionElement);
  }

  // Hide picker
  picker.style.display = "none";

  // Add animation
  if (existingReaction) {
    existingReaction.style.transform = "scale(1.2)";
    setTimeout(() => {
      existingReaction.style.transform = "scale(1)";
    }, 200);
  }
}

// Reply Functionality
function replyToMessage(messageId) {
  const message = document.querySelector(`[data-message-id="${messageId}"]`);
  const messageText = message.querySelector("p").textContent;
  const messageSender = message.closest(".message").classList.contains("self")
    ? "You"
    : "John Doe";

  const replyPreview = document.getElementById("replyPreview");
  const replyTo = replyPreview.querySelector(".reply-to strong");
  const replyMessage = replyPreview.querySelector(".reply-message");

  replyTo.textContent = messageSender;
  replyMessage.textContent =
    messageText.length > 50
      ? messageText.substring(0, 50) + "..."
      : messageText;

  replyPreview.style.display = "block";
  currentReplyTo = { messageId, messageSender, messageText };

  // Focus on input
  document.getElementById("message-input").focus();
}

function cancelReply() {
  document.getElementById("replyPreview").style.display = "none";
  currentReplyTo = null;
}

// Attachment Menu
function toggleAttachmentMenu() {
  const menu = document.getElementById("attachmentMenu");
  menu.style.display =
    menu.style.display === "none" || !menu.style.display ? "block" : "none";

  // Hide after 5 seconds if no interaction
  if (menu.style.display === "block") {
    setTimeout(() => {
      if (menu.style.display === "block") {
        menu.style.display = "none";
      }
    }, 5000);
  }
}

function selectFiles(type) {
  const fileInput = document.createElement("input");
  fileInput.type = "file";
  fileInput.multiple = true;

  if (type === "image") {
    fileInput.accept = "image/*";
  } else if (type === "file") {
    fileInput.accept = ".pdf,.doc,.docx,.txt,.xlsx,.pptx";
  }

  fileInput.onchange = function () {
    handleFileUpload(this.files, type);
  };

  fileInput.click();
  document.getElementById("attachmentMenu").style.display = "none";
}

function handleFileUpload(files, type) {
  Array.from(files).forEach((file) => {
    if (type === "image" && file.type.startsWith("image/")) {
      addImageMessage(file);
    } else {
      addFileMessage(file);
    }
  });
}

function addImageMessage(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message self";

    const currentTime = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      <div class="message-content">
        <div class="message-bubble media-message" data-message-id="${Date.now()}">
          <div class="media-preview">
            <img src="${
              e.target.result
            }" alt="Shared image" onclick="openImageModal('${
      e.target.result
    }')">
            <div class="media-overlay">
              <button class="media-download" title="Download">⬇</button>
            </div>
          </div>
          <p>${file.name}</p>
        </div>
        <div class="message-info">
          <span class="message-time">${currentTime}</span>
          <span class="message-status">✓</span>
        </div>
      </div>
    `;

    document.getElementById("chat-messages").appendChild(messageDiv);
    scrollToBottom();
  };
  reader.readAsDataURL(file);
}

function addFileMessage(file) {
  const fileSize = formatFileSize(file.size);
  const fileIcon = getFileIcon(file.name);

  const messageDiv = document.createElement("div");
  messageDiv.className = "message self";

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-bubble" data-message-id="${Date.now()}">
        <div class="file-attachment">
          <div class="file-icon">${fileIcon}</div>
          <div class="file-info">
            <div class="file-name">${file.name}</div>
            <div class="file-size">${fileSize}</div>
          </div>
          <button class="file-download" onclick="downloadFile('${
            file.name
          }')">⬇</button>
        </div>
      </div>
      <div class="message-info">
        <span class="message-time">${currentTime}</span>
        <span class="message-status">✓</span>
      </div>
    </div>
  `;

  document.getElementById("chat-messages").appendChild(messageDiv);
  scrollToBottom();
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(filename) {
  const ext = filename.split(".").pop().toLowerCase();
  const icons = {
    pdf: "📄",
    doc: "📝",
    docx: "📝",
    txt: "📄",
    xlsx: "📊",
    pptx: "📊",
    zip: "🗜️",
    mp3: "🎵",
    mp4: "🎬",
  };
  return icons[ext] || "📎";
}

// Image Modal
function openImageModal(src) {
  const modal = document.getElementById("imageModal");
  const modalImg = document.getElementById("modalImage");
  modal.style.display = "block";
  modalImg.src = src;
}

function closeImageModal() {
  document.getElementById("imageModal").style.display = "none";
}

// Emoji Picker
function toggleEmojiPicker() {
  const picker = document.getElementById("emojiPicker");
  picker.style.display =
    picker.style.display === "none" || !picker.style.display ? "block" : "none";
}

function insertEmoji(emoji) {
  const input = document.getElementById("message-input");
  const cursorPos = input.selectionStart;
  const textBefore = input.value.substring(0, cursorPos);
  const textAfter = input.value.substring(cursorPos);

  input.value = textBefore + emoji + textAfter;
  input.focus();
  input.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);

  // Hide emoji picker
  document.getElementById("emojiPicker").style.display = "none";

  // Trigger input event to resize textarea
  input.dispatchEvent(new Event("input"));
}

// Voice Recording
function startVoiceRecording() {
  document.getElementById("attachmentMenu").style.display = "none";
  toggleVoiceRecording();
}

function toggleVoiceRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    stopRecording();
  }
}

function startRecording() {
  isRecording = true;
  recordingStartTime = Date.now();

  // Show recording overlay
  document.getElementById("voiceRecordingOverlay").style.display = "flex";

  // Start timer
  recordingTimer = setInterval(updateRecordingTime, 1000);

  // Hide send button, show voice button
  document.getElementById("send-btn").style.display = "none";
  document.getElementById("voiceRecordBtn").style.display = "flex";

  // Request microphone access (in real app)
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        // Handle audio recording here
        console.log("Recording started");
      })
      .catch((err) => {
        console.error("Microphone access denied:", err);
        cancelVoiceRecording();
      });
  }
}

function updateRecordingTime() {
  const elapsed = Math.floor((Date.now() - recordingStartTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  const timeDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  const timeElement = document.getElementById("recordingTime");
  if (timeElement) {
    timeElement.textContent = timeDisplay;
  }
}

function stopVoiceRecording() {
  stopRecording();

  // Add voice message
  const duration = Math.floor((Date.now() - recordingStartTime) / 1000);
  addVoiceMessage(duration);
}

function cancelVoiceRecording() {
  stopRecording();
}

function stopRecording() {
  isRecording = false;

  // Clear timer
  if (recordingTimer) {
    clearInterval(recordingTimer);
    recordingTimer = null;
  }

  // Hide recording overlay
  document.getElementById("voiceRecordingOverlay").style.display = "none";

  // Show send button, hide voice button
  document.getElementById("send-btn").style.display = "flex";
  document.getElementById("voiceRecordBtn").style.display = "none";
}

function addVoiceMessage(duration) {
  const messageDiv = document.createElement("div");
  messageDiv.className = "message self";

  const currentTime = new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const minutes = Math.floor(duration / 60);
  const seconds = duration % 60;
  const durationDisplay = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  // Generate random waveform
  const waveformBars = Array.from(
    { length: 8 },
    () =>
      `<div class="wave-bar" style="height: ${
        Math.floor(Math.random() * 12) + 6
      }px;"></div>`
  ).join("");

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-bubble voice-message" data-message-id="${Date.now()}">
        <div class="voice-player">
          <button class="voice-play-btn" onclick="toggleVoicePlayback(this)">
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </button>
          <div class="voice-waveform">
            ${waveformBars}
          </div>
          <span class="voice-duration">${durationDisplay}</span>
        </div>
      </div>
      <div class="message-info">
        <span class="message-time">${currentTime}</span>
        <span class="message-status">✓</span>
      </div>
    </div>
  `;

  document.getElementById("chat-messages").appendChild(messageDiv);
  scrollToBottom();
}

function toggleVoicePlayback(button) {
  const isPlaying = button.classList.contains("playing");

  if (isPlaying) {
    // Stop playback
    button.classList.remove("playing");
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M8 5v14l11-7z"/>
      </svg>
    `;

    // Stop waveform animation
    const waveform = button.parentElement.querySelector(".voice-waveform");
    waveform.querySelectorAll(".wave-bar").forEach((bar) => {
      bar.classList.remove("active");
    });
  } else {
    // Start playback
    button.classList.add("playing");
    button.innerHTML = `
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
      </svg>
    `;

    // Animate waveform
    const waveform = button.parentElement.querySelector(".voice-waveform");
    const bars = waveform.querySelectorAll(".wave-bar");
    let currentBar = 0;

    const animateWaveform = setInterval(() => {
      bars.forEach((bar) => bar.classList.remove("active"));
      bars[currentBar].classList.add("active");
      currentBar = (currentBar + 1) % bars.length;
    }, 200);

    // Stop after duration (simulate playback)
    setTimeout(() => {
      clearInterval(animateWaveform);
      button.click(); // Stop playback
    }, 3000);
  }
}

// Enhanced send message function
function sendMessage() {
  const messageInput = document.getElementById("message-input");
  const message = messageInput.value.trim();

  if (message) {
    let messageContent = message;
    let replyData = null;

    // Handle reply
    if (currentReplyTo) {
      replyData = currentReplyTo;
      cancelReply();
    }

    addMessage(messageContent, true, null, replyData);
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

// Enhanced addMessage function
function addMessage(text, isSelf = false, timestamp = null, replyData = null) {
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${isSelf ? "self" : "other"}`;

  const currentTime =
    timestamp ||
    new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

  const messageId = Date.now();

  const avatarHtml = !isSelf
    ? `
    <div class="message-avatar">
      <img src="${getAvatarUrl()}" alt="Avatar">
    </div>
  `
    : "";

  const replyHtml = replyData
    ? `
    <div class="message-reply">
      <div class="reply-indicator"></div>
      <div class="reply-content">
        <div class="reply-author">${replyData.messageSender}</div>
        <div class="reply-text">${
          replyData.messageText.length > 30
            ? replyData.messageText.substring(0, 30) + "..."
            : replyData.messageText
        }</div>
      </div>
    </div>
  `
    : "";

  const actionsHtml = !isSelf
    ? `
    <span class="message-actions">
      <button class="action-btn-small" onclick="toggleReactionPicker(${messageId})" title="React">😊</button>
      <button class="action-btn-small" onclick="replyToMessage(${messageId})" title="Reply">↩</button>
    </span>
  `
    : "";

  messageDiv.innerHTML = `
    ${avatarHtml}
    <div class="message-content">
      <div class="message-bubble" data-message-id="${messageId}">
        ${replyHtml}
        <p>${escapeHtml(text)}</p>
      </div>
      <div class="message-info">
        <span class="message-time">${currentTime}</span>
        ${isSelf ? '<span class="message-status">✓</span>' : actionsHtml}
      </div>
    </div>
  `;

  const chatMessages = document.getElementById("chat-messages");
  chatMessages.appendChild(messageDiv);
  scrollToBottom();

  // Animate message appearance
  messageDiv.style.opacity = "0";
  messageDiv.style.transform = "translateY(20px)";

  requestAnimationFrame(() => {
    messageDiv.style.transition = "all 0.3s ease";
    messageDiv.style.opacity = "1";
    messageDiv.style.transform = "translateY(0)";
  });
}

// Close dropdowns when clicking outside
document.addEventListener("click", function (e) {
  const attachmentMenu = document.getElementById("attachmentMenu");
  const emojiPicker = document.getElementById("emojiPicker");
  const reactionPicker = document.getElementById("reactionPicker");

  if (!e.target.closest(".input-action-btn") && attachmentMenu) {
    attachmentMenu.style.display = "none";
  }

  if (!e.target.closest(".emoji-btn") && emojiPicker) {
    emojiPicker.style.display = "none";
  }

  if (!e.target.closest(".action-btn-small") && reactionPicker) {
    reactionPicker.style.display = "none";
  }
});

// Enhanced Chatlist Management
let pinnedChats = new Set([3]); // Example: chat 3 is pinned
let mutedChats = new Set([5]); // Example: chat 5 is muted
let archivedChats = new Set();

// Chat Menu Functions
function toggleChatMenu(chatId) {
  const menu = document.getElementById(`chatMenu${chatId}`);
  const allMenus = document.querySelectorAll(".chat-menu");

  // Close all other menus
  allMenus.forEach((m) => {
    if (m !== menu) m.style.display = "none";
  });

  // Toggle current menu
  menu.style.display = menu.style.display === "none" ? "block" : "none";
}

function pinChat(chatId) {
  const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
  const chatName = chatItem.querySelector(".chat-name");

  if (!pinnedChats.has(chatId)) {
    pinnedChats.add(chatId);
    chatItem.classList.add("pinned");

    // Add pin icon if not already there
    if (!chatName.textContent.includes("📌")) {
      chatName.innerHTML = "📌 " + chatName.innerHTML;
    }

    // Move to top of list
    const chatList = document.querySelector(".chat-list");
    chatList.insertBefore(chatItem, chatList.firstChild);

    showNotification("Chat pinned", "success");
  }

  toggleChatMenu(chatId);
}

function unpinChat(chatId) {
  const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
  const chatName = chatItem.querySelector(".chat-name");

  if (pinnedChats.has(chatId)) {
    pinnedChats.delete(chatId);
    chatItem.classList.remove("pinned");

    // Remove pin icon
    chatName.innerHTML = chatName.innerHTML.replace("📌 ", "");

    showNotification("Chat unpinned", "info");
  }

  toggleChatMenu(chatId);
}

function muteChat(chatId) {
  const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
  const avatar = chatItem.querySelector(".chat-avatar");

  if (!mutedChats.has(chatId)) {
    mutedChats.add(chatId);
    chatItem.classList.add("muted");

    // Add mute indicator
    if (!avatar.querySelector(".muted-indicator")) {
      const muteIndicator = document.createElement("div");
      muteIndicator.className = "muted-indicator";
      muteIndicator.innerHTML = "🔇";
      avatar.appendChild(muteIndicator);
    }

    showNotification("Chat muted", "info");
  }

  toggleChatMenu(chatId);
}

function unmuteChat(chatId) {
  const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
  const muteIndicator = chatItem.querySelector(".muted-indicator");

  if (mutedChats.has(chatId)) {
    mutedChats.delete(chatId);
    chatItem.classList.remove("muted");

    // Remove mute indicator
    if (muteIndicator) {
      muteIndicator.remove();
    }

    showNotification("Chat unmuted", "success");
  }

  toggleChatMenu(chatId);
}

function archiveChat(chatId) {
  const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);

  if (!archivedChats.has(chatId)) {
    archivedChats.add(chatId);

    // Animate out
    chatItem.style.transform = "translateX(-100%)";
    chatItem.style.opacity = "0";

    setTimeout(() => {
      chatItem.style.display = "none";
      showNotification("Chat archived", "info");
    }, 300);
  }

  toggleChatMenu(chatId);
}

function deleteChat(chatId) {
  if (
    confirm(
      "Are you sure you want to delete this chat? This action cannot be undone."
    )
  ) {
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);

    // Animate out
    chatItem.style.transform = "scale(0.8)";
    chatItem.style.opacity = "0";

    setTimeout(() => {
      chatItem.remove();
      showNotification("Chat deleted", "error");
    }, 300);
  }

  toggleChatMenu(chatId);
}

function leaveGroup(chatId) {
  if (confirm("Are you sure you want to leave this group?")) {
    const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);

    // Animate out
    chatItem.style.transform = "translateX(-100%)";
    chatItem.style.opacity = "0";

    setTimeout(() => {
      chatItem.remove();
      showNotification("Left group", "info");
    }, 300);
  }

  toggleChatMenu(chatId);
}

// Enhanced Search Functionality
function setupEnhancedSearch() {
  const searchInput = document.getElementById("searchInput");
  const chatItems = document.querySelectorAll(".chat-item");

  if (!searchInput) return;

  let searchTimeout;

  searchInput.addEventListener("input", function () {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      performSearch(this.value.toLowerCase(), chatItems);
    }, 300);
  });

  // Add keyboard navigation
  searchInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      navigateSearchResults(e.key === "ArrowDown" ? 1 : -1);
    } else if (e.key === "Enter") {
      selectHighlightedChat();
    }
  });
}

function performSearch(query, chatItems) {
  let visibleCount = 0;

  chatItems.forEach((item, index) => {
    const chatName = item.querySelector(".chat-name").textContent.toLowerCase();
    const lastMessage = item
      .querySelector(".last-message")
      .textContent.toLowerCase();

    const matches = chatName.includes(query) || lastMessage.includes(query);

    if (matches || query === "") {
      item.style.display = "flex";
      item.classList.remove("search-hidden");
      visibleCount++;

      // Highlight matching text
      if (query !== "") {
        highlightText(item, query);
      } else {
        removeHighlight(item);
      }
    } else {
      item.style.display = "none";
      item.classList.add("search-hidden");
    }
  });

  // Show "no results" message if needed
  toggleNoResultsMessage(visibleCount === 0 && query !== "");
}

function highlightText(item, query) {
  const chatName = item.querySelector(".chat-name");
  const lastMessage = item.querySelector(".last-message");

  [chatName, lastMessage].forEach((element) => {
    const text = element.textContent;
    const highlightedText = text.replace(
      new RegExp(`(${query})`, "gi"),
      "<mark>$1</mark>"
    );

    if (highlightedText !== text) {
      element.innerHTML = highlightedText;
    }
  });
}

function removeHighlight(item) {
  const marks = item.querySelectorAll("mark");
  marks.forEach((mark) => {
    mark.outerHTML = mark.innerHTML;
  });
}

function toggleNoResultsMessage(show) {
  let noResultsMsg = document.querySelector(".no-results-message");

  if (show && !noResultsMsg) {
    noResultsMsg = document.createElement("div");
    noResultsMsg.className = "no-results-message";
    noResultsMsg.innerHTML = `
      <div class="no-results-content">
        <div class="no-results-icon">🔍</div>
        <p>No chats found</p>
        <small>Try searching with different keywords</small>
      </div>
    `;
    document.querySelector(".chatlist-content").appendChild(noResultsMsg);
  } else if (!show && noResultsMsg) {
    noResultsMsg.remove();
  }
}

// Notification System
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <div class="notification-content">
      <span class="notification-icon">${getNotificationIcon(type)}</span>
      <span class="notification-message">${message}</span>
    </div>
    <button class="notification-close" onclick="closeNotification(this)">×</button>
  `;

  // Add to container or create one
  let container = document.querySelector(".notification-container");
  if (!container) {
    container = document.createElement("div");
    container.className = "notification-container";
    document.body.appendChild(container);
  }

  container.appendChild(notification);

  // Auto remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      closeNotification(notification.querySelector(".notification-close"));
    }
  }, 3000);
}

function getNotificationIcon(type) {
  const icons = {
    success: "✅",
    error: "❌",
    info: "ℹ️",
    warning: "⚠️",
  };
  return icons[type] || icons.info;
}

function closeNotification(button) {
  const notification = button.closest(".notification");
  notification.style.transform = "translateX(100%)";
  notification.style.opacity = "0";

  setTimeout(() => {
    notification.remove();
  }, 300);
}

// Drag and Drop for Chat Reordering
function setupDragAndDrop() {
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    item.draggable = true;

    item.addEventListener("dragstart", handleDragStart);
    item.addEventListener("dragover", handleDragOver);
    item.addEventListener("drop", handleDrop);
    item.addEventListener("dragend", handleDragEnd);
  });
}

let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add("dragging");
  e.dataTransfer.effectAllowed = "move";
}

function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";

  if (this !== draggedElement) {
    this.classList.add("drop-target");
  }
}

function handleDrop(e) {
  e.preventDefault();

  if (this !== draggedElement) {
    const chatList = document.querySelector(".chat-list");
    const draggedIndex = Array.from(chatList.children).indexOf(draggedElement);
    const targetIndex = Array.from(chatList.children).indexOf(this);

    if (draggedIndex < targetIndex) {
      chatList.insertBefore(draggedElement, this.nextSibling);
    } else {
      chatList.insertBefore(draggedElement, this);
    }

    showNotification("Chat reordered", "success");
  }

  this.classList.remove("drop-target");
}

function handleDragEnd(e) {
  this.classList.remove("dragging");

  // Remove all drop targets
  document.querySelectorAll(".drop-target").forEach((item) => {
    item.classList.remove("drop-target");
  });

  draggedElement = null;
}

// Enhanced Filter Management
function setupEnhancedFilters() {
  const filterTabs = document.querySelectorAll(".filter-tab");

  filterTabs.forEach((tab) => {
    tab.addEventListener("click", function () {
      const filter = this.dataset.filter;
      applyFilter(filter);

      // Update active state
      filterTabs.forEach((t) => t.classList.remove("active"));
      this.classList.add("active");
    });
  });

  // Add notification badges to filter tabs
  updateFilterNotifications();
}

function applyFilter(filter) {
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    const chatId = parseInt(item.dataset.chatId);
    let shouldShow = true;

    switch (filter) {
      case "unread":
        shouldShow = item.querySelector(".unread-count") !== null;
        break;
      case "groups":
        shouldShow = item.querySelector(".group-avatar") !== null;
        break;
      case "muted":
        shouldShow = mutedChats.has(chatId);
        break;
      case "pinned":
        shouldShow = pinnedChats.has(chatId);
        break;
      case "archived":
        shouldShow = archivedChats.has(chatId);
        break;
      case "all":
      default:
        shouldShow = !archivedChats.has(chatId);
        break;
    }

    item.style.display = shouldShow ? "flex" : "none";
  });
}

function updateFilterNotifications() {
  const unreadTab = document.querySelector('[data-filter="unread"]');
  const unreadCount = document.querySelectorAll(".unread-count").length;

  if (unreadCount > 0) {
    unreadTab.classList.add("has-notifications");
  } else {
    unreadTab.classList.remove("has-notifications");
  }
}

// Context Menu
function setupContextMenu() {
  const chatItems = document.querySelectorAll(".chat-item");

  chatItems.forEach((item) => {
    item.addEventListener("contextmenu", function (e) {
      e.preventDefault();
      showContextMenu(e, this.dataset.chatId);
    });
  });

  // Close context menu on click outside
  document.addEventListener("click", function () {
    const contextMenu = document.querySelector(".context-menu");
    if (contextMenu) {
      contextMenu.remove();
    }
  });
}

function showContextMenu(event, chatId) {
  // Remove existing context menu
  const existingMenu = document.querySelector(".context-menu");
  if (existingMenu) {
    existingMenu.remove();
  }

  const contextMenu = document.createElement("div");
  contextMenu.className = "context-menu";

  const isPinned = pinnedChats.has(parseInt(chatId));
  const isMuted = mutedChats.has(parseInt(chatId));

  contextMenu.innerHTML = `
    <button class="context-menu-item" onclick="markAsRead(${chatId})">
      <span>📖</span> Mark as Read
    </button>
    <button class="context-menu-item" onclick="${
      isPinned ? "unpinChat" : "pinChat"
    }(${chatId})">
      <span>📌</span> ${isPinned ? "Unpin" : "Pin"} Chat
    </button>
    <button class="context-menu-item" onclick="${
      isMuted ? "unmuteChat" : "muteChat"
    }(${chatId})">
      <span>${isMuted ? "🔊" : "🔇"}</span> ${isMuted ? "Unmute" : "Mute"} Chat
    </button>
    <div class="context-menu-divider"></div>
    <button class="context-menu-item" onclick="archiveChat(${chatId})">
      <span>📁</span> Archive
    </button>
    <button class="context-menu-item danger" onclick="deleteChat(${chatId})">
      <span>🗑</span> Delete Chat
    </button>
  `;

  // Position the menu
  contextMenu.style.left = event.pageX + "px";
  contextMenu.style.top = event.pageY + "px";

  document.body.appendChild(contextMenu);

  // Adjust position if menu goes off screen
  const rect = contextMenu.getBoundingClientRect();
  if (rect.right > window.innerWidth) {
    contextMenu.style.left = event.pageX - rect.width + "px";
  }
  if (rect.bottom > window.innerHeight) {
    contextMenu.style.top = event.pageY - rect.height + "px";
  }
}

function markAsRead(chatId) {
  const chatItem = document.querySelector(`[data-chat-id="${chatId}"]`);
  const unreadBadge = chatItem.querySelector(".unread-count");

  if (unreadBadge) {
    unreadBadge.remove();
    showNotification("Marked as read", "success");
    updateFilterNotifications();
  }

  // Close context menu
  document.querySelector(".context-menu").remove();
}

// Typing Indicator Management
function showTypingIndicator(chatId = 6) {
  const typingChat = document.querySelector(`[data-chat-id="${chatId}"]`);
  if (typingChat) {
    typingChat.style.display = "flex";

    // Move to top of list
    const chatList = document.querySelector(".chat-list");
    chatList.insertBefore(typingChat, chatList.firstChild);
  }
}

function hideTypingIndicator(chatId = 6) {
  const typingChat = document.querySelector(`[data-chat-id="${chatId}"]`);
  if (typingChat) {
    typingChat.style.display = "none";
  }
}

// Initialize all enhanced features
document.addEventListener("DOMContentLoaded", function () {
  setupEnhancedSearch();
  setupEnhancedFilters();
  setupDragAndDrop();
  setupContextMenu();

  // Demo: Show typing indicator after 2 seconds
  setTimeout(() => {
    showTypingIndicator();
    setTimeout(() => {
      hideTypingIndicator();
    }, 3000);
  }, 2000);

  // Close chat menus when clicking outside
  document.addEventListener("click", function (e) {
    if (!e.target.closest(".chat-actions-menu")) {
      document.querySelectorAll(".chat-menu").forEach((menu) => {
        menu.style.display = "none";
      });
    }
  });

  // Add styles for reply messages
  const replyStyles = `
    <style>
      .message-reply {
        margin-bottom: 8px;
        padding: 8px 12px;
        background: rgba(0, 68, 142, 0.1);
        border-radius: 8px;
        border-left: 3px solid var(--accent-clr);
        font-size: 12px;
      }
      
      .reply-author {
        font-weight: 600;
        color: var(--accent-clr);
        margin-bottom: 2px;
      }
      
      .reply-text {
        color: #6b7280;
      }
      
      .file-attachment {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        background: #f8f9fa;
        border-radius: 8px;
        border: 1px solid #e1e5e9;
      }
      
      .file-icon {
        font-size: 24px;
      }
      
      .file-info {
        flex: 1;
      }
      
      .file-name {
        font-weight: 500;
        color: var(--text-clr);
        font-size: 14px;
      }
      
      .file-size {
        font-size: 12px;
        color: #6b7280;
      }
      
      .file-download {
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        background: var(--accent-clr);
        color: white;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      }
      
      .file-download:hover {
        background: var(--hover-clr);
        transform: scale(1.05);
      }
    </style>
  `;

  document.head.insertAdjacentHTML("beforeend", replyStyles);
});
