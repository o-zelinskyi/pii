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
    <ul class="chat-list" id="chatListContainer">
      <!-- No chats message -->
      <div id="noChatMessage" class="no-chats-container">
        <div class="no-chats-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
        </div>
        <h3>No conversations yet</h3>
        <p>Start a new conversation to get started</p>
        <button class="start-chat-btn" onclick="document.getElementById('createChatBtn').click()">
          Start New Chat
        </button>
      </div>
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
        <!-- Users will be loaded dynamically from MariaDB -->
        <div id="usersListContainer">
          <div class="loading-users">
            <div class="spinner"></div>
            <p>Loading users...</p>
          </div>
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