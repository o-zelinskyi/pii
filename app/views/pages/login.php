<?php 
$sitename = 'Log In';
require APPROOT . '/views/inc/head.php';
require APPROOT . '/views/inc/header.php'; ?>

<form action="<?php echo URLROOT; ?>/users/login" method="POST">
  <?php flash('register_success'); ?>
  <div class="form-group">
    <label for="email">Email</label>
    <input type="email" class="form-control <?php echo (!empty($data['email_err'])) ? 'invalid' : '' ?>"
    id="email" name="email" value="<?php echo $data['email']; ?>" required>
    <span class="error-message"><?php echo $data['email_err']; ?></span> 
    </div>
  <div class="form-group">
    <label for="password">Password</label>
    <input type="password" class="form-control" id="password" name="password" required>
  </div>
  <button type="submit" class="btn btn-primary">Log In</button>
  <div class="form-group">
    <p>Don't have an account? <a href="<?php echo URLROOT; ?>/users/register">Register here</a></p>
  </div>
</form>