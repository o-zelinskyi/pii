class ChatWebSocket {
  constructor(serverUrl, userToken) {
    this.serverUrl = serverUrl;
    this.userToken = userToken;
    this.socket = null;
    this.currentChatId = null;
    this.isInChatPage = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.isAuthenticated = false;
  }
  // Helper function to safely format timestamps for notifications
  safeFormatTimestamp(timestamp) {
    if (!timestamp) {
      console.warn("No timestamp provided to safeFormatTimestamp");
      return "recently";
    }

    console.log(
      "safeFormatTimestamp received:",
      timestamp,
      "type:",
      typeof timestamp
    );

    const date = new Date(timestamp);

    // Check if the date is valid
    if (isNaN(date.getTime())) {
      console.warn(
        "Invalid timestamp provided to safeFormatTimestamp:",
        timestamp
      );
      return "recently";
    }

    const formatted = date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    console.log("Formatted timestamp:", formatted);
    return formatted;
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

      // Send initial online status
      this.sendStatusUpdate("online", this.currentChatId);
    });

    this.socket.on("disconnect", () => {
      console.log("Disconnected from chat server");
      this.handleReconnection();
    });

    this.setupEventListeners();
    this.setupActivityTracking();
  }
  setupEventListeners() {
    // New message received
    this.socket.on("newMessage", (data) => {
      this.handleNewMessage(data);
    }); // User online/offline status with enhanced details
    this.socket.on("userOnline", (user) => {
      console.log("WS: User came online:", user);
      this.updateUserStatus(user.user_id, true, user);
    });

    this.socket.on("userOffline", (user) => {
      console.log("WS: User went offline:", user);
      this.updateUserStatus(user.user_id, false, user);
    }); // Handle user status changes (real-time status updates)
    this.socket.on("userStatusChanged", (data) => {
      console.log("WS: User status changed:", data);
      const { user_id, status, chatId } = data;

      // Determine if user is online based on status
      const isOnline = status === "online" || status === "active";

      // Create user details object for status update
      const userDetails = {
        user_id: user_id,
        status: status,
        lastSeen: isOnline ? new Date() : new Date(),
        currentChatId: chatId,
      };

      // For better status updates, try to get more complete user information
      // from active user data or from chat participants
      const activeChatItem = document.querySelector(".chat-item.active");
      if (activeChatItem && activeChatItem.dataset.participants) {
        try {
          const participants = JSON.parse(activeChatItem.dataset.participants);
          const participant = participants.find((p) => p.user_id === user_id);
          if (participant) {
            userDetails.firstname =
              participant.firstname || userDetails.firstname;
            userDetails.lastname = participant.lastname || userDetails.lastname;
          }
        } catch (e) {
          console.warn("Could not parse participants data:", e);
        }
      }

      this.updateUserStatus(user_id, isOnline, userDetails);
    });

    // Typing indicators
    this.socket.on("userTyping", (data) => {
      this.showTypingIndicator(data);
    }); // Chat loaded
    this.socket.on("chatsLoaded", (chats) => {
      // When chats are loaded, it means authentication was successful
      this.isAuthenticated = true;
      this.loadUserChats(chats);
    });

    // Messages loaded
    this.socket.on("messagesLoaded", (data) => {
      this.displayMessages(data.messages, data.chatId);
    });

    // Chat created
    this.socket.on("chatCreated", (data) => {
      this.handleChatCreated(data);
    }); // Listen for chat name updates
    this.socket.on("chatNameUpdated", (data) => {
      this.handleChatNameUpdated(data);
    });

    // Listen for errors
    this.socket.on("error", (data) => {
      this.handleError(data);
    }); // Listen for user added to chat
    this.socket.on("userAddedToChat", (data) => {
      this.handleUserAddedToChat(data);
    });

    // Listen for unread notifications when user connects
    this.socket.on("unreadNotifications", (data) => {
      this.handleUnreadNotifications(data);
    }); // Handle connection events for better authentication tracking
    this.socket.on("connect", () => {
      console.log("WebSocket connected successfully");
      this.isAuthenticated = false; // Reset authentication status
    });

    this.socket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      this.isAuthenticated = false;
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

    notification.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // Hide notification window first
      const notificationWindow = document.querySelector(".notification-window");
      if (notificationWindow) {
        notificationWindow.classList.remove("show");
      }

      // Load the specific chat
      console.log(`Loading chat with ID: ${message.chat_id}`);
      if (typeof window.loadChat === "function") {
        window.loadChat(message.chat_id);
      } else {
        // Fallback to navigation if loadChat function is not available
        console.warn(
          "loadChat function not available, falling back to navigation"
        );
        window.location.href = `${window.urlRoot || ""}/chats/messages?chatId=${
          message.chat_id
        }`;
      }
    });

    // Add to notification window (popup)
    this.addToNotificationWindow(notification);

    // Also add to the header notification dropdown
    this.addToHeaderNotifications(message, sender);
  }

  // Notification method for WebSocket events
  showNotification(message, type = "info") {
    if (typeof window.showNotification === "function") {
      window.showNotification(message, type);
    } else {
      console.log(`Notification: ${message} (${type})`);
    }
  }
  addToNotificationWindow(notification) {
    let notificationWindow = document.querySelector(".notification-window");
    if (!notificationWindow) {
      // Create notification window if it doesn't exist      notificationWindow = document.createElement("div");
      notificationWindow.className = "notification-window";
      document.body.appendChild(notificationWindow);
    } // Add notification to window
    notificationWindow.appendChild(notification);
    notificationWindow.classList.add("show");

    // Store reference to timeout for potential clearing
    const timeoutId = setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
      if (notificationWindow.children.length === 0) {
        notificationWindow.classList.remove("show");
      }
    }, 10000); // Increased to 10 seconds for better UX

    // Allow manual closing of individual notifications
    notification.addEventListener("click", () => {
      clearTimeout(timeoutId);
    });
  }

  addMessageToChat(message, sender) {
    // This function should be implemented in chat.js or similar,
    // and called from here if messages are directly added.
    // For now, displayMessages handles rendering full lists.
    console.log(
      "addMessageToChat called in websocket-client, ideally delegate to UI script",
      message,
      sender
    );
    if (typeof window.addMessage === "function") {
      // Assuming window.addMessage is the function from chat.js
      // and it can determine if the message is from self based on sender.user_id
      const isSelf = sender.user_id === window.currentUser.user_id;
      window.addMessage(message.content, isSelf, message.timestamp, sender);
    } else {
      console.warn(
        "window.addMessage function not found for dynamically adding a single message."
      );
    }
  }

  sendMessage(chatId, content, messageType = "text") {
    if (!this.socket || !this.socket.connected) {
      console.error("Socket not connected. Unable to send message:", {
        chatId,
        content,
        messageType,
      });
      return;
    }

    this.socket.emit("sendMessage", {
      chatId,
      content,
      messageType,
    });
  }
  loadMessages(chatId) {
    if (this.socket && this.socket.connected) {
      if (!this.isAuthenticated) {
        console.log(
          "WebSocket connected but not authenticated, waiting for authentication"
        );
        // Wait for authentication then retry
        setTimeout(() => {
          if (this.isAuthenticated) {
            this.currentChatId = chatId;
            this.socket.emit("loadMessages", { chatId });
          } else {
            console.error("Authentication timeout, trying to reconnect");
            this.handleAuthenticationFailure(chatId);
          }
        }, 2000);
        return;
      }

      this.currentChatId = chatId;
      this.socket.emit("loadMessages", { chatId });
    } else {
      console.error("WebSocket not connected when trying to load messages");
      this.handleAuthenticationFailure(chatId);
    }
  }

  // Handle authentication failures
  handleAuthenticationFailure(chatId) {
    if (window.currentUser && !this.socket?.connected) {
      console.log("Attempting to reconnect WebSocket for message loading");
      this.connect(window.currentUser);
      // Wait a bit for connection and authentication then retry
      setTimeout(() => {
        if (this.socket && this.socket.connected && this.isAuthenticated) {
          this.currentChatId = chatId;
          this.socket.emit("loadMessages", { chatId });
        } else {
          console.error("Failed to reconnect and authenticate, showing error");
          if (typeof window.showNotification === "function") {
            window.showNotification(
              "Unable to connect to chat server. Please refresh the page.",
              "error"
            );
          }
        }
      }, 3000);
    }
  }
  createChat(chatPayload) {
    if (this.socket && chatPayload) {
      // Ensure we don't include creator in participants list
      let participants = (chatPayload.participants || []).map((id) =>
        parseInt(id)
      );
      const currentUserId = window.currentUser
        ? parseInt(window.currentUser.user_id)
        : null;

      // Remove creator from participants to prevent duplication (double check)
      if (currentUserId) {
        participants = participants.filter((id) => id !== currentUserId);
      }

      // Additional check: remove any duplicates in the participants list
      participants = [...new Set(participants)];

      const payloadToSend = {
        name: chatPayload.name,
        participants: participants,
        isGroup: chatPayload.is_group,
      };

      // Basic validation for participants
      if (!Array.isArray(payloadToSend.participants)) {
        console.error(
          "WebSocket: createChat - participants must be an array:",
          chatPayload
        );
        if (typeof showNotification === "function") {
          showNotification("Error: Invalid data for creating chat.", "error");
        }
        return;
      }

      console.log("WebSocket: Creating chat with payload:", payloadToSend);
      console.log("Participants count:", payloadToSend.participants.length);
      console.log("Current user ID:", currentUserId);
      this.socket.emit("createChat", payloadToSend);
    } else {
      console.error(
        "WebSocket: createChat - socket not available or chatPayload is missing"
      );
    }
  }
  updateUserStatus(userId, isOnline, userDetails = null) {
    console.log(
      `Updating status for user ${userId}: ${isOnline ? "online" : "offline"}`,
      userDetails
    );

    // Update user status in the UI
    const userElements = document.querySelectorAll(
      `[data-user-id="${userId}"]`
    );

    console.log(
      `Found ${userElements.length} elements with data-user-id="${userId}"`
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

    // Update status indicators in chat list for 1-on-1 chats with this user
    this.updateChatListStatusForUser(userId, isOnline, userDetails);

    // Update chat header status if this is the current chat participant
    if (userDetails && this.currentChatId) {
      console.log(
        `Updating chat header status for current chat: ${this.currentChatId}`
      );
      this.updateChatHeaderStatus(userId, isOnline, userDetails);
    } else {
      console.log(
        `Not updating chat header - userDetails: ${!!userDetails}, currentChatId: ${
          this.currentChatId
        }`
      );
    }
  }

  // Helper function to update chat list status indicators for a specific user
  updateChatListStatusForUser(userId, isOnline, userDetails = null) {
    const currentUserId = window.currentUser?.user_id;
    if (!currentUserId) return;

    // Find all 1-on-1 chat items that involve this user
    const chatItems = document.querySelectorAll(
      '.chat-item:not([data-is-group="true"])'
    );

    chatItems.forEach((chatItem) => {
      const chatId = chatItem.dataset.chatId;

      // Check if this chat involves the user whose status changed
      // We'll need to check against the chat name or stored participant data
      const chatName = chatItem.dataset.dbName;
      const userFullName = userDetails
        ? `${userDetails.firstname} ${userDetails.lastname}`
        : null;

      // For 1-on-1 chats, the chat name should contain the other user's name
      if (userFullName && chatName && chatName.includes(userFullName)) {
        const statusIndicator = chatItem.querySelector(".status-indicator");
        if (statusIndicator) {
          statusIndicator.classList.remove("online", "offline");
          statusIndicator.classList.add(isOnline ? "online" : "offline");

          console.log(
            `Updated chat list status indicator for user ${userId} in chat "${chatName}" to ${
              isOnline ? "online" : "offline"
            }`
          );
        }
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

    // Add messages - need to get real sender data for each message
    messages.forEach((message) => {
      // Get sender info from the message or use fallback
      const sender = {
        user_id: message.sender_id,
        firstname: message.senderName || "User",
        lastname: message.senderLastname || "",
      };

      this.addMessageToChat(message, sender);
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
  // Helper function to determine if a chat should show online status
  getChatOnlineStatus(chat) {
    if (!chat) return false;

    // For group chats, don't show online status
    if (chat.is_group_chat || chat.isGroup) {
      return false;
    }

    // For 1-on-1 chats, check if the other user is online
    if (chat.participants && chat.participants.length === 2) {
      const currentUserId = window.currentUser?.user_id;
      const otherUser = chat.participants.find(
        (p) => p.user_id !== currentUserId
      );
      if (otherUser && window.onlineUsers) {
        return window.onlineUsers.has(otherUser.user_id.toString());
      }
    }

    return false;
  }

  addChatToList(chat) {
    const chatListContainer = document.getElementById("chatListContainer");
    if (!chatListContainer) {
      console.error("Chat list container not found.");
      return;
    }

    // Hide "No conversations yet" message
    const noChatMessage = document.getElementById("noChatMessage");
    if (noChatMessage) {
      noChatMessage.style.display = "none";
    }

    const chatElement = document.createElement("li");
    chatElement.className = "chat-item";
    chatElement.dataset.chatId = chat._id; // Use chat._id from MongoDB
    chatElement.dataset.isGroup = chat.is_group_chat || chat.isGroup; // Store if it's a group chat

    // Server already handles proper chat name generation for 1-on-1 chats
    // Trust the server's chat name which includes user names for 1-on-1 chats
    let chatNameToDisplay = chat.name || "Unnamed Chat";
    let lastMessageText = chat.lastMessage?.content || "No messages yet";
    let lastMessageTime =
      chat.lastMessage?.createdAt || chat.lastMessage?.timestamp
        ? this.formatTime(
            chat.lastMessage.createdAt || chat.lastMessage.timestamp
          )
        : "";

    chatElement.dataset.dbName = chatNameToDisplay; // Set dbName to the determined display name

    const isOnline = this.getChatOnlineStatus(chat);
    const statusClass = isOnline ? "online" : "offline";

    chatElement.innerHTML = `
      <div class="chat-avatar">
        <div class="status-indicator ${statusClass}"></div>
      </div>
      <div class="chat-info">
        <div class="chat-header-info">
          <h3 class="chat-name">${this.escapeHtml(chatNameToDisplay)}</h3>
          <span class="chat-time">${lastMessageTime}</span>
        </div>
        <div class="chat-preview">
          <p class="last-message">${this.escapeHtml(lastMessageText)}</p>
          <div class="chat-badges">
            <span class="unread-badge" style="display: none;">0</span>
          </div>
        </div>
      </div>
    `;

    chatListContainer.prepend(chatElement); // Add to the top of the list
  }
  formatTime(timestamp) {
    return this.safeFormatTimestamp(timestamp) || "";
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
    console.log("Handling chatCreated:", data);
    if (data && data.chat) {
      this.addChatToList(data.chat); // Adds the new chat to the DOM

      // The event listener delegation in chat.js will handle clicks on the new item.
      // No need to call updateChatList from ChatList.js here for just adding,
      // unless ChatList.js's internal state needs explicit updating for other features (e.g., filtering).
      // If ChatList.js maintains an internal 'this.chats' map that's used elsewhere,
      // you might need a method like window.chatList.addChatToMap(data.chat);

      // If the user who created the chat is the current user,
      // you might want to automatically "click" or activate this new chat.
      if (
        data.creator_id === (window.currentUser && window.currentUser.user_id)
      ) {
        const newChatItem = document.querySelector(
          `.chat-item[data-chat-id="${data.chat._id}"]`
        );
        if (newChatItem) {
          // Simulate a click or directly call the activation logic
          // newChatItem.click(); // This would trigger the event listener in chat.js
          console.log(
            "New chat created by current user, consider auto-selecting it.",
            data.chat._id
          );
        }
      }
    } else {
      console.error("chatCreated event received with invalid data:", data);
    }
  }

  showTypingIndicator(data) {
    const { user_id, firstname, lastname, isTyping } = data;

    // Only show if it's not the current user and they're in the same chat
    if (user_id === window.currentUser.user_id) return;

    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    const typingId = `typing-${user_id}`;
    let typingIndicator = document.getElementById(typingId);

    if (isTyping) {
      if (!typingIndicator) {
        typingIndicator = document.createElement("div");
        typingIndicator.id = typingId;
        typingIndicator.className = "typing-indicator";
        typingIndicator.innerHTML = `
          <div class="typing-content">
            <span class="typing-text">${firstname} ${lastname} is typing</span>
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        `;
        chatMessages.appendChild(typingIndicator);
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    } else {
      if (typingIndicator) {
        typingIndicator.remove();
      }
    }
  }

  updateChatList(chatId) {
    // Update chat list when new message arrives
    if (
      typeof window.chatList !== "undefined" &&
      window.chatList.updateChatList
    ) {
      window.chatList.updateChatList(chatId);
    }
  }

  updateChatName(chatId, newName) {
    if (this.socket && this.socket.connected) {
      console.log(
        `WS: Emitting updateChatName for chatId: ${chatId}, newName: ${newName}`
      );
      this.socket.emit("updateChatName", { chatId, newName });
    } else {
      console.error("Socket not connected. Unable to update chat name.");
      if (typeof showNotification === "function") {
        showNotification(
          "Error: Disconnected from server. Cannot update chat name.",
          "error"
        );
      }
      // Attempt to revert UI using the new cleanup function if socket is disconnected
      const editChatNameBtn = document.getElementById("edit-chat-name-btn");
      if (editChatNameBtn && editChatNameBtn.dataset.chatId === chatId) {
        const originalName = editChatNameBtn.dataset.currentName;
        console.warn(
          "Socket disconnected, reverting UI to original name:",
          originalName
        );
        if (
          window.chatApp &&
          typeof window.chatApp.cleanupEditUI === "function"
        ) {
          window.chatApp.cleanupEditUI(true, originalName);
        } else {
          console.error(
            "cleanupEditUI function not found on window.chatApp for reverting UI on disconnected socket."
          );
          // Fallback to direct DOM manipulation if cleanupEditUI is not available for some reason
          const headerNameH3 = document.querySelector(
            ".chat-details h3#chat-name"
          );
          if (headerNameH3) headerNameH3.textContent = originalName;
          const inputField = document.querySelector(
            "input.edit-chat-name-input"
          );
          const saveBtn = document.querySelector("button.save-chat-name-btn");
          const cancelBtn = document.querySelector(
            "button.cancel-chat-name-btn"
          );
          if (inputField) inputField.remove();
          if (saveBtn) saveBtn.remove();
          if (cancelBtn) cancelBtn.remove();
          if (headerNameH3) headerNameH3.style.display = "";
          if (editChatNameBtn) editChatNameBtn.style.display = "inline-block";
        }
      }
    }
  }
  updateChatHeaderStatus(userId, isOnline, userDetails) {
    // Only update if we're in a 1-on-1 chat with this user
    const headerStatus = document.querySelector(".chat-details .status");
    if (!headerStatus) return;

    // Get the current active chat item to check if it's a 1-on-1 chat with this user
    const activeChatItem = document.querySelector(".chat-item.active");
    if (!activeChatItem) return;

    const isGroupChat = activeChatItem.dataset.isGroup === "true";
    if (isGroupChat) return; // Don't update status for group chats

    // Check if this user is the other participant in the current 1-on-1 chat
    // For 1-on-1 chats, check if the chat name contains the user's full name
    const chatName = activeChatItem.querySelector(".chat-name")?.textContent;
    const userFullName = `${userDetails.firstname} ${userDetails.lastname}`;

    console.log(`Checking status update for user ${userId}:`, {
      chatName,
      userFullName,
      firstname: userDetails.firstname,
      lastname: userDetails.lastname,
      isOnline,
    });

    // Check if the chat name contains either the full name or parts of it
    if (
      chatName &&
      (chatName.includes(userFullName) ||
        (chatName.includes(userDetails.firstname) &&
          chatName.includes(userDetails.lastname)))
    ) {
      if (isOnline) {
        headerStatus.textContent = "Online";
        headerStatus.style.color = "#28a745"; // Green color for online
        console.log(`Updated header status to Online for user ${userId}`);
      } else {
        const lastSeenTime = this.formatLastSeenTime(userDetails.lastSeen);
        headerStatus.textContent = `Last seen ${lastSeenTime}`;
        headerStatus.style.color = "#6c757d"; // Gray color for offline
        console.log(`Updated header status to offline for user ${userId}`);
      }
    } else {
      console.log(
        `Chat name "${chatName}" does not match user "${userFullName}"`
      );
    }
  }
  formatLastSeenTime(lastSeenDate) {
    if (!lastSeenDate) return "recently";

    const now = new Date();
    const lastSeen = new Date(lastSeenDate);

    // Check if the date is valid
    if (isNaN(lastSeen.getTime())) {
      console.warn(
        "Invalid lastSeenDate provided to formatLastSeenTime:",
        lastSeenDate
      );
      return "recently";
    }

    const diffMs = now - lastSeen;
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMinutes < 1) {
      return "just now";
    } else if (diffMinutes < 60) {
      return `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return `${diffDays}d ago`;
    } else {
      return lastSeen.toLocaleDateString();
    }
  }

  handleChatNameUpdated(data) {
    const { chatId, newName } = data;
    console.log(
      `WS: Received chatNameUpdated: chatId=${chatId}, newName=${newName}. Delegating to chat.js for UI update.`
    );

    if (
      typeof window.chatApp !== "undefined" &&
      typeof window.chatApp.handleChatNameUpdatedInUI === "function"
    ) {
      window.chatApp.handleChatNameUpdatedInUI(chatId, newName);
    } else {
      console.error(
        "CRITICAL: window.chatApp.handleChatNameUpdatedInUI is not defined. Chat name UI will not update correctly."
      );
      // Minimal fallback to ensure some update if chat.js is not behaving as expected.
      // This is a safety net and ideally should not be hit if chat.js is correct.
      const chatListItem = document.querySelector(
        `.chat-item[data-chat-id="${chatId}"]`
      );
      if (chatListItem) {
        const chatNameElement = chatListItem.querySelector(".chat-name");
        if (chatNameElement) chatNameElement.textContent = newName;
        chatListItem.dataset.dbName = newName; // Also update dbName for consistency
      }
      // Update chat header if this is the currently active chat
      // Note: this.currentChatId needs to be reliably set for this fallback to work.
      if (this.currentChatId === chatId) {
        const headerNameH3 = document.querySelector(
          ".chat-details h3#chat-name"
        );
        if (headerNameH3) {
          headerNameH3.textContent = newName;
        }
      }
    }
  }

  handleError(data) {
    const { message } = data;
    console.error("WS: Received error from server:", message);

    // Show error notification to user
    if (typeof showNotification === "function") {
      showNotification(`Server error: ${message}`, "error");
    }

    // Check if this is a chat name update error and revert the UI
    if (message && message.toLowerCase().includes("chat name")) {
      const editChatNameBtn = document.getElementById("edit-chat-name-btn");
      const chatDetails = document.querySelector(".chat-details");
      const inputField = chatDetails
        ? chatDetails.querySelector("input.edit-chat-name-input")
        : null;

      // If the edit UI is currently open, revert to the original name
      if (inputField && editChatNameBtn) {
        const originalName = editChatNameBtn.dataset.currentName;
        console.log(
          "WS: Chat name update failed, reverting UI to original name:",
          originalName
        );

        if (
          window.chatApp &&
          typeof window.chatApp.cleanupEditUI === "function"
        ) {
          window.chatApp.cleanupEditUI(true, originalName);
        }
      }
    }
  }

  // Method to send typing notification
  sendTypingNotification(chatId, isTyping) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("userTyping", { chatId, isTyping });
    }
  }

  addUserToChat(chatId, userId) {
    if (this.socket && chatId && userId) {
      const payloadToSend = {
        chatId: chatId,
        userId: parseInt(userId),
      };

      console.log(
        "WebSocket: Adding user to chat with payload:",
        payloadToSend
      );
      this.socket.emit("addUserToChat", payloadToSend);
    } else {
      console.error("WebSocket: addUserToChat - missing required parameters");
    }
  }
  handleUserAddedToChat(data) {
    const { chatId, userId, addedBy } = data;
    console.log(`User ${userId} was added to chat ${chatId} by ${addedBy}`);

    // Refresh chat list to show updated participant count
    this.refreshUserChats();

    // Show notification
    if (this.currentChatId !== chatId) {
      if (typeof showNotification === "function") {
        showNotification(`A user was added to a group chat`, "info");
      }
    } else {
      // Update current chat interface
      if (typeof showNotification === "function") {
        showNotification(`New user added to the chat`, "success");
      }
      // Reload messages to refresh participant info
      if (typeof this.loadMessages === "function") {
        this.loadMessages(chatId);
      }
    }
  }

  // Method to refresh user chats by requesting from server
  refreshUserChats() {
    if (this.socket) {
      this.socket.emit("getUserChats");
    }
  } // Add a notification to the header notification dropdown
  addToHeaderNotifications(message, sender) {
    console.log("addToHeaderNotifications called with:", { message, sender });

    // Find the header notification content
    const notificationContent = document.getElementById("notification-content");
    if (!notificationContent) {
      console.warn("notification-content element not found");
      return;
    }

    // Remove the "no notifications" message if it exists
    const noNotifications = document.getElementById("no-notifications");
    if (noNotifications) {
      noNotifications.style.display = "none";
    }

    // Create a new notification item
    const notificationItem = document.createElement("div");
    notificationItem.className = "notification-item";
    notificationItem.dataset.chatId = message.chat_id;

    // Store notification ID if available for persistent notifications
    if (message.notification_id) {
      notificationItem.dataset.notificationId = message.notification_id;
    }

    // Format timestamp using safe formatting function
    const formattedTime = this.safeFormatTimestamp(
      message.createdAt || message.timestamp
    );

    notificationItem.innerHTML = `
      <div class="notification-item-content">
        <div class="notification-item-header">
          <strong>${sender.firstname} ${sender.lastname}</strong>
          <span class="notification-time">${formattedTime}</span>
        </div>
        <div class="notification-message-preview">
          ${message.content.substring(0, 50)}${
      message.content.length > 50 ? "..." : ""
    }
        </div>
      </div>
    `;

    // Add click handler to navigate to the chat
    notificationItem.addEventListener("click", () => {
      console.log("Notification clicked for chat:", message.chat_id);

      // Mark this notification as read if it has a notification ID
      if (notificationItem.dataset.notificationId) {
        this.markNotificationsAsRead([notificationItem.dataset.notificationId]);
      }

      // Remove the notification from the dropdown
      notificationItem.remove();

      // Hide the notification dropdown
      const notificationWindow = document.querySelector(".notification-window");
      if (notificationWindow) {
        notificationWindow.classList.remove("show");
      }

      // Update notification count after removal
      this.updateNotificationCount(); // Navigate to the chat - ensure proper authentication
      this.navigateToChat(message.chat_id);
    });

    // Add to the notification content (at the top)
    notificationContent.insertBefore(
      notificationItem,
      notificationContent.firstChild
    );

    // Update notification count
    this.updateNotificationCount();
  }
  // Handle unread notifications received when user connects
  handleUnreadNotifications(data) {
    console.log("Received unread notifications:", data);

    const { notifications, count } = data;

    if (count > 0) {
      // Show notifications in header dropdown
      notifications.forEach((notification) => {
        const messageData = {
          chat_id: notification.chat_id._id,
          content: notification.content,
          createdAt: notification.createdAt,
          timestamp: notification.createdAt,
          notification_id: notification._id, // Add notification ID for tracking
        };

        this.addToHeaderNotifications(messageData, notification.sender);
      });

      // Show a summary notification
      if (typeof window.showNotification === "function") {
        window.showNotification(
          `You have ${count} unread message${
            count > 1 ? "s" : ""
          } from when you were offline`,
          "info"
        );
      }

      // Update notification badge
      this.updateNotificationCount();

      console.log(`Displayed ${count} unread notifications`);
    }
  }

  // Mark notifications as read (can be called when user views them)
  async markNotificationsAsRead(notificationIds = null, markAll = false) {
    if (!window.currentUser?.user_id) return;

    try {
      const response = await fetch(
        `http://localhost:3000/api/notifications/${window.currentUser.user_id}/mark-read`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            notificationIds: notificationIds,
            markAll: markAll,
          }),
        }
      );

      const result = await response.json();
      if (result.success) {
        console.log(`Marked ${result.modifiedCount} notifications as read`);
      }
    } catch (error) {
      console.error("Error marking notifications as read:", error);
    }
  }
  // Navigate to chat with proper authentication handling
  navigateToChat(chatId) {
    console.log(`Navigating to chat ${chatId} with authentication check`);

    // Ensure we have proper authentication
    if (!this.socket || !this.socket.connected) {
      console.log(
        "WebSocket not connected, attempting to reconnect before navigation"
      );
      if (window.currentUser) {
        this.connect(window.currentUser);
        // Wait for connection then navigate
        setTimeout(() => {
          this.performNavigation(chatId);
        }, 1000);
      } else {
        console.error("No user data available for authentication");
        this.performNavigation(chatId); // Try anyway
      }
    } else {
      this.performNavigation(chatId);
    }
  }

  // Perform the actual navigation
  performNavigation(chatId) {
    if (typeof window.loadChat === "function") {
      console.log("Using window.loadChat to navigate to chat");
      window.loadChat(chatId);
    } else {
      // Fallback to navigation if loadChat is not available
      console.log("Fallback navigation to chat messages page");
      window.location.href = `${
        window.urlRoot || ""
      }/chats/messages?chatId=${chatId}`;
    }
  }

  // Update the notification count badge
  updateNotificationCount() {
    const notificationCount = document.querySelector(".notification-count");
    if (!notificationCount) return;

    const notificationContent = document.getElementById("notification-content");
    if (!notificationContent) return;

    const count =
      notificationContent.querySelectorAll(".notification-item").length;

    if (count > 0) {
      notificationCount.textContent = count;
      notificationCount.style.display = "block";
    } else {
      notificationCount.style.display = "none";
    }
  }

  // Method to send status updates to server
  sendStatusUpdate(status, chatId = null) {
    if (this.socket && this.socket.connected) {
      console.log(`Sending status update: ${status}, chatId: ${chatId}`);
      this.socket.emit("updateStatus", {
        status: status,
        chatId: chatId,
      });
    } else {
      console.warn("Cannot send status update: socket not connected");
    }
  }

  // Method to automatically update status when user becomes active/inactive
  updateUserActivity(isActive = true) {
    const status = isActive ? "online" : "away";
    this.sendStatusUpdate(status, this.currentChatId);
  }

  // Setup activity tracking to automatically update user status
  setupActivityTracking() {
    let lastActivity = Date.now();
    let isIdle = false;
    const IDLE_THRESHOLD = 5 * 60 * 1000; // 5 minutes
    const ACTIVITY_CHECK_INTERVAL = 30 * 1000; // 30 seconds

    // Activity events to track
    const activityEvents = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
    ];

    // Update activity timestamp
    const updateActivity = () => {
      lastActivity = Date.now();
      if (isIdle) {
        isIdle = false;
        console.log("User is active again");
        this.updateUserActivity(true);
      }
    };

    // Add event listeners for activity
    activityEvents.forEach((event) => {
      document.addEventListener(event, updateActivity, true);
    });

    // Check for idle status periodically
    setInterval(() => {
      const timeSinceLastActivity = Date.now() - lastActivity;

      if (!isIdle && timeSinceLastActivity > IDLE_THRESHOLD) {
        isIdle = true;
        console.log("User is idle");
        this.updateUserActivity(false);
      }
    }, ACTIVITY_CHECK_INTERVAL);

    // Track page visibility changes
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) {
        console.log("Page is hidden");
        this.sendStatusUpdate("away", this.currentChatId);
      } else {
        console.log("Page is visible");
        this.updateUserActivity(true);
        lastActivity = Date.now();
        isIdle = false;
      }
    });

    // Handle window focus/blur
    window.addEventListener("focus", () => {
      this.updateUserActivity(true);
      lastActivity = Date.now();
      isIdle = false;
    });

    window.addEventListener("blur", () => {
      this.sendStatusUpdate("away", this.currentChatId);
    });
  }
}

// Initialize WebSocket connection
let chatWS = null;

function initializeChatWebSocket(userData, serverUrl) {
  chatWS = new ChatWebSocket(serverUrl, userData.token);
  chatWS.connect(userData);

  // Assign the instance to window.chatWS here
  if (typeof window !== "undefined") {
    window.chatWS = chatWS;
  }

  // Set page context - fix: check for "/chats" not "/chat"
  chatWS.isInChatPage = window.location.pathname.includes("/chats");

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
window.ChatWebSocket = ChatWebSocket;

// Legacy function name support
function initializeWebSocket(userData, serverUrl) {
  return initializeChatWebSocket(userData, serverUrl);
}
window.initializeWebSocket = initializeWebSocket;
