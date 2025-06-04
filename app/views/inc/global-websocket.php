<?php
// Check if user is logged in
if (isset($_SESSION['user_id'])) {
  // Prepare user data for JavaScript
  $userData = [
    'user_id' => $_SESSION['user_id'],
    'email' => $_SESSION['user_email'],
    'firstname' => $_SESSION['user_firstname'],
    'lastname' => $_SESSION['user_lastname'],
    'photo' => isset($_SESSION['user_photo']) ? $_SESSION['user_photo'] : '/img/avatar.webp'
  ];

  // Socket URL - should be consistent across the application
  $socketUrl = 'http://localhost:3000';
?>
  <script>
    // Make user data available globally
    window.currentUser = <?php echo json_encode($userData); ?>;
    window.socketUrl = "<?php echo $socketUrl; ?>";
    window.urlRoot = "<?php echo URLROOT; ?>";
  </script>
  <script src="https://cdn.socket.io/4.7.5/socket.io.min.js"></script>
  <script src="<?php echo URLROOT; ?>/js/notification-system.js"></script>
  <script src="<?php echo URLROOT; ?>/js/notifications.js"></script>
  <script src="<?php echo URLROOT; ?>/js/websocket-client.js"></script>
  <script src="<?php echo URLROOT; ?>/js/global-websocket.js"></script>
  <script src="<?php echo URLROOT; ?>/js/websocket-test.js"></script>
<?php } ?>