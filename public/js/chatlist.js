class ChatList {
  constructor() {
    this.chats = new Map();
    this.unreadCounts = new Map();
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
}
