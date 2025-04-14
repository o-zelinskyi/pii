    <header>
      <a class="company-name-link" href="<?php echo URLROOT; ?>/tables">
        <h1 class="company-name">CMS</h1>
      </a>
      <div class="right-section">
        
        <?php if(isset($_SESSION['user_id'])) : ?>
          <div class="notification-section notification hidden">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="28px"
            viewBox="0 -960 960 960"
            width="28px"
            fill="currentColor"
          >
            <path
              d="M160-200v-80h80v-280q0-83 50-147.5T420-792v-28q0-25 17.5-42.5T480-880q25 0 42.5 17.5T540-820v28q80 20 130 84.5T720-560v280h80v80H160Zm320-300Zm0 420q-33 0-56.5-23.5T400-160h160q0 33-23.5 56.5T480-80ZM320-280h320v-280q0-66-47-113t-113-47q-66 0-113 47t-47 113v280Z"
            />
          </svg>
          <div class="notification-window">
            <div class="notification-content">
              <div class="notification-row">
                <div class="left-column">
                  <img
                    class="notification-profile-picture"
                    src="img/avatar.webp"
                    alt="User profile"
                  />
                  <p class="notification-username">James Bond</p>
                </div>
                <div class="right-column">
                  <p class="notification-text">notification content</p>
                </div>
              </div>
              <div class="notification-row">
                <div class="left-column">
                  <img
                    class="notification-profile-picture"
                    src="img/avatar.webp"
                    alt="User profile"
                  />
                  <p class="notification-username">James Bond</p>
                </div>
                <div class="right-column">
                  <p class="notification-text">notification content</p>
                </div>
              </div>
              <div class="notification-row">
                <div class="left-column">
                  <img
                    class="notification-profile-picture"
                    src="img/avatar.webp"
                    alt="User profile"
                  />
                  <p class="notification-username">James Bond</p>
                </div>
                <div class="right-column">
                  <p class="notification-text">notification content</p>
                </div>
              </div>
              <div class="notification-row">
                <button><a href="messages">All messages</a></button>
              </div>
            </div>
          </div>
        </div>
        <div class="profile">
          <img
            class="profile-picture"
            src="img/avatar.webp" 
            alt="User profile"
          />
          <p class="username"><?php echo $_SESSION['user_firstname'] . ' ' . $_SESSION['user_lastname']; ?></p>
          <div class="profile-menu">
            <a>My profile</a>
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