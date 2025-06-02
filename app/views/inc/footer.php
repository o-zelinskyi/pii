<script>
  const URLROOT = '<?php echo URLROOT; ?>';
  window.urlRoot = URLROOT;

  <?php if (isset($_SESSION['user_id'])): ?>
    window.currentUser = {
      user_id: '<?php echo $_SESSION['user_id']; ?>',
      // Ensure you have a token in the session, e.g., $_SESSION['user_token']
      // If not, the server-side 'join' event and ChatWebSocket constructor might need adjustment
      // For now, assuming a token is available or can be added to the session upon login
      token: '<?php echo $_SESSION['user_token'] ?? ''; // Provide a default or ensure this session variable exists 
              ?>',
      firstname: '<?php echo $_SESSION['user_firstname'] ?? ''; ?>',
      lastname: '<?php echo $_SESSION['user_lastname'] ?? ''; ?>'
      // Add any other user properties needed by the server's 'join' event
    };
  <?php else: ?>
    window.currentUser = null;
  <?php endif; ?>
  // window.socketUrl is not strictly needed here if initializeWebSocket uses its hardcoded URL
  // but can be defined if other parts of your JS expect it globally.
  // window.socketUrl = "<?php echo $data['socketUrl'] ?? 'http://localhost:3000'; ?>";
</script>
<script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
<script type="module" src="<?php echo URLROOT; ?>/js/chat.js"></script>
<script type="module" src="<?php echo URLROOT; ?>/js/websocket-client.js"></script>
<script type="module" src="<?php echo URLROOT; ?>/js/app.js"></script>
</body>

</html>