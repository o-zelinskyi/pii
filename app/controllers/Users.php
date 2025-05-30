<?php
require_once APPROOT . '/services/UserSyncService.php';

class Users extends Controller
{
  private $userSyncService;

  public function __construct()
  {
    $this->userModel = $this->model('User');
    $this->userSyncService = new UserSyncService();
  }

  public function index()
  {
    $this->view('users/login');
  }

  public function register()
  {

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $_POST = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

      $data = [
        'email' => trim($_POST['email']),
        'password' => trim($_POST['password']),
        'firstname' => trim($_POST['firstname']),
        'lastname' => trim($_POST['lastname']),
        'email_err' => '',
        'password_err' => '',
        'firstname_err' => '',
        'lastname_err' => ''
      ];

      if (empty($data['email'])) {
        $data['email_err'] = 'Please enter your email.';
      } else {
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
          $data['email_err'] = 'Please enter a valid email address.';
        }
        if ($this->userModel->findUserByEmail($data['email'])) {
          $data['email_err'] = 'Email is already taken.';
        }
      }

      if (empty($data['password'])) {
        $data['password_err'] = 'Please enter your password.';
      } else {
        if (strlen($data['password']) < 6) {
          $data['password_err'] = 'Password must be at least 6 characters.';
        }
      }

      if (empty($data['firstname'])) {
        $data['firstname_err'] = 'Please enter your first name.';
      } else {
        if (!preg_match("/^[a-zA-Z ]*$/", $data['firstname'])) {
          $data['firstname_err'] = 'Only letters and white space allowed.';
        }
      }

      if (empty($data['lastname'])) {
        $data['lastname_err'] = 'Please enter your last name.';
      } else {
        if (!preg_match("/^[a-zA-Z ]*$/", $data['lastname'])) {
          $data['lastname_err'] = 'Only letters and white space allowed.';
        }
      }

      if (
        empty($data['email_err']) && empty($data['password_err']) && empty($data['firstname_err']) &&
        empty($data['lastname_err'])
      ) {

        $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

        if ($this->userModel->register($data)) {
          flash('register_success', 'YEEEEEEEEEEEEAH! You are registered and can log in)');
          redirect('users/login');
        } else {
          die('Something went wrong.');
        }
      } else {
        $this->view('pages/register', $data);
      }
    } else {
      $data = [
        'email' => '',
        'password' => '',
        'firstname' => '',
        'lastname' => '',
        'email_err' => '',
        'password_err' => '',
        'firstname_err' => '',
        'lastname_err' => ''
      ];

      $this->view('pages/register', $data);
    }
  }

  public function login()
  {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $_POST = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

      $data = [
        'email' => trim($_POST['email']),
        'password' => trim($_POST['password']),
        'email_err' => '',
        'password_err' => ''
      ];

      if (empty($data['email'])) {
        $data['email_err'] = 'Please enter your email.';
      } else {
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
          $data['email_err'] = 'Please enter a valid email address.';
        }
      }

      if (empty($data['password'])) {
        $data['password_err'] = 'Please enter your password.';
      } else {
        if (strlen($data['password']) < 6) {
          $data['password_err'] = 'Password must be at least 6 characters.';
        }
      }

      if ($this->userModel->findUserByEmail($data['email'])) {
        // User found
      } else {
        $data['email_err'] = 'No user found.';
      }

      if (empty($data['email_err']) && empty($data['password_err'])) {
        $loggedInUser = $this->userModel->login($data['email'], $data['password']);

        if ($loggedInUser) {
          error_log(date('[Y-m-d H:i:s] ') . "Login\n", 3, __DIR__ . '/../logs/user.log');
          error_log(date('[Y-m-d H:i:s] ') . "Email: " . $data['email'] . "\n", 3, __DIR__ . '/../logs/user.log');
          error_log(date('[Y-m-d H:i:s] ') . "Password: " . $data['password'] . "\n", 3, __DIR__ . '/../logs/user.log');
          $this->createUserSession($loggedInUser);
        } else {
          $data['password_err'] = 'Password incorrect :(((';
          $this->view('pages/login', $data);
        }
      } else {
        $this->view('pages/login', $data);
      }
    } else {
      $data = [
        'email' => '',
        'password' => '',
        'email_err' => '',
        'password_err' => ''
      ];

      $this->view('pages/login', $data);
    }
  }

  public function profile()
  {
    if (!isLoggedIn()) {
      redirect('users/login');
    }

    $this->view('pages/profile', $_SESSION);
  }

  public function profileEdit()
  {
    if (!isLoggedIn()) {
      redirect('users/login');
    }

    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $_POST = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

      $data = [
        'email' => trim($_POST['email']),
        'password' => trim($_POST['password']),
        'firstname' => trim($_POST['firstname']),
        'lastname' => trim($_POST['lastname']),
        'studygroup' => trim($_POST['studygroup']),
        'gender' => trim($_POST['gender']),
        'birthday' => trim($_POST['birthday']),
        'id' => trim($_POST['id']),
        'photo' => $_SESSION['user_photo'],
        'email_err' => '',
        'password_err' => '',
        'firstname_err' => '',
        'lastname_err' => '',
        'studygroup_err' => '',
        'gender_err' => '',
        'birthday_err' => ''
      ];

      if (empty($data['email'])) {
        $data['email_err'] = 'Please enter your email.';
      } else {
        if (!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
          $data['email_err'] = 'Please enter a valid email address.';
        } else {
          $userWithEmail = $this->userModel->findUserByEmail($data['email']);
          if ($userWithEmail && is_object($userWithEmail) && $userWithEmail->id != $data['id']) {
            $data['email_err'] = 'Email is already taken by another user.';
          }
        }
      }

      if (!empty($data['password'])) {
        if (strlen($data['password']) < 8) {
          $data['password_err'] = 'Password must be at least 8 characters.';
        }
      }

      if (empty($data['firstname'])) {
        $data['firstname_err'] = 'Please enter your first name.';
      } else {
        if (!preg_match("/^[a-zA-Z ]*$/", $data['firstname'])) {
          $data['firstname_err'] = 'Only letters and white space allowed.';
        }
      }

      if (empty($data['lastname'])) {
        $data['lastname_err'] = 'Please enter your last name.';
      } else {
        if (!preg_match("/^[a-zA-Z ]*$/", $data['lastname'])) {
          $data['lastname_err'] = 'Only letters and white space allowed.';
        }
      }

      if (empty($data['studygroup'])) {
        $data['studygroup_err'] = 'Please select your study group.';
      }

      if (empty($data['birthday'])) {
        $data['birthday_err'] = 'Please enter your birthday.';
      }

      if (
        empty($data['email_err']) && empty($data['password_err']) &&
        empty($data['firstname_err']) && empty($data['lastname_err']) &&
        empty($data['studygroup_err']) && empty($data['birthday_err'])
      ) {

        if (!empty($data['password'])) {
          $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);
        } else {
          unset($data['password']);
        }
        if ($this->userModel->profileEdit($data)) {
          flash('profileEdit_success', 'YEEEEEEEEEEEEAH! edit profile successfully!');
          $_SESSION['user_id'] = $data['id'];
          $_SESSION['user_email'] = $data['email'];
          $_SESSION['user_firstname'] = $data['firstname'];
          $_SESSION['user_lastname'] = $data['lastname'];
          $_SESSION['user_photo'] = $data['photo'];
          $_SESSION['user_studygroup'] = $data['studygroup'];
          $_SESSION['user_gender'] = $data['gender'];
          $_SESSION['user_birthday'] = $data['birthday'];

          // Sync profile update to MongoDB
          $userData = [
            'user_id' => $data['id'],
            'email' => $data['email'],
            'firstname' => $data['firstname'],
            'lastname' => $data['lastname'],
            'photo' => $data['photo'] ?? '/img/avatar.webp',
            'studygroup' => $data['studygroup'] ?? '',
            'gender' => $data['gender'] ?? '',
            'birthday' => $data['birthday'] ?? ''
          ];

          $this->userSyncService->syncUserUpdate($userData);

          error_log(date('[Y-m-d H:i:s] ') . "Profile edit!!! \n", 3, __DIR__ . '/../logs/user.log');
          error_log(date('[Y-m-d H:i:s] ') . "Email: " . $_SESSION['user_email'] . "\n", 3, __DIR__ . '/../logs/user.log');
          error_log(date('[Y-m-d H:i:s] ') . "Password: " . $_SESSION['user_password'] . "\n", 3, __DIR__ . '/../logs/user.log');

          redirect('');
        } else {
          die('Something went wrong.');
        }
      } else {
        $this->view('pages/profile', $data);
      }
    } else {
      $this->view('pages/profile', $_SESSION);
    }
  }


  public function createUserSession($user)
  {
    $_SESSION['user_id'] = $user->id;
    $_SESSION['user_email'] = $user->email;
    $_SESSION['user_firstname'] = $user->firstname;
    $_SESSION['user_lastname'] = $user->lastname;
    $_SESSION['user_photo'] = $user->photo;
    $_SESSION['user_studygroup'] = $user->studygroup;
    $_SESSION['user_gender'] = $user->gender;
    $_SESSION['user_birthday'] = $user->birthday;

    // Sync user login to MongoDB
    $userData = [
      'user_id' => $user->id,
      'email' => $user->email,
      'firstname' => $user->firstname,
      'lastname' => $user->lastname,
      'photo' => $user->photo ?? '/img/avatar.webp',
      'studygroup' => $user->studygroup ?? '',
      'gender' => $user->gender ?? '',
      'birthday' => $user->birthday ?? ''
    ];

    $this->userSyncService->syncUserLogin($userData);

    redirect('table');
  }

  public function logout()
  {
    // Sync user logout to MongoDB
    if (isset($_SESSION['user_id'])) {
      $this->userSyncService->syncUserLogout($_SESSION['user_id']);
    }

    $this->userModel->logout($_SESSION['user_email']);
    $this->destroyUserSession();
  }

  public function destroyUserSession()
  {
    unset($_SESSION['user_id']);
    unset($_SESSION['user_email']);
    unset($_SESSION['user_firstname']);
    unset($_SESSION['user_lastname']);

    session_destroy();
    redirect('users/login');
  }
}
