<?php
session_start();

function flash($name = '', $message = '') {
  if(!empty($name)) {
    if (!empty($message)) {
      if (empty($_SESSION[$name])) {
        $_SESSION[$name] = $message;
      }
    } elseif (empty($message) && !empty($_SESSION[$name])) {
      $flash = $_SESSION[$name];
      echo '<div>' . $flash . '</div>';
      unset($_SESSION[$name]);
      return $flash;
    }
  }
}

function isLoggedIn() {
  if (isset($_SESSION['user_id'])) {
    return true;
  } else {
    return false;
  }
}