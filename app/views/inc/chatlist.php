<nav id="chatlist">
  <!-- Chatlist Header -->
  <div class="chatlist-header">
    <h2>Messages</h2>
    <div class="chatlist-actions">
      <button id="searchChatsBtn" class="header-action-btn" title="Search">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
        </svg>
      </button>
      <button id="createChatBtn" class="header-action-btn" title="New Chat">
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 7H9v-1h6v1z" />
        </svg>
      </button>
    </div>
  </div>

  <!-- Search Bar -->
  <div class="search-container" id="searchContainer" style="display: none;">
    <div class="search-input">
      <svg width="16" height="16" viewBox="0 0 24 24">
        <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
      </svg>
      <input type="text" placeholder="Search conversations..." id="searchInput">
    </div>
  </div>

  <!-- Chat Filter Tabs -->
  <div class="chat-filters">
    <button class="filter-tab active" data-filter="all">All</button>
    <button class="filter-tab" data-filter="unread">Unread</button>
    <button class="filter-tab" data-filter="groups">Groups</button>
  </div>

  <!-- Chat List -->
  <div class="chatlist-content">
    <ul class="chat-list"> <!-- Active chat -->
      <li class="chat-item active" data-chat-id="1">
        <div class="chat-avatar">
          <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
          <div class="online-indicator"></div>
        </div>
        <div class="chat-info">
          <div class="chat-header-info">
            <h4 class="chat-name">John Doe</h4>
            <span class="chat-time">2:30 PM</span>
          </div>
          <div class="chat-preview">
            <p class="last-message">Yes! The new features look amazing 🚀</p>
            <div class="chat-badges">
              <span class="message-status read">✓✓</span>
            </div>
          </div>
        </div>
        <div class="chat-actions-menu">
          <button class="chat-menu-btn" onclick="toggleChatMenu(1)">⋮</button>
          <div class="chat-menu" id="chatMenu1" style="display: none;">
            <button onclick="pinChat(1)">📌 Pin</button>
            <button onclick="muteChat(1)">🔇 Mute</button>
            <button onclick="archiveChat(1)">📁 Archive</button>
            <button onclick="deleteChat(1)" class="danger">🗑 Delete</button>
          </div>
        </div>
      </li> <!-- Other chats -->
      <li class="chat-item" data-chat-id="2">
        <div class="chat-avatar">
          <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
          <div class="away-indicator"></div>
        </div>
        <div class="chat-info">
          <div class="chat-header-info">
            <h4 class="chat-name">Jane Smith</h4>
            <span class="chat-time">1:15 PM</span>
          </div>
          <div class="chat-preview">
            <p class="last-message">Thanks for the update on the project status</p>
            <div class="chat-badges">
              <span class="unread-count">2</span>
            </div>
          </div>
        </div>
        <div class="chat-actions-menu">
          <button class="chat-menu-btn" onclick="toggleChatMenu(2)">⋮</button>
          <div class="chat-menu" id="chatMenu2" style="display: none;">
            <button onclick="pinChat(2)">📌 Pin</button>
            <button onclick="muteChat(2)">🔇 Mute</button>
            <button onclick="archiveChat(2)">📁 Archive</button>
            <button onclick="deleteChat(2)" class="danger">🗑 Delete</button>
          </div>
        </div>
      </li>

      <li class="chat-item pinned" data-chat-id="3">
        <div class="chat-avatar group-avatar">
          <div class="group-icon">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M16 4c0-1.11.89-2 2-2s2 .89 2 2-.89 2-2 2-2-.89-2-2zm4 18v-6h2.5l-2.54-7.63A2.996 2.996 0 0 0 17.06 6c-.8 0-1.54.5-1.85 1.26l-1.92 5.76c-.15.45.04.95.49 1.1.45.15.95-.04 1.1-.49l1.91-5.76.01.01L18.06 8c.8 0 1.54-.5 1.85-1.26z" />
            </svg>
          </div>
        </div>
        <div class="chat-info">
          <div class="chat-header-info">
            <h4 class="chat-name">
              📌 Development Team
              <span class="chat-type-badge">Group</span>
            </h4>
            <span class="chat-time">12:45 PM</span>
          </div>
          <div class="chat-preview">
            <p class="last-message"><strong>Mike:</strong> Let's schedule a meeting for tomorrow</p>
            <div class="chat-badges">
              <span class="unread-count">5</span>
            </div>
          </div>
        </div>
        <div class="chat-actions-menu">
          <button class="chat-menu-btn" onclick="toggleChatMenu(3)">⋮</button>
          <div class="chat-menu" id="chatMenu3" style="display: none;">
            <button onclick="unpinChat(3)">📌 Unpin</button>
            <button onclick="muteChat(3)">🔇 Mute</button>
            <button onclick="leaveGroup(3)" class="danger">🚪 Leave Group</button>
          </div>
        </div>
      </li>

      <li class="chat-item" data-chat-id="4">
        <div class="chat-avatar">
          <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
        </div>
        <div class="chat-info">
          <div class="chat-header-info">
            <h4 class="chat-name">Alice Johnson</h4>
            <span class="chat-time">Yesterday</span>
          </div>
          <div class="chat-preview">
            <p class="last-message">See you tomorrow at the presentation!</p>
            <div class="chat-badges">
              <span class="message-status delivered">✓</span>
            </div>
          </div>
        </div>
        <div class="chat-actions-menu">
          <button class="chat-menu-btn" onclick="toggleChatMenu(4)">⋮</button>
          <div class="chat-menu" id="chatMenu4" style="display: none;">
            <button onclick="pinChat(4)">📌 Pin</button>
            <button onclick="muteChat(4)">🔇 Mute</button>
            <button onclick="archiveChat(4)">📁 Archive</button>
            <button onclick="deleteChat(4)" class="danger">🗑 Delete</button>
          </div>
        </div>
      </li>

      <li class="chat-item muted" data-chat-id="5">
        <div class="chat-avatar">
          <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
          <div class="muted-indicator">🔇</div>
        </div>
        <div class="chat-info">
          <div class="chat-header-info">
            <h4 class="chat-name">Bob Wilson</h4>
            <span class="chat-time">Monday</span>
          </div>
          <div class="chat-preview">
            <p class="last-message">The documents have been uploaded successfully</p>
            <div class="chat-badges"></div>
          </div>
        </div>
        <div class="chat-actions-menu">
          <button class="chat-menu-btn" onclick="toggleChatMenu(5)">⋮</button>
          <div class="chat-menu" id="chatMenu5" style="display: none;">
            <button onclick="pinChat(5)">📌 Pin</button>
            <button onclick="unmuteChat(5)">🔊 Unmute</button>
            <button onclick="archiveChat(5)">📁 Archive</button>
            <button onclick="deleteChat(5)" class="danger">🗑 Delete</button>
          </div>
        </div>
      </li>

      <!-- Typing indicator for chatlist -->
      <li class="chat-item typing" data-chat-id="6" style="display: none;">
        <div class="chat-avatar">
          <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
          <div class="online-indicator"></div>
        </div>
        <div class="chat-info">
          <div class="chat-header-info">
            <h4 class="chat-name">Sarah Connor</h4>
            <span class="chat-time">now</span>
          </div>
          <div class="chat-preview">
            <p class="last-message typing-text">
              <span class="typing-dots-small">
                <span></span>
                <span></span>
                <span></span>
              </span>
              typing...
            </p>
            <div class="chat-badges"></div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</nav>

<!-- Modal for creating new chat -->
<div id="createChatModal" class="modal">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Start New Conversation</h2>
      <span class="close-button">&times;</span>
    </div>
    <div class="modal-body">
      <div class="search-users">
        <input type="text" placeholder="Search users..." id="userSearch">
      </div>
      <div class="users-list">
        <div class="user-item" data-user-id="1">
          <div class="user-avatar">
            <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
          </div>
          <div class="user-info">
            <h4>Michael Brown</h4>
            <span>Online</span>
          </div>
          <input type="checkbox" name="user" value="1">
        </div>
        <div class="user-item" data-user-id="2">
          <div class="user-avatar">
            <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
          </div>
          <div class="user-info">
            <h4>Sarah Davis</h4>
            <span>Last seen 5 minutes ago</span>
          </div>
          <input type="checkbox" name="user" value="2">
        </div>
        <div class="user-item" data-user-id="3">
          <div class="user-avatar">
            <img src="<?php echo URLROOT; ?>/img/avatar.webp" alt="User Avatar">
          </div>
          <div class="user-info">
            <h4>Tom Wilson</h4>
            <span>Last seen 2 hours ago</span>
          </div>
          <input type="checkbox" name="user" value="3">
        </div>
      </div>
    </div>
    <div class="modal-footer">
      <button id="confirmCreateChatBtn" disabled>Start Conversation</button>
    </div>
  </div>
</div>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Modal functionality
    const modal = document.getElementById('createChatModal');
    const createBtn = document.getElementById('createChatBtn');
    const closeBtn = document.querySelector('.close-button');
    const confirmBtn = document.getElementById('confirmCreateChatBtn');

    createBtn.addEventListener('click', () => {
      modal.style.display = 'block';
    });

    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
      }
    });

    // Search functionality
    const searchBtn = document.getElementById('searchChatsBtn');
    const searchContainer = document.getElementById('searchContainer');
    const searchInput = document.getElementById('searchInput');

    searchBtn.addEventListener('click', () => {
      searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
      if (searchContainer.style.display === 'block') {
        searchInput.focus();
      }
    });

    // Filter tabs
    const filterTabs = document.querySelectorAll('.filter-tab');
    filterTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        filterTabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
      });
    });

    // Chat item selection
    const chatItems = document.querySelectorAll('.chat-item');
    chatItems.forEach(item => {
      item.addEventListener('click', () => {
        chatItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      });
    });

    // User selection in modal
    const userCheckboxes = document.querySelectorAll('input[name="user"]');
    userCheckboxes.forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        const checked = document.querySelectorAll('input[name="user"]:checked');
        confirmBtn.disabled = checked.length === 0;
      });
    });
  });
</script>