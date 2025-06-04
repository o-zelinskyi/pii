// This function will be added to chat.js
window.loadChat = function (chatId) {
  console.log(`loadChat called with chatId: ${chatId}`);

  // Find the chat item in the list
  const chatItem = document.querySelector(
    `.chat-item[data-chat-id="${chatId}"]`
  );

  if (chatItem) {
    // Remove active class from currently active item
    const chatListContainer = document.getElementById("chatListContainer");
    const currentlyActive =
      chatListContainer?.querySelector(".chat-item.active");
    if (currentlyActive) {
      currentlyActive.classList.remove("active");
    }

    // Add active class to selected item
    chatItem.classList.add("active");

    // Get chat name from the item
    const chatName =
      chatItem.querySelector(".chat-name")?.textContent || "Chat";

    // Update the WebSocket current chat ID
    if (window.chatWS) {
      window.chatWS.currentChatId = chatId;
      window.chatWS.loadMessages(chatId);
    }

    // Update chat header
    updateChatHeader(chatItem);

    // Show chat interface
    if (typeof window.showChatInterface === "function") {
      window.showChatInterface(chatId, chatName, []);
    } else {
      console.error("showChatInterface function is not defined.");
    }

    // Hide no chat message if exists
    const noChatMessage = document.getElementById("noChatMessage");
    if (noChatMessage) {
      noChatMessage.style.display = "none";
    }

    return true;
  } else {
    console.error(`Chat with ID ${chatId} not found in the list.`);
    return false;
  }
};
