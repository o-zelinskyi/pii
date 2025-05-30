<?php
class Core
{
  protected $currentController = 'Tables';
  protected $currentMethod = 'index';
  protected $params = [];
  public function __construct()
  {
    $url = $this->getUrl();

    // Debug logging
    error_log("Core constructor called with URL: " . print_r($url, true));

    if (isset($url[0])) {
      // Handle API routes
      if ($url[0] === 'api' && isset($url[1])) {
        error_log("API route detected: " . $url[1]);
        $apiController = ucwords($url[1]) . 'Api';
        $controllerPath = '../app/controllers/API/' . $apiController . '.php';
        error_log("Looking for controller: " . $controllerPath);

        if (file_exists($controllerPath)) {
          error_log("API controller found, loading: " . $apiController);
          require_once $controllerPath;
          $this->currentController = new ($apiController . 'Controller');

          if (isset($url[2])) {
            if (method_exists($this->currentController, $url[2])) {
              $this->currentMethod = $url[2];
              error_log("API method found: " . $url[2]);
              unset($url[0], $url[1], $url[2]);
            }
          }

          $this->params = $url ? array_values($url) : [];
          call_user_func_array([$this->currentController, $this->currentMethod], $this->params);
          return;
        } else {
          error_log("API controller not found: " . $controllerPath);
        }
      }

      // Regular controller routing
      if (file_exists('../app/controllers/' . ucwords($url[0]) . '.php')) {
        $this->currentController = ucwords($url[0]);
        unset($url[0]);
      }
    }

    require_once '../app/controllers/' . $this->currentController . '.php';

    $this->currentController = new $this->currentController;

    if (isset($url[1])) {
      if (method_exists($this->currentController, $url[1])) {
        $this->currentMethod = $url[1];

        unset($url[1]);
      }
    }

    $this->params = $url ? array_values($url) : [];

    call_user_func_array([$this->currentController, $this->currentMethod], $this->params);
  }

  public function getUrl()
  {
    if (isset($_GET['url'])) {
      $url = rtrim($_GET['url'], '/');
      $url = filter_var($url, FILTER_SANITIZE_URL);
      $url = explode('/', $url);
      return ($url);
    }
    return [];
  }
}
