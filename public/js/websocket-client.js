class ChatWebSocket {
  constructor(serverUrl, userToken) {
    this.serverUrl = serverUrl;
    this.userToken = userToken;
    this.socket = null;
    this.currentChatId = null;
    this.isInChatPage = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  connect(userData) {
    this.socket = io(this.serverUrl, {
      transports: ["websocket"],
      autoConnect: true,
    });

    this.socket.on("connect", () => {
      console.log("Connected to chat server");
      this.socket.emit("join", userData);
      this.reconnectAttempts = 0;
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
      this.handleReconnection();
    });

    this.setupEventListeners();
  }

  setupEventListeners() {
    // New message received
    this.socket.on("newMessage", (data) => {
      this.handleNewMessage(data);
    });

    // User online/offline status
    this.socket.on("userOnline", (user) => {
      this.updateUserStatus(user.user_id, true);
    });

    this.socket.on("userOffline", (user) => {
      this.updateUserStatus(user.user_id, false);
    });

    // Typing indicators
    this.socket.on("userTyping", (data) => {
      this.showTypingIndicator(data);
    });

    // Chat loaded
    this.socket.on("chatsLoaded", (chats) => {
      this.loadUserChats(chats);
    });

    // Messages loaded
    this.socket.on("messagesLoaded", (data) => {
      this.displayMessages(data.messages, data.chatId);
    });

    // Chat created
    this.socket.on("chatCreated", (data) => {
      this.handleChatCreated(data);
    });
  }

  handleNewMessage(data) {
    const { message, sender } = data;

    // Check if user is in the same chat
    if (this.currentChatId === message.chat_id) {
      if (this.isInChatPage) {
        // Add message to current chat without notification
        this.addMessageToChat(message, sender);
      } else {
        // Show notification and update chat list
        this.showMessageNotification(message, sender);
        this.updateChatList(message.chat_id);
      }
    } else {
      // Show notification for different chat
      this.showMessageNotification(message, sender);
      this.updateChatList(message.chat_id);
    }
  }

  showMessageNotification(message, sender) {
    // Only show if not in the same chat or not on chat page
    if (!this.isInChatPage || this.currentChatId !== message.chat_id) {
      // Trigger bell animation
      this.animateBellNotification();

      // Create notification popup
      this.createMessageNotification(message, sender);
    }
  }

  animateBellNotification() {
    const bellElement = document.querySelector(".notification-bell");
    if (bellElement) {
      bellElement.classList.add("animate-bell");
      setTimeout(() => {
        bellElement.classList.remove("animate-bell");
      }, 1000);
    }
  }

  createMessageNotification(message, sender) {
    const notification = document.createElement("div");
    notification.className = "message-notification";
    notification.innerHTML = `
            <div class="notification-content">
                <div class="sender-info">
                    <strong>${sender.firstname} ${sender.lastname}</strong>
                </div>
                <div class="message-preview">
                    ${message.content.substring(0, 50)}${
      message.content.length > 50 ? "..." : ""
    }
                </div>
            </div>
        `;

    notification.addEventListener("click", () => {
      // Navigate to the chat
      window.location.href = `/newPiiWithMvc/chats/messages?chatId=${message.chat_id}`;
    });

    // Add to notification window
    this.addToNotificationWindow(notification);
  }

  addToNotificationWindow(notification) {
    let notificationWindow = document.querySelector(".notification-window");
    if (!notificationWindow) {
      // Create notification window if it doesn't exist
      notificationWindow = document.createElement("div");
      notificationWindow.className = "notification-window";
      notificationWindow.style.display = "none";
      document.body.appendChild(notificationWindow);
    }

    // Add notification to window
    notificationWindow.appendChild(notification);
    notificationWindow.style.display = "flex";

    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      if (notificationWindow.children.length === 0) {
        notificationWindow.style.display = "none";
      }
    }, 5000);
  }

  addMessageToChat(message, sender) {
    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    const messageDiv = document.createElement("div");
    const isOwn = sender.user_id === window.currentUser.user_id;
    messageDiv.className = `message ${isOwn ? "self" : "other"}`;

    const timestamp = new Date(message.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    messageDiv.innerHTML = `
      ${
        !isOwn
          ? `<div class="message-avatar">
        <img src="${window.urlRoot}/img/avatar.webp" alt="Avatar">
      </div>`
          : ""
      }
      <div class="message-content">
        <div class="message-bubble">
          <p>${this.escapeHtml(message.content)}</p>
        </div>
        <div class="message-info">
          <span class="message-time">${timestamp}</span>
          ${isOwn ? '<span class="message-status">✓</span>' : ""}
        </div>
      </div>
    `;

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  sendMessage(chatId, content, messageType = "text") {
    if (this.socket) {
      this.socket.emit("sendMessage", {
        chatId,
        content,
        messageType,
      });
    }
  }

  loadMessages(chatId) {
    if (this.socket) {
      this.currentChatId = chatId;
      this.socket.emit("loadMessages", { chatId });
    }
  }

  createChat(participants, name, isGroup = false) {
    if (this.socket) {
      this.socket.emit("createChat", {
        participants,
        name,
        isGroup,
      });
    }
  }

  updateUserStatus(userId, isOnline) {
    // Update user status in the UI
    const userElements = document.querySelectorAll(
      `[data-user-id="${userId}"]`
    );
    userElements.forEach((element) => {
      if (isOnline) {
        element.classList.add("online");
        element.classList.remove("offline");
      } else {
        element.classList.add("offline");
        element.classList.remove("online");
      }
    });
  }

  displayMessages(messages, chatId) {
    if (this.currentChatId !== chatId) return;

    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    // Clear existing messages
    const existingMessages = chatMessages.querySelectorAll(".message");
    existingMessages.forEach((msg) => msg.remove());

    // Add messages
    messages.forEach((message) => {
      this.addMessageToChat(message, {
        user_id: message.sender_id,
        firstname: "User", // You might want to get this from your user data
        lastname: "",
      });
    });
  }

  getUserChats(callback) {
    if (this.socket) {
      // Store callback for when chats are loaded
      this.chatsLoadedCallback = callback;
      this.socket.emit("getUserChats");
    }
  }

  loadUserChats(chats) {
    // Update the chat list in the UI
    if (this.chatsLoadedCallback) {
      this.chatsLoadedCallback(chats);
      this.chatsLoadedCallback = null; // Clear callback after use
    }

    // Also update the old UI method for backward compatibility
    const chatList = document.querySelector(".chat-list");
    if (!chatList) return;

    // Clear existing chats
    chatList.innerHTML = "";

    chats.forEach((chat) => {
      this.addChatToList(chat);
    });
  }

  addChatToList(chat) {
    const chatList = document.querySelector(".chat-list");
    if (!chatList) return;

    const chatElement = document.createElement("div");
    chatElement.className = "chat-item";
    chatElement.setAttribute("data-chat-id", chat._id);
    chatElement.innerHTML = `
      <div class="chat-content">
        <div class="chat-header-info">
          <h4 class="chat-name">${chat.name}</h4>
          <span class="chat-time">${this.formatTime(chat.lastActivity)}</span>
        </div>
        <div class="chat-preview">
          <p class="last-message">${
            chat.lastMessage ? chat.lastMessage.content : "No messages yet"
          }</p>
        </div>
      </div>
    `;

    chatElement.addEventListener("click", () => {
      this.loadMessages(chat._id);
      // Update active chat
      document.querySelectorAll(".chat-item").forEach((item) => {
        item.classList.remove("active");
      });
      chatElement.classList.add("active");
    });

    chatList.appendChild(chatElement);
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  escapeHtml(text) {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(
          `Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
        );
        this.connect(window.currentUser);
      }, 2000 * this.reconnectAttempts);
    }
  }

  handleChatCreated(data) {
    const { chat, creator } = data;

    // Show success notification
    if (typeof showNotification !== "undefined") {
      showNotification("New conversation created!", "success");
    }

    // Refresh the chat list to include the new chat
    if (typeof loadChatList !== "undefined") {
      loadChatList();
    }

    // Auto-select the new chat if it was created by current user
    if (creator.user_id === window.currentUser.user_id) {
      setTimeout(() => {
        this.currentChatId = chat._id;
        // Load messages for the new chat
        this.loadMessages(chat._id);

        // Select the chat in the UI
        const chatElement = document.querySelector(
          `[data-chat-id="${chat._id}"]`
        );
        if (chatElement) {
          chatElement.click();
        }
      }, 500);
    }
  }
}

// Initialize WebSocket connection
let chatWS = null;

function initializeChatWebSocket(userData, serverUrl) {
  chatWS = new ChatWebSocket(serverUrl, userData.token);
  chatWS.connect(userData);

  // Set page context
  chatWS.isInChatPage = window.location.pathname.includes("/chat");

  // Get current chat ID from URL or page context
  const urlParams = new URLSearchParams(window.location.search);
  chatWS.currentChatId = urlParams.get("chatId");
}

function initializeWebSocket() {
  if (typeof window.currentUser !== "undefined" && window.currentUser) {
    const serverUrl = "http://localhost:3000";
    initializeChatWebSocket(window.currentUser, serverUrl);
  } else {
    console.log("WebSocket initialization skipped: No user data available");
  }
}

// Make functions globally available immediately
window.initializeChatWebSocket = initializeChatWebSocket;
window.initializeWebSocket = initializeWebSocket;
window.ChatWebSocket = ChatWebSocket;

// Also make it available for immediate use
if (typeof window !== "undefined") {
  window.chatWS = chatWS;
}

export { ChatWebSocket, initializeChatWebSocket, initializeWebSocket, chatWS };
