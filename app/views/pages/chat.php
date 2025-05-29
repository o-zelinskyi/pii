<?php
$sitename = 'Messages';
require APPROOT . '/views/inc/head.php'; ?>
<link rel="stylesheet" href="<?php echo URLROOT; ?>/css/chatlist.css" />
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script src="<?php echo URLROOT; ?>/js/chat.js" defer></script>
<script>
  // Pass PHP data to JavaScript
  window.currentUser = <?php echo json_encode($data['currentUser']); ?>;
  window.students = <?php echo json_encode($data['students']); ?>;
  window.socketUrl = "<?php echo $data['socketUrl']; ?>";
  window.urlRoot = "<?php echo URLROOT; ?>";
</script>
<?php
require APPROOT . '/views/inc/head_end.php';
require APPROOT . '/views/inc/header.php';
require APPROOT . '/views/inc/chatlist.php'; ?>

<div class="chat-main">
  <!-- Chat Header -->
  <div class="chat-header">
    <div class="chat-info">
      <div class="chat-avatar">
        <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
        <div class="online-indicator"></div>
      </div>
      <div class="chat-details">
        <h3>John Doe</h3>
        <span class="status">Online • Last seen recently</span>
      </div>
    </div>
    <div class="chat-actions">
      <button class="action-btn" title="Search">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>
      <button class="action-btn" title="Call">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z" />
        </svg>
      </button>
      <button class="action-btn" title="Video Call">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
        </svg>
      </button>
      <button class="action-btn" title="More">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Chat Messages -->
  <div class="chat-messages" id="chat-messages">
    <div class="date-divider">
      <span>Today</span>
    </div>

    <div class="message other">
      <div class="message-avatar">
        <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="Avatar">
      </div>
      <div class="message-content">
        <div class="message-bubble" data-message-id="1">
          <p>Hey! How are you doing?</p>
          <div class="message-reactions">
            <span class="reaction" data-reaction="👍">👍 <span class="count">2</span></span>
            <span class="reaction" data-reaction="❤️">❤️ <span class="count">1</span></span>
          </div>
        </div>
        <div class="message-info">
          <span class="message-time">10:30 AM</span>
          <span class="message-actions">
            <button class="action-btn-small" onclick="toggleReactionPicker(1)" title="React">😊</button>
            <button class="action-btn-small" onclick="replyToMessage(1)" title="Reply">↩</button>
          </span>
        </div>
      </div>
    </div>

    <div class="message self">
      <div class="message-content">
        <div class="message-bubble" data-message-id="2">
          <p>Hi there! I'm doing great, thanks for asking. How about you?</p>
        </div>
        <div class="message-info">
          <span class="message-time">10:32 AM</span>
          <span class="message-status delivered">✓✓</span>
        </div>
      </div>
    </div>

    <div class="message other">
      <div class="message-avatar">
        <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="Avatar">
      </div>
      <div class="message-content">
        <div class="message-bubble" data-message-id="3">
          <p>I'm doing well too! Working on some exciting projects. By the way, did you see the latest updates on our dashboard?</p>
        </div>
        <div class="message-info">
          <span class="message-time">10:35 AM</span>
          <span class="message-actions">
            <button class="action-btn-small" onclick="toggleReactionPicker(3)" title="React">😊</button>
            <button class="action-btn-small" onclick="replyToMessage(3)" title="Reply">↩</button>
          </span>
        </div>
      </div>
    </div>

    <!-- Image message example -->
    <div class="message self">
      <div class="message-content">
        <div class="message-bubble media-message" data-message-id="4">
          <div class="media-preview">
            <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="Shared image" onclick="openImageModal(this.src)">
            <div class="media-overlay">
              <button class="media-download" title="Download">⬇</button>
            </div>
          </div>
          <p>Check out this screenshot!</p>
        </div>
        <div class="message-info">
          <span class="message-time">10:36 AM</span>
          <span class="message-status read">✓✓</span>
        </div>
      </div>
    </div>

    <!-- Voice message example -->
    <div class="message other">
      <div class="message-avatar">
        <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="Avatar">
      </div>
      <div class="message-content">
        <div class="message-bubble voice-message" data-message-id="5">
          <div class="voice-player">
            <button class="voice-play-btn" onclick="toggleVoicePlayback(this)">
              <svg width="16" height="16" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </button>
            <div class="voice-waveform">
              <div class="wave-bar" style="height: 12px;"></div>
              <div class="wave-bar" style="height: 8px;"></div>
              <div class="wave-bar" style="height: 16px;"></div>
              <div class="wave-bar" style="height: 10px;"></div>
              <div class="wave-bar" style="height: 14px;"></div>
              <div class="wave-bar" style="height: 6px;"></div>
              <div class="wave-bar" style="height: 12px;"></div>
              <div class="wave-bar" style="height: 18px;"></div>
            </div>
            <span class="voice-duration">0:15</span>
          </div>
        </div>
        <div class="message-info">
          <span class="message-time">10:37 AM</span>
          <span class="message-actions">
            <button class="action-btn-small" onclick="toggleReactionPicker(5)" title="React">😊</button>
            <button class="action-btn-small" onclick="replyToMessage(5)" title="Reply">↩</button>
          </span>
        </div>
      </div>
    </div>

    <div class="typing-indicator" style="display: none;">
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
        <span class="reply-to">Replying to <strong>John Doe</strong></span>
        <button class="cancel-reply" onclick="cancelReply()">×</button>
      </div>
      <div class="reply-message">Hey! How are you doing?</div>
    </div>
  </div>

  <!-- Chat Input -->
  <div class="chat-input-container">
    <div class="chat-input">
      <button class="input-action-btn" onclick="toggleAttachmentMenu()" title="Attach">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
        </svg>
      </button>

      <!-- Attachment Menu -->
      <div class="attachment-menu" id="attachmentMenu" style="display: none;">
        <button class="attachment-option" onclick="selectFiles('image')">
          <div class="attachment-icon">📷</div>
          <span>Photo</span>
        </button>
        <button class="attachment-option" onclick="selectFiles('file')">
          <div class="attachment-icon">📄</div>
          <span>Document</span>
        </button>
        <button class="attachment-option" onclick="startVoiceRecording()">
          <div class="attachment-icon">🎤</div>
          <span>Voice</span>
        </button>
      </div>

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

      <!-- Voice Recording Button (hidden by default) -->
      <button class="voice-record-btn" id="voiceRecordBtn" style="display: none;" onclick="toggleVoiceRecording()">
        <svg width="20" height="20" viewBox="0 0 24 24">
          <path d="M12 14c1.66 0 2.99-1.34 2.99-3L15 5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.41 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z" />
        </svg>
      </button>
    </div>
  </div>
</div>

<!-- Reaction Picker -->
<div class="reaction-picker" id="reactionPicker" style="display: none;">
  <button class="reaction-option" onclick="addReaction('👍')">👍</button>
  <button class="reaction-option" onclick="addReaction('❤️')">❤️</button>
  <button class="reaction-option" onclick="addReaction('😂')">😂</button>
  <button class="reaction-option" onclick="addReaction('😮')">😮</button>
  <button class="reaction-option" onclick="addReaction('😢')">😢</button>
  <button class="reaction-option" onclick="addReaction('🔥')">🔥</button>
</div>

<!-- Emoji Picker -->
<div class="emoji-picker" id="emojiPicker" style="display: none;">
  <div class="emoji-category">
    <h4>Smileys</h4>
    <div class="emoji-grid">
      <button class="emoji-option" onclick="insertEmoji('😀')">😀</button>
      <button class="emoji-option" onclick="insertEmoji('😃')">😃</button>
      <button class="emoji-option" onclick="insertEmoji('😄')">😄</button>
      <button class="emoji-option" onclick="insertEmoji('😁')">😁</button>
      <button class="emoji-option" onclick="insertEmoji('😅')">😅</button>
      <button class="emoji-option" onclick="insertEmoji('😂')">😂</button>
      <button class="emoji-option" onclick="insertEmoji('🤣')">🤣</button>
      <button class="emoji-option" onclick="insertEmoji('😊')">😊</button>
    </div>
  </div>
  <div class="emoji-category">
    <h4>Hearts</h4>
    <div class="emoji-grid">
      <button class="emoji-option" onclick="insertEmoji('❤️')">❤️</button>
      <button class="emoji-option" onclick="insertEmoji('💕')">💕</button>
      <button class="emoji-option" onclick="insertEmoji('💖')">💖</button>
      <button class="emoji-option" onclick="insertEmoji('💗')">💗</button>
      <button class="emoji-option" onclick="insertEmoji('💙')">💙</button>
      <button class="emoji-option" onclick="insertEmoji('💚')">💚</button>
      <button class="emoji-option" onclick="insertEmoji('💛')">💛</button>
      <button class="emoji-option" onclick="insertEmoji('🧡')">🧡</button>
    </div>
  </div>
</div>

<!-- Image Modal -->
<div class="image-modal" id="imageModal" onclick="closeImageModal()">
  <div class="image-modal-content">
    <img id="modalImage" src="" alt="Full size image">
    <button class="image-modal-close" onclick="closeImageModal()">×</button>
  </div>
</div>

<!-- Voice Recording Overlay -->
<div class="voice-recording-overlay" id="voiceRecordingOverlay" style="display: none;">
  <div class="voice-recording-content">
    <div class="recording-animation">
      <div class="pulse-ring"></div>
      <div class="recording-icon">🎤</div>
    </div>
    <p>Recording voice message...</p>
    <div class="recording-time" id="recordingTime">0:00</div>
    <div class="recording-controls">
      <button class="cancel-recording" onclick="cancelVoiceRecording()">Cancel</button>
      <button class="stop-recording" onclick="stopVoiceRecording()">Send</button>
    </div>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendBtn = document.getElementById('send-btn');
    const chatMessages = document.getElementById('chat-messages');

    // Auto-resize textarea
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

    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);

    function sendMessage() {
      const message = messageInput.value.trim();
      if (message) {
        addMessage(message, true);
        messageInput.value = '';
        messageInput.style.height = 'auto';

        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
      }
    }

    function addMessage(text, isSelf) {
      const messageDiv = document.createElement('div');
      messageDiv.className = `message ${isSelf ? 'self' : 'other'}`;

      const currentTime = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });

      messageDiv.innerHTML = `
      ${!isSelf ? '<div class="message-avatar"><img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="Avatar"></div>' : ''}
      <div class="message-content">
        <div class="message-bubble">
          <p>${text}</p>
        </div>
        <div class="message-info">
          <span class="message-time">${currentTime}</span>
          ${isSelf ? '<span class="message-status">✓</span>' : ''}
        </div>
      </div>
    `;

      chatMessages.appendChild(messageDiv);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  });
</script>

<?php require APPROOT . '/views/inc/footer.php'; ?>