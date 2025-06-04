/**
 * Global WebSocket Connection
 * Establishes WebSocket connection on every page for notifications
 */

// Initialize global WebSocket and notifications when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
  initializeGlobalWebSocket();

  // Set up notifications if the function exists
  if (typeof window.setupNotifications === "function") {
    window.setupNotifications();
  }
});

function initializeGlobalWebSocket() {
  // Check if we already have a WebSocket instance
  if (window.chatWS) {
    console.log("WebSocket already initialized");
    return;
  }

  // Check if the current user data is available
  if (!window.currentUser) {
    console.log("No user data available, cannot initialize WebSocket");
    return;
  }

  const serverUrl = window.socketUrl || "http://localhost:3000";

  console.log("Initializing global WebSocket with:", {
    user: window.currentUser,
    serverUrl: serverUrl,
  });

  // Initialize the WebSocket connection
  const chatWS = new ChatWebSocket(serverUrl);
  chatWS.connect(window.currentUser);

  // Set isInChatPage flag based on current path
  chatWS.isInChatPage = window.location.pathname.includes("/chats");

  // Store the WebSocket instance globally
  window.chatWS = chatWS;

  console.log("Global WebSocket initialized");
}

// If we're not on a chat page, we need to override navigation functions
// to prevent redirection to chat from notifications
if (!window.loadChat) {
  window.loadChat = function (chatId) {
    console.log(`loadChat called with chatId: ${chatId}`);
    // Navigate to the chat page with the specified chat ID
    window.location.href = `${
      window.urlRoot || ""
    }/chats/messages?chatId=${chatId}`;
    return true;
  };
}
