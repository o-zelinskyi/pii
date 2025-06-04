console.log("Global WebSocket Test Script: Checking if WebSocket is connected");

// Function to check if WebSocket is connected
function checkWebSocketStatus() {
  if (window.chatWS && window.chatWS.socket) {
    console.log(
      "WebSocket connection status:",
      window.chatWS.socket.connected ? "Connected" : "Disconnected"
    );

    if (window.chatWS.socket.connected) {
      console.log("Successfully connected to WebSocket server!");
      // Flash the notification bell to indicate it's working
      const bell = document.querySelector(".notification-bell");
      if (bell) {
        bell.classList.add("animate-bell");
        setTimeout(() => {
          bell.classList.remove("animate-bell");
        }, 1000);
      }
    } else {
      console.log("WebSocket is instantiated but not connected.");
    }
  } else {
    console.log("WebSocket is not initialized yet.");
    // Try again after a short delay
    setTimeout(checkWebSocketStatus, 1000);
  }
}

// Set a timeout to check WebSocket status after page load
setTimeout(checkWebSocketStatus, 1500);
