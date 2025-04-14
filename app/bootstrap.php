<?php
  require_once 'config/config.php';

  // spl_autoload_register(function($className) {
  //   require_once 'libraries/' . $className . '.php';
  // });

  require_once 'helpers/url_helper.php';
  require_once 'helpers/session_helper.php';

  spl_autoload_register(function($className) {
    $paths = [
      'libraries/',
      'models/',
      'controllers/',
    ];
    
    foreach ($paths as $path) {
      $file = '../app/' . $path . $className . '.php';
      if (file_exists($file)) {
        require_once $file;
        return;
      }
    }
  });