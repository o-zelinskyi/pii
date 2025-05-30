<!-- Chat Server Status Component -->
<div id="chat-server-status" class="server-status">
  <div class="status-indicator" id="status-indicator">
    <span class="status-dot" id="status-dot"></span>
    <span class="status-text" id="status-text">Checking server...</span>
  </div>
</div>

<style>
  .server-status {
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(255, 255, 255, 0.95);
    padding: 8px 12px;
    border-radius: 20px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    font-size: 12px;
    backdrop-filter: blur(10px);
  }

  .status-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .status-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    transition: background-color 0.3s ease;
  }

  .status-dot.online {
    background-color: #10b981;
    box-shadow: 0 0 0 2px rgba(16, 185, 129, 0.3);
  }

  .status-dot.offline {
    background-color: #ef4444;
    box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
  }

  .status-dot.checking {
    background-color: #f59e0b;
    animation: pulse 1.5s infinite;
  }

  @keyframes pulse {

    0%,
    100% {
      opacity: 1;
    }

    50% {
      opacity: 0.5;
    }
  }

  .status-text {
    color: #374151;
    font-weight: 500;
  }
</style>

<script>
  class ChatServerStatus {
    constructor() {
      this.statusDot = document.getElementById('status-dot');
      this.statusText = document.getElementById('status-text');
      this.checkInterval = null;
      this.init();
    }

    init() {
      this.checkServerStatus();
      // Check every 30 seconds
      this.checkInterval = setInterval(() => {
        this.checkServerStatus();
      }, 30000);
    }

    async checkServerStatus() {
      try {
        this.updateStatus('checking', 'Checking server...');

        const response = await fetch('http://localhost:3000/health', {
          method: 'GET',
          timeout: 5000
        });

        if (response.ok) {
          const data = await response.json();
          if (data.status === 'OK') {
            this.updateStatus('online', 'Chat server online');
          } else {
            this.updateStatus('offline', 'Chat server error');
          }
        } else {
          this.updateStatus('offline', 'Chat server offline');
        }
      } catch (error) {
        this.updateStatus('offline', 'Chat server offline');
      }
    }

    updateStatus(status, text) {
      this.statusDot.className = `status-dot ${status}`;
      this.statusText.textContent = text;
    }

    destroy() {
      if (this.checkInterval) {
        clearInterval(this.checkInterval);
      }
    }
  }

  // Initialize server status checker
  document.addEventListener('DOMContentLoaded', function() {
    window.chatServerStatus = new ChatServerStatus();
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', function() {
    if (window.chatServerStatus) {
      window.chatServerStatus.destroy();
    }
  });
</script>