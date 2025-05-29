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
      window.location.href = `/chat?chatId=${message.chat_id}`;
    });

    // Add to notification window
    this.addToNotificationWindow(notification);
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
