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

<div class="chat-main">
  <!-- Chat Header -->
  <div class="chat-header" id="chat-header">
    <div class="chat-info">
      <div class="chat-avatar">
        <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar" id="chat-avatar">
        <div class="online-indicator" id="online-indicator"></div>
      </div>
      <div class="chat-details">
        <h3 id="chat-name">Select a chat</h3>
        <span class="status" id="chat-status">Choose a conversation to start messaging</span>
      </div>
    </div>
    <div class="chat-actions">
      <button class="action-btn" title="Search" onclick="toggleSearchMessages()">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>
      <button class="action-btn" title="Call" onclick="startCall()">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
        </svg>
      </button>
      <button class="action-btn" title="Video Call" onclick="startVideoCall()">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      </button>
      <button class="action-btn" title="More" onclick="toggleChatMenu()">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Chat Messages -->
  <div class="chat-messages" id="chat-messages">
    <!-- Welcome message when no chat is selected -->
    <div class="no-chat-selected" id="no-chat-selected">
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

    <!-- Typing indicator -->
    <div class="typing-indicator" style="display: none;" id="typing-indicator">
      <div class="message other">
        <div class="message-avatar">
          <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="Avatar">
        </div>
        <div class="message-content">
          <div class="typing-bubble">
            <div class="typing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Reply Preview -->
  <div class="reply-preview" id="replyPreview" style="display: none;">
    <div class="reply-content">
      <div class="reply-info">
        <span class="reply-to">Replying to <strong id="reply-to-name">User</strong></span>
        <button class="cancel-reply" onclick="cancelReply()">×</button>
      </div>
      <div class="reply-message" id="reply-message">Message content</div>
    </div>
  </div>

  <!-- Chat Input -->
  <div class="chat-input-container" id="chat-input-container" style="display: none;">
    <div class="chat-input">
      <button class="input-action-btn" onclick="toggleAttachmentMenu()" title="Attach">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
        </svg>
      </button>

      <div class="input-field">
        <textarea id="message-input" placeholder="Type a message..." rows="1"></textarea>
        <button class="emoji-btn" onclick="toggleEmojiPicker()" title="Emoji">
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
          </svg>
        </button>
      </div>

      <button class="send-btn" id="send-btn">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
      </button>
    </div>
  </div>
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
      // Hide welcome message
      noChatSelected.style.display = 'none';

      // Show input container
      chatInputContainer.style.display = 'block';

      // Update chat header
      document.getElementById('chat-name').textContent = chatName;
      document.getElementById('chat-status').textContent = 'Online';

      // Show no messages if chat is empty
      noMessages.style.display = 'flex';

      // Focus input
      if (messageInput) {
        messageInput.focus();
      }
    };

    // Function to hide chat interface
    window.hideChatInterface = function() {
      noChatSelected.style.display = 'flex';
      chatInputContainer.style.display = 'none';
      noMessages.style.display = 'none';

      // Clear messages
      const existingMessages = chatMessages.querySelectorAll('.message');
      existingMessages.forEach(msg => msg.remove());
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