    <header>
      <a class="company-name-link" href="<?php echo URLROOT; ?>/tables">
        <h1 class="company-name">CMS</h1>
      </a>
      <div class="right-section"> <?php if (isset($_SESSION['user_id'])) : ?>
          <div class="notification-section notification-bell" id="notification-bell">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="28px"
              viewBox="0 -960 960 960"
              width="28px"
              fill="currentColor"
              class="notification-icon">
              <path
                d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z" />
            </svg>
            <span class="notification-count" style="display: none;">0</span>
            <div class="notification-window" id="notification-window">
              <div class="notification-header">
                <h3>Messages</h3>
                <button class="mark-all-read" onclick="markAllAsRead()">Mark all as read</button>
              </div>
              <div class="notification-content" id="notification-content">
                <div class="no-notifications" id="no-notifications">
                  <p>No new messages</p>
                </div>
              </div>
              <div class="notification-footer">
                <button class="view-all-messages">
                  <a href="<?php echo URLROOT; ?>/chats/messages">View All Messages</a>
                </button>
              </div>
            </div>
          </div>
          <div class="profile">
            <img
              class="profile-picture"
              src="<?php echo isset($_SESSION['user_photo']) && !empty($_SESSION['user_photo']) ? $_SESSION['user_photo'] : 'img/avatar.webp'; ?>"
              alt="User profile" />
            <p class="username"><?php echo $_SESSION['user_firstname'] . ' ' . $_SESSION['user_lastname']; ?></p>
            <div class="profile-menu">
              <a href="<?php echo URLROOT; ?>/users/profile">My profile</a>
              <a href="<?php echo URLROOT; ?>/users/logout">Log Out</a>
            </div>
          </div>
        <?php else : ?>
          <div class="login-register">
            <a href="<?php echo URLROOT; ?>/users/login" class="login">Log In</a>
            <a href="<?php echo URLROOT; ?>/users/register" class="register">Register</a>
          </div>
        <?php endif; ?>
      </div>
    </header>