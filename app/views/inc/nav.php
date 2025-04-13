<nav id="sidebar">
      <ul>
        <li>
          <button id="toggle-btn" aria-label="Toggle navigation">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path
                d="M440-240 200-480l240-240 56 56-183 184 183 184-56 56Zm264 0L464-480l240-240 56 56-183 184 183 184-56 56Z"
              />
            </svg>
          </button>
        </li>
        <li <?php if($sitename == 'Dashboard') echo 'class="active"' ?>>
          <a href="dashboard" aria-label="Go to dashboard">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path
                d="M520-600v-240h320v240H520ZM120-440v-400h320v400H120Zm400 320v-400h320v400H520Zm-400 0v-240h320v240H120Zm80-400h160v-240H200v240Zm400 320h160v-240H600v240Zm0-480h160v-80H600v80ZM200-200h160v-80H200v80Zm160-320Zm240-160Zm0 240ZM360-280Z"
              />
            </svg>
            <span>Dashboard</span></a
          >
        </li>
        <li <?php if($sitename == 'Students') echo 'class="active"' ?>> 
          <a href="students.php" aria-label="Go to students"
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path
                d="M320-80q-33 0-56.5-23.5T240-160v-480q0-33 23.5-56.5T320-720h480q33 0 56.5 23.5T880-640v480q0 33-23.5 56.5T800-80H320Zm0-80h200v-120H320v120Zm280 0h200v-120H600v120ZM80-240v-560q0-33 23.5-56.5T160-880h560v80H160v560H80Zm240-120h200v-120H320v120Zm280 0h200v-120H600v120ZM320-560h480v-80H320v80Z"
              />
            </svg>
            <span>Students</span></a
          >
        </li>
        <li <?php if($sitename == 'Tasks') echo 'class="active"' ?>>
          <a href="tasks.php" aria-label="Go to tasks"
            ><svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#e3e3e3"
            >
              <path
                d="M480-80q-83 0-156-31.5T197-197q-54-54-85.5-127T80-480q0-83 31.5-156T197-763q54-54 127-85.5T480-880q65 0 123 19t107 53l-58 59q-38-24-81-37.5T480-800q-133 0-226.5 93.5T160-480q0 133 93.5 226.5T480-160q133 0 226.5-93.5T800-480q0-18-2-36t-6-35l65-65q11 32 17 66t6 70q0 83-31.5 156T763-197q-54 54-127 85.5T480-80Zm-56-216L254-466l56-56 114 114 400-401 56 56-456 457Z"
              />
            </svg>
            <span>Tasks</span></a
          >
        </li>
      </ul>
    </nav>