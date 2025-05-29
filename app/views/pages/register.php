<?php
$sitename = 'Register';
require APPROOT . '/views/inc/head.php';
require APPROOT . '/views/inc/head_end.php';
require APPROOT . '/views/inc/header.php'; ?>

<div class="auth-window">
  <form class="auth-form" action="<?php echo URLROOT; ?>/users/register" method="POST">
    <div class="auth-input-group">
      <label for="firstname">Firstname</label>
      <input type="text" class="form-control <?php echo (!empty($data->firstname_err)) ? 'invalid' : '' ?>"
        id="firstname" name="firstname" value="<?php echo $data['firstname']; ?>" required>
      <span class="error-message"><?php echo $data['firstname_err']; ?></span>
    </div>
    <div class="auth-input-group">
      <label for="lastname">Lastname</label>
      <input type="text" class="form-control <?php echo (!empty($data['lastname_err'])) ? 'invalid' : '' ?>"
        id="lastname" name="lastname" value="<?php echo $data['lastname']; ?>" required>
      <span class="error-message"><?php echo $data['lastname_err']; ?></span>
    </div>
    <div class="auth-input-group">
      <label for="email">Email</label>
      <input type="email" class="form-control <?php echo (!empty($data['email_err'])) ? 'invalid' : '' ?>"
        id="email" name="email" value="<?php echo $data['email']; ?>" required>
      <span class="error-message"><?php echo $data['email_err']; ?></span>
    </div>
    <div class="auth-input-group">
      <label for="password">Password</label>
      <input type="password" class="form-control <?php echo (!empty($data['password_err'])) ? 'invalid' : '' ?>"
        id="password" name="password" required>
      <span class="error-message"><?php echo $data['password_err']; ?></span>
    </div>
    <button type="submit" class="btn btn-primary">Register</button>
    <div class="auth-form-group">
      <p>Already have an account? <a href="<?php echo URLROOT; ?>/users/login">Login here</a></p>
    </div>
  </form>
</div>