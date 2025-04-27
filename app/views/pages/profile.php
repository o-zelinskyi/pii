<?php
$sitename = 'Profile';
require APPROOT . '/views/inc/head.php';
require APPROOT . '/views/inc/header.php'; ?>

<div class="auth-window">
  <form class="auth-form" action="<?php echo URLROOT; ?>/users/profileEdit" method="POST" enctype="multipart/form-data">
    <div class=" auth-input-group">
      <label for="firstname">Firstname</label>
      <input type="text" class="form-control <?php echo (!empty($data['firstname_err'])) ? 'invalid' : '' ?>"
        id="firstname" name="firstname" value="<?php echo isset($data['firstname']) ? $data['firstname'] : $_SESSION['user_firstname']; ?>" required>
      <input type="number" for="id" hidden value="<?php echo $_SESSION['user_id']; ?>" name="id" id="id">
      <?php if (!empty($data['firstname_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['firstname_err']; ?></span>
      <?php endif; ?>
    </div>
    <div class="auth-input-group">
      <label for="lastname">Lastname</label>
      <input type="text" class="form-control <?php echo (!empty($data['lastname_err'])) ? 'invalid' : '' ?>"
        id="lastname" name="lastname" value="<?php echo isset($data['lastname']) ? $data['lastname'] : $_SESSION['user_lastname']; ?>" required>
      <?php if (!empty($data['lastname_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['lastname_err']; ?></span>
      <?php endif; ?>
    </div>
    <div class="auth-input-group">
      <label for="photo">Profile picture</label>
      <label for="photo" class="photo-upload">Upload your photo</label>
      <input type="file" class="form-control <?php echo (!empty($data['photo_err'])) ? 'invalid' : '' ?>"
        id="photo" name="photo" accept="image/*">
      <?php if (!empty($data['photo_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['photo_err']; ?></span>
      <?php endif; ?>
    </div>
    <div class="auth-input-group">
      <label for="email">Email</label>
      <input type="email" class="form-control <?php echo (!empty($data['email_err'])) ? 'invalid' : '' ?>"
        id="email" name="email" value="<?php echo isset($data['email']) ? $data['email'] : $_SESSION['user_email']; ?>" required>
      <?php if (!empty($data['email_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['email_err']; ?></span>
      <?php endif; ?>
    </div>
    <div class="auth-input-group">
      <label for="studygroup">Study group</label>
      <select id="studygroup" name="studygroup" class="<?php echo (!empty($data['studygroup_err'])) ? 'invalid' : '' ?>" required>
        <option value="">-- Choose an option --</option>
        <option value="PZ-24" <?php if ((isset($data['studygroup']) && $data['studygroup'] == "PZ-24") || (!isset($data['studygroup']) && $_SESSION['user_studygroup'] == "PZ-24")) echo "selected"; ?>>PZ-24</option>
        <option value="PZ-25" <?php if ((isset($data['studygroup']) && $data['studygroup'] == "PZ-25") || (!isset($data['studygroup']) && $_SESSION['user_studygroup'] == "PZ-25")) echo "selected"; ?>>PZ-25</option>
        <option value="PZ-26" <?php if ((isset($data['studygroup']) && $data['studygroup'] == "PZ-26") || (!isset($data['studygroup']) && $_SESSION['user_studygroup'] == "PZ-26")) echo "selected"; ?>>PZ-26</option>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#e3e3e3">
          <path d="M480-360 280-560h400L480-360Z"></path>
        </svg>
      </select>
      <?php if (!empty($data['studygroup_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['studygroup_err']; ?></span>
      <?php endif; ?>
    </div>
    <div class="auth-input-group">
      <label for="gender">Gender</label>
      <select id="gender" name="gender" class="<?php echo (!empty($data['gender_err'])) ? 'invalid' : '' ?>">
        <option value="">-- Choose an option --</option>
        <option value="Male" <?php if ((isset($data['gender']) && $data['gender'] == "Male") || (!isset($data['gender']) && $_SESSION['user_gender'] == "Male")) echo "selected"; ?>>Male</option>
        <option value="Female" <?php if ((isset($data['gender']) && $data['gender'] == "Female") || (!isset($data['gender']) && $_SESSION['user_gender'] == "Female")) echo "selected"; ?>>Female</option>
        <option value="Other" <?php if ((isset($data['gender']) && $data['gender'] == "Other") || (!isset($data['gender']) && $_SESSION['user_gender'] == "Other")) echo "selected"; ?>>Other</option>
      </select>
      <?php if (!empty($data['gender_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['gender_err']; ?></span>
      <?php endif; ?>
    </div>
    <div class="auth-input-group">
      <label for="birthday">Birthday</label>
      <input type="date" class="form-control <?php echo (!empty($data['birthday_err'])) ? 'invalid' : '' ?>"
        id="birthday" name="birthday" value="<?php echo isset($data['birthday']) ? $data['birthday'] : $_SESSION['user_birthday']; ?>" required>
      <?php if (!empty($data['birthday_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['birthday_err']; ?></span>
      <?php endif; ?>
    </div>
    <div class="auth-input-group">
      <label for="password">Password</label>
      <input type="password" class="form-control <?php echo (!empty($data['password_err'])) ? 'invalid' : '' ?>"
        id="password" name="password" value="">
      <small>Leave empty to keep current password</small>
      <?php if (!empty($data['password_err'])) : ?>
        <span class="invalid-feedback"><?php echo $data['password_err']; ?></span>
      <?php endif; ?>
    </div>
    <button type="submit" class="btn btn-primary">Edit</button>
  </form>
</div>
<?php require APPROOT . '/views/inc/footer.php'; ?>