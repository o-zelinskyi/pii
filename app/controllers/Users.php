<?php
  class Users extends Controller {
    public function __construct() {
      $this->userModel = $this->model('User');
    }

    public function index() {
      $this->view('users/login'); 
    }

    public function register() {
      
      if($_SERVER['REQUEST_METHOD'] == 'POST') {
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

        if(empty($data['email'])) {
          $data['email_err'] = 'Please enter your email.';
        } else {
          if(!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $data['email_err'] = 'Please enter a valid email address.';
          }
          if($this->userModel->findUserByEmail($data['email'])) {
            $data['email_err'] = 'Email is already taken.';
          }
        }

        if(empty($data['password'])) {
          $data['password_err'] = 'Please enter your password.';
        } else {
          if(strlen($data['password']) < 6) {
            $data['password_err'] = 'Password must be at least 6 characters.';
          }
        }

        if(empty($data['firstname'])) {
          $data['firstname_err'] = 'Please enter your first name.';
        } else {
          if(!preg_match("/^[a-zA-Z ]*$/", $data['firstname'])) {
            $data['firstname_err'] = 'Only letters and white space allowed.';
          }
        }

        if(empty($data['lastname'])) {
          $data['lastname_err'] = 'Please enter your last name.';
        } else {
          if(!preg_match("/^[a-zA-Z ]*$/", $data['lastname'])) {
            $data['lastname_err'] = 'Only letters and white space allowed.';
          }
        }

        if(empty($data['email_err']) && empty($data['password_err']) && empty($data['firstname_err']) && 
        empty($data['lastname_err'])) {

          $data['password'] = password_hash($data['password'], PASSWORD_DEFAULT);

          if($this->userModel->register($data)) {
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

    public function login() {
      if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $_POST = filter_input_array(INPUT_POST, FILTER_SANITIZE_STRING);

        $data = [
          'email' => trim($_POST['email']),
          'password' => trim($_POST['password']),
          'email_err' => '',
          'password_err' => ''
        ];

        if(empty($data['email'])) {
          $data['email_err'] = 'Please enter your email.';
        } else {
          if(!filter_var($data['email'], FILTER_VALIDATE_EMAIL)) {
            $data['email_err'] = 'Please enter a valid email address.';
          }
        }

        if(empty($data['password'])) {
          $data['password_err'] = 'Please enter your password.';
        } else {
          if(strlen($data['password']) < 6) {
            $data['password_err'] = 'Password must be at least 6 characters.';
          }
        }

        if($this->userModel->findUserByEmail($data['email'])) {
          // User found
        } else {
          $data['email_err'] = 'No user found.';
        }

        if(empty($data['email_err']) && empty($data['password_err'])) {
          $loggedInUser = $this->userModel->login($data['email'], $data['password']);

          if($loggedInUser) {
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

    public function createUserSession($user) {
      $_SESSION['user_id'] = $user->id;
      $_SESSION['user_email'] = $user->email;
      $_SESSION['user_firstname'] = $user->firstname;
      $_SESSION['user_lastname'] = $user->lastname;

      redirect('table');
    } 

    public function logout() {
      unset($_SESSION['user_id']);
      unset($_SESSION['user_email']);
      unset($_SESSION['user_firstname']);
      unset($_SESSION['user_lastname']);

      session_destroy();
      redirect('users/login');
    }
  }