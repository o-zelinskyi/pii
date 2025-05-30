<?php
class ChatApiController extends Controller
{
  public function getUsersForChat()
  {
    if (!isLoggedIn()) {
      http_response_code(401);
      echo json_encode(['error' => 'Unauthorized']);
      return;
    }

    $userModel = $this->model('User');
    $users = $userModel->getAllStudents(); // Get from MariaDB

    // Format for chat system
    $chatUsers = array_map(function ($user) {
      return [
        'id' => $user->id,
        'firstname' => $user->firstname,
        'lastname' => $user->lastname,
        'email' => $user->email,
        'avatar' => $user->avatar ?? null
      ];
    }, $users);
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'users' => $chatUsers]);
  }
  public function getStudentsForNodeServer()
  {
    // Debug output first
    error_log("getStudentsForNodeServer called");

    // Allow Node.js server to access this endpoint
    header('Access-Control-Allow-Origin: http://localhost:3000');
    header('Access-Control-Allow-Methods: GET');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Content-Type: application/json');

    // Exit early to test if this method is being called
    echo json_encode([
      'debug' => 'getStudentsForNodeServer method called',
      'success' => true,
      'message' => 'API endpoint is working'
    ]);
    exit();

    try {
      $userModel = $this->model('User');
      $students = $userModel->getAllStudents();

      // Format for Node.js consumption
      $formattedStudents = array_map(function ($student) {
        return [
          'id' => (int)$student->id,
          'firstname' => $student->firstname,
          'lastname' => $student->lastname,
          'email' => $student->email,
          'studygroup' => $student->studygroup ?? '',
          'photo' => $student->photo ?? '/img/avatar.webp'
        ];
      }, $students);

      echo json_encode([
        'success' => true,
        'students' => $formattedStudents
      ]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode([
        'success' => false,
        'message' => 'Failed to fetch students',
        'error' => $e->getMessage()
      ]);
    }
  }

  public function syncUserToMongoDB()
  {
    if (!isLoggedIn()) {
      http_response_code(401);
      echo json_encode(['error' => 'Unauthorized']);
      return;
    }

    $userData = [
      'user_id' => $_SESSION['user_id'],
      'email' => $_SESSION['user_email'],
      'firstname' => $_SESSION['user_firstname'],
      'lastname' => $_SESSION['user_lastname']
    ];

    // Send to Node.js server for MongoDB sync
    $this->syncWithNodeServer($userData);
  }

  private function syncWithNodeServer($userData)
  {
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'http://localhost:3000/api/sync-user');
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($userData));
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

    $response = curl_exec($ch);
    curl_close($ch);

    return json_decode($response, true);
  }
}
