<?php
// API endpoint for fetching users from MariaDB for chat creation
// This bypasses the MVC framework to avoid authentication issues

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  http_response_code(200);
  exit();
}

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration
require_once '../../app/config/config.php';
require_once '../../app/services/UserSyncService.php';

try {
  // Direct database connection
  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
  ]);

  // Handle different request methods
  $method = $_SERVER['REQUEST_METHOD'];

  switch ($method) {
    case 'GET':
      handleGetUsers($pdo);
      break;
    case 'POST':
      handleSyncUser($pdo);
      break;
    default:
      http_response_code(405);
      echo json_encode(['success' => false, 'message' => 'Method not allowed']);
  }
} catch (PDOException $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Database error: ' . $e->getMessage()
  ]);
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'message' => 'Error: ' . $e->getMessage()
  ]);
}

function handleGetUsers($pdo)
{
  // Get search parameter if provided
  $search = $_GET['search'] ?? '';
  $exclude_id = $_GET['exclude_id'] ?? 0;

  // Build query with optional search
  $sql = 'SELECT id, firstname, lastname, email, studygroup, photo, isLoggedIn FROM users WHERE 1=1';
  $params = [];

  if (!empty($search)) {
    $sql .= ' AND (firstname LIKE :search OR lastname LIKE :search OR email LIKE :search)';
    $params['search'] = '%' . $search . '%';
  }

  if ($exclude_id > 0) {
    $sql .= ' AND id != :exclude_id';
    $params['exclude_id'] = $exclude_id;
  }

  $sql .= ' ORDER BY isLoggedIn DESC, firstname, lastname';

  $stmt = $pdo->prepare($sql);
  $stmt->execute($params);
  $users = $stmt->fetchAll();

  // Format for consumption
  $formattedUsers = array_map(function ($user) {
    return [
      'id' => $user['id'],
      'firstname' => $user['firstname'],
      'lastname' => $user['lastname'],
      'email' => $user['email'],
      'studygroup' => $user['studygroup'] ?? null,
      'photo' => $user['photo'] ?? null,
      'isLoggedIn' => (bool)$user['isLoggedIn']
    ];
  }, $users);

  echo json_encode([
    'success' => true,
    'users' => $formattedUsers,
    'count' => count($formattedUsers)
  ]);
}

function handleSyncUser($pdo)
{
  $input = json_decode(file_get_contents('php://input'), true);

  if (!$input) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Invalid JSON input']);
    return;
  }

  // Sync user data to Node.js/MongoDB
  $syncService = new UserSyncService();

  switch ($input['action']) {
    case 'login':
      $result = $syncService->syncUserLogin($input['user']);
      break;
    case 'update':
      $result = $syncService->syncUserUpdate($input['user']);
      break;
    case 'logout':
      $result = $syncService->syncUserLogout($input['user_id']);
      break;
    default:
      http_response_code(400);
      echo json_encode(['success' => false, 'message' => 'Invalid action']);
      return;
  }

  echo json_encode([
    'success' => $result,
    'message' => $result ? 'User synced successfully' : 'Failed to sync user'
  ]);
}
