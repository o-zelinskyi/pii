<?php
$sitename = 'Messages';
require APPROOT . '/views/inc/head.php'; ?>
<link rel="stylesheet" href="<?php echo URLROOT; ?>/css/chatlist.css" />
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script type="module" src="<?php echo URLROOT; ?>/js/websocket-client.js"></script>
<script src="<?php echo URLROOT; ?>/js/chat.js" defer></script>
<script>
  // Pass PHP data to JavaScript
  window.currentUser = <?php echo json_encode($data['currentUser']); ?>;
  window.students = <?php echo json_encode($data['students']); ?>;
  window.socketUrl = "<?php echo $data['socketUrl']; ?>";
  window.urlRoot = "<?php echo URLROOT; ?>";

  // Initialize WebSocket connection when page loads
  document.addEventListener('DOMContentLoaded', function() {
    // Add a small delay to ensure the module is loaded
    setTimeout(() => {
      if (typeof initializeChatWebSocket === 'function' && window.currentUser && window.socketUrl) {
        initializeChatWebSocket(window.currentUser, window.socketUrl);
      } else {
        console.error('initializeChatWebSocket function not available or missing data');
        console.log('Available functions:', typeof initializeChatWebSocket);
        console.log('Current user:', window.currentUser);
        console.log('Socket URL:', window.socketUrl);
      }
    }, 100);
  });
</script>
<?php
require APPROOT . '/views/inc/head_end.php';
require APPROOT . '/views/inc/header.php';
require APPROOT . '/views/inc/chatlist.php'; ?>

<div class="chat-main"> <!-- Chat Header -->
  <div class="chat-header" id="chat-header">
    <div class="chat-info">
      <div class="chat-details">
        <h3 style="margin: 0;" id="chat-name">Select a chat</h3> <!-- ADDED for chat name -->
        <button id="edit-chat-name-btn" class="edit-chat-name-btn" style="display:none; margin-left: 10px; background: none; border: none; cursor: pointer;" title="Edit chat name">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-pencil-square" viewBox="0 0 16 16">
            <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.793l-2.03-2.03L13.502.734a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z" />
            <path fill-rule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5z" />
          </svg>
        </button>
        <span class="status" id="chat-status">Choose a conversation to start messaging</span>
      </div>
    </div>
  </div>

  <div id="chat-main-content" style="display: none; flex-direction: column; flex-grow: 1; overflow: hidden;"> <!-- ADD THIS WRAPPER and some styles -->
    <!-- Chat Messages -->
    <div class="chat-messages" id="chat-messages" style="flex-grow: 1; overflow-y: auto; padding: 10px;">
      <!-- Welcome message when no chat is selected -->
      <div class="no-chat-selected" id="no-chat-selected" style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; text-align: center;">
        <div class="welcome-content">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <h3>Welcome to Messages</h3>
          <p>Select a conversation from the sidebar to start chatting</p>
        </div>
      </div>

      <!-- No messages in selected chat -->
      <div class="no-messages" id="no-messages" style="display: none;">
        <div class="no-messages-content">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
          </svg>
          <h3>No messages yet</h3>
          <p>Start a conversation by sending a message</p>
        </div>
      </div>
    </div>



    <!-- Chat Input -->
    <div class="chat-input-container" id="chat-input-container" style="display: none;">
      <textarea id="message-input" placeholder="Type a message..." rows="1"></textarea>
      <button id="send-btn" class="send-btn" title="Send">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  </div> <!-- END OF WRAPPER -->
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');
    const chatInputContainer = document.getElementById('chat-input-container');
    const noChatSelected = document.getElementById('no-chat-selected');
    const noMessages = document.getElementById('no-messages');

    // Auto-resize textarea
    if (messageInput) {
      messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });

      // Send message on Enter key
      messageInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });
    }

    // Send message on button click
    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    function sendMessage() {
      const message = messageInput.value.trim();
      if (message && typeof chatWS !== 'undefined' && chatWS && chatWS.currentChatId) {
        // Send via WebSocket
        chatWS.sendMessage(chatWS.currentChatId, message);

        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
      }
    }

    // Function to show chat interface when a chat is selected
    window.showChatInterface = function(chatId, chatName, participants) {
      console.log(`Showing chat: ${chatName} (ID: ${chatId})`);
      const chatMainContent = document.getElementById('chat-main-content');
      const chatInputContainer = document.getElementById('chat-input-container');
      const chatMessages = document.getElementById('chat-messages');

      if (chatMainContent) {
        chatMainContent.style.display = 'flex'; // Show the main chat area
      }
      if (chatInputContainer) {
        chatInputContainer.style.display = 'flex'; // Show the input area
      }

      // Clear previous messages
      if (chatMessages) {
        chatMessages.innerHTML = '';
      }

      // Update chat header with the chat name
      const chatHeaderName = document.querySelector('#chat-header .chat-details h3');
      if (chatHeaderName) {
        chatHeaderName.textContent = chatName;
      } else {
        console.error('Chat header name element (#chat-header .chat-details h3) not found.');
      }

      window.currentChatId = chatId; // Store current chat ID

      // Load messages for the selected chat
      if (window.chatWS && typeof window.chatWS.loadMessages === 'function') {
        window.chatWS.loadMessages(chatId);
      } else {
        console.error('WebSocket not initialized or loadMessages function not available.');
      }
    };

    // Function to hide chat interface
    window.hideChatInterface = function() {
      const chatMainContent = document.getElementById('chat-main-content');
      const chatInputContainer = document.getElementById('chat-input-container');
      const chatMessages = document.getElementById('chat-messages');
      const chatHeaderName = document.querySelector('#chat-header .chat-details h3');

      if (chatMainContent) {
        chatMainContent.style.display = 'none';
      }
      if (chatInputContainer) {
        chatInputContainer.style.display = 'none';
      }

      if (chatHeaderName) {
        chatHeaderName.textContent = ''; // Clear chat name
      }

      if (chatMessages) {
        // Optionally, display a placeholder message
        // chatMessages.innerHTML = '<div id="no-chat-selected-placeholder" style="text-align: center; padding: 20px; color: #777;">Select a chat to view messages.</div>';
        chatMessages.innerHTML = ''; // Or just clear it
      }
      window.currentChatId = null; // Reset current chat ID
    };
  });

  // Placeholder functions for future implementation
  function toggleSearchMessages() {
    console.log('Search messages');
  }

  function startCall() {
    console.log('Start call');
  }

  function startVideoCall() {
    console.log('Start video call');
  }

  function toggleChatMenu() {
    console.log('Toggle chat menu');
  }

  function toggleAttachmentMenu() {
    console.log('Toggle attachment menu');
  }

  function toggleEmojiPicker() {
    console.log('Toggle emoji picker');
  }

  function cancelReply() {
    document.getElementById('replyPreview').style.display = 'none';
  }
</script>

<?php require APPROOT . '/views/inc/footer.php'; ?>