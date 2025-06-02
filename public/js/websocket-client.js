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
    }); // Listen for chat name updates
    this.socket.on("chatNameUpdated", (data) => {
      this.handleChatNameUpdated(data);
    });

    // Listen for errors
    this.socket.on("error", (data) => {
      this.handleError(data);
    });

    // Listen for initial state from server (e.g., total unread count)
    this.socket.on("initialSessionState", (data) => {
      this.handleInitialSessionState(data);
    });

    // Listen for user added to chat
    this.socket.on("userAddedToChat", (data) => {
      if (data && data.chat) {
        this.handleChatNameUpdated({
          chatId: data.chat._id,
          newName: data.chat.name,
        });
        this.addChatToList(data.chat);
      }
    });
  }

  handleInitialSessionState(data) {
    if (data && typeof data.totalUnreadCount !== "undefined") {
      console.log(
        "WS: Received initialSessionState with unread count:",
        data.totalUnreadCount
      );
      this.updateNotificationBell(data.totalUnreadCount);
      if (data.totalUnreadCount > 0) {
        // Animate bell if there are unread messages on load
        this.animateBellIcon();
      }
    } else {
      console.warn(
        "WS: Received initialSessionState without totalUnreadCount or invalid data:",
        data
      );
    }
  }
  handleNewMessage(data) {
    const { message, sender, unreadCount } = data; // Expect unreadCount from server
    console.log("WS: Received newMessage", JSON.stringify(data, null, 2));

    // Determine current page and chat context
    const isOnChatPage = this.isInChatPage;
    const isInSameChat = isOnChatPage && this.currentChatId === message.chat_id;

    console.log(
      "WS: Page context - isOnChatPage:",
      isOnChatPage,
      "isInSameChat:",
      isInSameChat,
      "currentChatId:",
      this.currentChatId,
      "message.chat_id:",
      message.chat_id
    );

    // Update notification bell and count regardless of current page/chat
    console.log(
      "WS: Calling updateNotificationBell with unreadCount:",
      unreadCount
    );
    this.updateNotificationBell(unreadCount);

    // If user is on the chat page and in the specific chat for the new message
    if (isInSameChat) {
      // User is viewing the exact chat - add message but don't animate bell
      console.log(
        "WS: User in same chat. Adding message to chat, no bell animation."
      );
      this.addMessageToChat(message, sender);
      // Optionally, mark message as read immediately if user is active in chat
      // this.socket.emit("markAsRead", { chatId: message.chat_id, messageId: message._id });
    } else {
      // User is either:
      // 1. Not on chat page at all, OR
      // 2. On chat page but in a different chat
      // In both cases, animate bell and add to notification window
      console.log(
        "WS: User NOT in same chat or not on chat page. Attempting to animate bell and add notification."
      );
      this.animateBellIcon();
      this.addMessageToNotificationWindow(message, sender);
      console.log(
        "WS: User not in same chat - bell animated and notification added (expected)"
      );
    }

    // Update the chat list item (e.g., bold, unread count, last message)
    if (
      typeof window.chatList !== "undefined" &&
      window.chatList.updateChatItem
    ) {
      window.chatList.updateChatItem(message.chat_id, message, unreadCount);
    } else {
      console.warn("window.chatList.updateChatItem is not available.");
    }
  }

  animateBellIcon() {
    // Renamed from animateBellNotification
    const bellElement = document.querySelector(".notification-bell");
    if (bellElement) {
      bellElement.classList.add("animate-bell");
      setTimeout(() => {
        bellElement.classList.remove("animate-bell");
      }, 1000); // Duration of the bell ring animation
    } else {
      console.warn(
        "WS: .notification-bell element not found. Cannot animate bell."
      );
    }
  }

  updateNotificationBell(unreadCount) {
    const bellElement = document.querySelector(".notification-bell");
    const countElement = document.querySelector(".notification-count");

    if (bellElement && countElement) {
      if (unreadCount > 0) {
        countElement.textContent = unreadCount > 99 ? "99+" : unreadCount;
        countElement.style.display = "flex"; // Use flex for better centering if needed
        // No need to call animateBellIcon here, handleNewMessage decides when to animate
      } else {
        countElement.textContent = "0";
        countElement.style.display = "none";
      }
    }
  }

  addMessageToNotificationWindow(message, sender) {
    console.log(
      "WS: addMessageToNotificationWindow called with message:",
      JSON.stringify(message, null, 2),
      "sender:",
      JSON.stringify(sender, null, 2)
    );
    const notificationContent = document.getElementById("notification-content");
    if (!notificationContent) {
      console.error(
        "WS: CRITICAL - Notification content area (#notification-content) not found."
      );
      return;
    }
    console.log(
      "WS: Found #notification-content element:",
      notificationContent
    );

    // Remove "No new messages" placeholder if it exists
    const noNotificationsPlaceholder =
      notificationContent.querySelector(".no-notifications");
    if (noNotificationsPlaceholder) {
      console.log(
        "WS: Found .no-notifications placeholder:",
        noNotificationsPlaceholder
      );
      noNotificationsPlaceholder.style.display = "none";
    } else {
      console.warn("WS: .no-notifications placeholder not found.");
    }

    const notificationItem = document.createElement("div");
    notificationItem.className = "message-notification"; // Use existing class for styling
    notificationItem.dataset.chatId = message.chat_id;
    notificationItem.dataset.messageId = message._id; // Store message ID if needed later

    // Determine avatar: use sender's photo, or a default
    const avatarSrc =
      sender && sender.photo
        ? sender.photo
        : (window.urlRoot || "") + "/img/avatar.webp";

    notificationItem.innerHTML = `
      <div class="notification-item-avatar">
        <img src="${this.escapeHtml(avatarSrc)}" alt="${this.escapeHtml(
      sender.firstname
    )}">
      </div>
      <div class="notification-item-details">
        <div class="notification-item-sender">
          <strong>${this.escapeHtml(sender.firstname)} ${this.escapeHtml(
      sender.lastname
    )}</strong>
        </div>
        <div class="notification-item-preview">
          ${this.escapeHtml(message.content.substring(0, 50))}${
      message.content.length > 50 ? "..." : ""
    }
        </div>
        <div class="notification-item-time">
          ${this.formatTime(message.createdAt || message.timestamp)}
        </div>
      </div>
    `;

    notificationItem.addEventListener("click", () => {
      window.location.href = `${window.urlRoot || ""}/chats/messages?chatId=${
        message.chat_id
      }`;
      // Hide the notification window after click
      const notificationWindow = document.getElementById("notification-window");
      if (notificationWindow) {
        notificationWindow.style.display = "none";
      }
    });

    // Add to the top of the notification window's content area
    notificationContent.prepend(notificationItem);
    console.log("WS: Prepended notification item to #notification-content.");

    // Ensure the notification window is visible if it was hidden
    const notificationWindow = document.getElementById("notification-window");
    if (notificationWindow) {
      console.log(
        "WS: Found #notification-window element. Current display style:",
        notificationWindow.style.display
      );
      // Ensure the window is made visible. The original code mentioned this was tricky.
      // Forcing it to display 'block' or 'flex' might be necessary if it's 'none'.
      // Check how notification.js handles visibility.
      // if (notificationWindow.style.display === "none") {
      //   notificationWindow.style.display = "block"; // Or 'flex' depending on its usual display type
      //   console.log("WS: Set #notification-window display to 'block' (or 'flex').");
      // }
    } else {
      console.error("WS: CRITICAL - #notification-window element not found.");
    }
  }

  addMessageToChat(message, sender) {
    // This function should be implemented in chat.js or similar,
    // and called from here if messages are directly added.
    // For now, displayMessages handles rendering full lists.
    console.log(
      "addMessageToChat called in websocket-client, delegating to window.addMessage",
      message,
      sender
    );
    if (typeof window.addMessage === "function") {
      const isSelf =
        sender &&
        window.currentUser &&
        sender.user_id === window.currentUser.user_id;
      const senderFullName = sender
        ? `${sender.firstname || ""} ${sender.lastname || ""}`.trim()
        : null;
      const senderAvatar = sender ? sender.photo : null; // Assuming sender object has a 'photo' property

      // Use message.createdAt if available, otherwise message.timestamp
      const messageTimestamp = message.createdAt || message.timestamp;

      // Pass online status to addMessage if supported
      window.addMessage(
        message.content,
        isSelf,
        messageTimestamp,
        senderFullName,
        senderAvatar,
        sender.isOnline // Pass online status
      );
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
    if (this.socket) {
      this.currentChatId = chatId;
      this.socket.emit("loadMessages", { chatId });
      // Mark as read
      this.socket.emit("markAsRead", { chatId });
    }
  }

  createChat(chatPayload) {
    if (this.socket && chatPayload) {
      const payloadToSend = {
        name: chatPayload.name,
        participants: chatPayload.participants, // Ensure this is the array of participant IDs
        isGroup: chatPayload.is_group, // Map is_group (from client) to isGroup (for server)
        createdBy: window.currentUser ? window.currentUser.user_id : null, // Add createdBy
      };

      // Basic validation for participants
      if (
        !payloadToSend.participants ||
        !Array.isArray(payloadToSend.participants)
      ) {
        console.error(
          "WebSocket: createChat - participants array is missing or not an array in chatPayload:",
          chatPayload
        );
        if (typeof showNotification === "function") {
          showNotification("Error: Invalid data for creating chat.", "error");
        }
        return;
      }
      if (payloadToSend.createdBy === null) {
        console.error(
          "WebSocket: createChat - createdBy (currentUser.user_id) is null."
        );
        if (typeof showNotification === "function") {
          showNotification(
            "Error: Current user not identified for creating chat.",
            "error"
          );
        }
        // It might be appropriate to return here if createdBy is essential on the server
        // return;
      }

      this.socket.emit("createChat", payloadToSend);
    } else {
      console.error(
        "WebSocket: createChat - socket not available or chatPayload is missing"
      );
    }
  }

  // Add user to existing chat (group chat)
  addUserToChat(chatId, userIds) {
    if (this.socket && this.socket.connected) {
      this.socket.emit("addUserToChat", { chatId, userIds });
    }
  }

  updateUserStatus(userId, isOnline) {
    // Update user status in the UI
    const userElements = document.querySelectorAll(
      `[data-user-id="${userId}"]`
    );
    userElements.forEach((element) => {
      const statusIndicator = element.querySelector(".online-indicator");
      const statusTextElement = element.querySelector(".status-text"); // Assuming you add a span for status text

      if (isOnline) {
        element.classList.add("online");
        element.classList.remove("offline");
        if (statusIndicator) {
          statusIndicator.style.backgroundColor = "green";
        }
        if (statusTextElement) {
          statusTextElement.textContent = "Online";
          statusTextElement.style.color = "green";
        }
      } else {
        element.classList.add("offline");
        element.classList.remove("online");
        if (statusIndicator) {
          statusIndicator.style.backgroundColor = "red";
        }
        if (statusTextElement) {
          const now = new Date();
          statusTextElement.textContent = `Last seen at ${now.toLocaleTimeString()} ${now.toLocaleDateString()}`;
          statusTextElement.style.color = "red";
        }
      }
    });

    // Update chat header status if the updated user is part of the current chat
    if (
      window.chatApp &&
      typeof window.chatApp.updateChatHeaderStatus === "function"
    ) {
      window.chatApp.updateChatHeaderStatus(userId, isOnline);
    }
  }
  displayMessages(messages, chatId) {
    if (this.currentChatId !== chatId) return;

    const chatMessages = document.getElementById("chat-messages");
    if (!chatMessages) return;

    // Clear existing messages
    const existingMessages = chatMessages.querySelectorAll(".message");
    existingMessages.forEach((msg) => msg.remove());

    messages.forEach((message) => {
      // Get sender info from the message or use fallback
      const sender = {
        user_id: message.sender_id,
        firstname: message.senderName || "User",
        lastname: message.senderLastname || "",
        isOnline: message.isOnline || false, // Add online status if available
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

    // Highlight current user in chat list
    if (window.currentUser) {
      const userChatItems = document.querySelectorAll(
        `.chat-item[data-user-id="${window.currentUser.user_id}"]`
      );
      userChatItems.forEach((item) => {
        item.classList.add("current-user");
      });
    }
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
    chatElement.dataset.isGroup = chat.is_group_chat || chat.isGroup;
    // Highlight current user
    if (
      chat.participants &&
      chat.participants.some(
        (p) => p.user_id === (window.currentUser && window.currentUser.user_id)
      )
    ) {
      chatElement.dataset.userId = window.currentUser.user_id;
    }

    // Server already handles proper chat name generation for 1-on-1 chats
    // Trust the server's chat name which includes user names for 1-on-1 chats
    let chatNameToDisplay = chat.name || "Unnamed Chat";
    let avatarUrl = `${window.urlRoot || ""}/img/avatar.webp`; // Default avatar
    let lastMessageText = chat.lastMessage?.content || "No messages yet";
    let lastMessageTime = chat.lastMessage?.timestamp
      ? this.formatTime(chat.lastMessage.timestamp)
      : "";
    let isOnline = false; // Placeholder

    const isGroup = chat.is_group_chat || chat.isGroup;

    // For 1-on-1 chats, get the other participant's avatar and online status
    if (!isGroup && chat.participants && chat.participants.length === 2) {
      const otherParticipant = chat.participants.find(
        (p) => p.user_id !== (window.currentUser && window.currentUser.user_id)
      );
      if (otherParticipant) {
        avatarUrl = otherParticipant.photo || avatarUrl;
        isOnline = otherParticipant.isOnline || false;
      }
    } else if (isGroup) {
      // Group chat: use group avatar if available
      avatarUrl = chat.avatar || `${window.urlRoot || ""}/img/group-avatar.png`;
    }

    chatElement.dataset.dbName = chatNameToDisplay; // Set dbName to the determined display name

    chatElement.innerHTML = `
      <div class="chat-avatar">
        
        ${isOnline ? '<div class="online-indicator"></div>' : ""}
      </div>
      <div class="chat-details">
        <h3 class="chat-name">${this.escapeHtml(chatNameToDisplay)}</h3>
        <p class="last-message">${this.escapeHtml(lastMessageText)}</p>
      </div>
      <div class="chat-meta">
        <span class="last-message-time">${lastMessageTime}</span>
        <!-- <span class="unread-badge" style="display: none;">0</span> -->
      </div>
    `;

    chatListContainer.prepend(chatElement); // Add to the top of the list
  }

  formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  escapeHtml(text) {
    if (typeof text !== "string") {
      return String(text); // Ensure text is a string
    }
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
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
window.initializeWebSocket = initializeWebSocket;
window.ChatWebSocket = ChatWebSocket;

// Also make it available for immediate use
