<?php

class UserApi extends Controller
{
  private $userModel;
  private $userSyncService;

  public function __construct()
  {
    $this->userModel = $this->model('User');
    require_once APPROOT . '/services/UserSyncService.php';
    $this->userSyncService = new UserSyncService();
  }

  /**
   * Get users for chat creation
   * GET /api/user/list
   */
  public function list()
  {
    try {
      // Set JSON response header
      header('Content-Type: application/json');
      header('Access-Control-Allow-Origin: *');
      header('Access-Control-Allow-Methods: GET');

      $search = $_GET['search'] ?? '';
      $excludeId = (int)($_GET['exclude_id'] ?? 0);

      // Get users from MariaDB
      $users = $this->userModel->getUsersForChat($search, $excludeId);

      // Format users for JSON response
      $formattedUsers = array_map(function ($user) {
        return [
          'id' => $user->id,
          'firstname' => $user->firstname,
          'lastname' => $user->lastname,
          'email' => $user->email,
          'photo' => $user->photo ?? null,
          'studygroup' => $user->studygroup ?? null,
          'isLoggedIn' => (bool)$user->isLoggedIn
        ];
      }, $users);

      echo json_encode([
        'success' => true, // Added success flag
        'users' => $formattedUsers, // Added users key
        'count' => count($formattedUsers)
      ]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch users',
        'error' => $e->getMessage()
      ]);
    }
  }

  /**
   * Get specific user details
   * GET /api/user/details/{id}
   */
  public function details($id = null)
  {
    try {
      header('Content-Type: application/json');
      header('Access-Control-Allow-Origin: *');
      header('Access-Control-Allow-Methods: GET');

      if (!$id) {
        http_response_code(400);
        echo json_encode([
          'success' => false,
          'message' => 'User ID is required'
        ]);
        return;
      }

      $user = $this->userModel->getUserById($id);

      if ($user) {
        $formattedUser = [
          'id' => (int)$user->id,
          'firstname' => $user->firstname,
          'lastname' => $user->lastname,
          'email' => $user->email,
          'studygroup' => $user->studygroup ?? '',
          'gender' => $user->gender ?? '',
          'birthday' => $user->birthday ?? '',
          'photo' => $user->photo ?? '/img/avatar.webp',
          'isOnline' => (bool)$user->isLoggedIn,
          'status' => $user->isLoggedIn ? 'Online' : 'Offline'
        ];

        echo json_encode([
          'success' => true,
          'user' => $formattedUser
        ]);
      } else {
        http_response_code(404);
        echo json_encode([
          'success' => false,
          'message' => 'User not found'
        ]);
      }
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch user details',
        'error' => $e->getMessage()
      ]);
    }
  }

  /**
   * Sync user data with MongoDB
   * POST /api/user/sync
   */
  public function sync()
  {
    try {
      header('Content-Type: application/json');
      header('Access-Control-Allow-Origin: *');
      header('Access-Control-Allow-Methods: POST');
      header('Access-Control-Allow-Headers: Content-Type');

      if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        echo json_encode([
          'success' => false,
          'message' => 'Method not allowed'
        ]);
        return;
      }

      $input = json_decode(file_get_contents('php://input'), true);

      if (!$input) {
        http_response_code(400);
        echo json_encode([
          'success' => false,
          'message' => 'Invalid JSON input'
        ]);
        return;
      }

      $action = $input['action'] ?? '';
      $userData = $input['user'] ?? [];
      $userId = $input['user_id'] ?? 0;

      switch ($action) {
        case 'login':
          $result = $this->userSyncService->syncUserLogin($userData);
          break;
        case 'update':
          $result = $this->userSyncService->syncUserUpdate($userData);
          break;
        case 'logout':
          $result = $this->userSyncService->syncUserLogout($userId);
          break;
        default:
          http_response_code(400);
          echo json_encode([
            'success' => false,
            'message' => 'Invalid action. Supported actions: login, update, logout'
          ]);
          return;
      }

      echo json_encode([
        'success' => $result,
        'message' => $result ? 'User sync successful' : 'User sync failed'
      ]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode([
        'success' => false,
        'message' => 'Failed to sync user data',
        'error' => $e->getMessage()
      ]);
    }
  }

  /**
   * Get online users
   * GET /api/user/online
   */
  public function online()
  {
    try {
      header('Content-Type: application/json');
      header('Access-Control-Allow-Origin: *');
      header('Access-Control-Allow-Methods: GET');

      $users = $this->userModel->getOnlineUsers();

      $formattedUsers = array_map(function ($user) {
        return [
          'id' => (int)$user->id,
          'firstname' => $user->firstname,
          'lastname' => $user->lastname,
          'email' => $user->email,
          'studygroup' => $user->studygroup ?? '',
          'photo' => $user->photo ?? '/img/avatar.webp',
          'isOnline' => true,
          'status' => 'Online'
        ];
      }, $users);

      echo json_encode([
        'success' => true,
        'users' => $formattedUsers,
        'count' => count($formattedUsers)
      ]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch online users',
        'error' => $e->getMessage()
      ]);
    }
  }
}
