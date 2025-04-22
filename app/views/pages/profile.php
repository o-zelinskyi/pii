<?php
$sitename = 'Profile';
require APPROOT . '/views/inc/head.php';
require APPROOT . '/views/inc/header.php'; ?>

<div class="auth-window">
  <form class="auth-form" action="<?php echo URLROOT; ?>/users/profileEdit" method="POST">
    <div class=" auth-input-group">
      <label for=" firstname">Firstname</label>
      <input type="text" class="form-control <?php echo (!empty($data->firstname_err)) ? 'invalid' : '' ?>"
        id="firstname" name="firstname" value="<?php echo $_SESSION['user_firstname']; ?>" required>
      <input type="number" for="id" hidden value="<?php echo $_SESSION['user_id']; ?>" name="id" id="id">
    </div>
    <div class=" auth-input-group">
      <label for="lastname">Lastname</label>
      <input type="text" class="form-control <?php echo (!empty($data['lastname_err'])) ? 'invalid' : '' ?>"
        id="lastname" name="lastname" value="<?php echo $_SESSION['user_lastname']; ?>" required>
    </div>
    <div class="auth-input-group">
      <label for="email">Email</label>
      <input type="email" class="form-control <?php echo (!empty($data['email_err'])) ? 'invalid' : '' ?>"
        id="email" name="email" value="<?php echo $_SESSION['user_email']; ?>" required>
    </div>
    <div class="auth-input-group">
      <label for="studygroup">Study group</label>
      <select id="studygroup" name="studygroup" required>
        <option value="">-- Choose an option --</option>
        <option value="PZ-24" <?php if ($_SESSION['user_studygroup'] == "PZ-24") echo "selected"; ?>>PZ-24</option>
        <option value="PZ-25" <?php if ($_SESSION['user_studygroup'] == "PZ-25") echo "selected"; ?>>PZ-25</option>
        <option value="PZ-26" <?php if ($_SESSION['user_studygroup'] == "PZ-26") echo "selected"; ?>>PZ-26</option>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="24px"
          viewBox="0 -960 960 960"
          width="24px"
          fill="#e3e3e3">
          <path d="M480-360 280-560h400L480-360Z"></path>
        </svg>
      </select>
    </div>
    <div class="auth-input-group">
      <label for="gender">Gender</label>
      <select id="gender" name="gender">
        <option value="">-- Choose an option --</option>
        <option value="Male" <?php if ($_SESSION['user_gender'] == "Male") echo "selected"; ?>>Male</option>
        <option value="Female" <?php if ($_SESSION['user_gender'] == "Female") echo "selected"; ?>>Female</option>
        <option value="Other" <?php if ($_SESSION['user_gender'] == "Other") echo "selected"; ?>>Other</option>
      </select>
    </div>
    <div class="auth-input-group">
      <label for="birthday">Birthday</label>
      <input type="date" class="form-control"
        id="birthday" name="birthday" value="<?php echo $_SESSION['user_birthday']; ?>" required>
    </div>
    <div class="auth-input-group">
      <label for="password">Password</label>
      <input type="password" class="form-control <?php echo (!empty($data['password_err'])) ? 'invalid' : '' ?>"
        id="password" name="password" value="" required>
    </div>
    <button type="submit" class="btn btn-primary">Edit</button>
  </form>
</div>
<?php require APPROOT . '/views/inc/footer.php'; ?>