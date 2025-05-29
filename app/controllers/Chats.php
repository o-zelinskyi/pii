<?php
class Chats extends Controller
{
  public function index()
  {
    if (!isLoggedIn()) {
      redirect('users/login');
    }

    $chatToken = $this->generateChatToken($_SESSION['user_id']);

    $data = [
      'user' => [
        'id' => $_SESSION['user_id'],
        'email' => $_SESSION['user_email'],
        'firstname' => $_SESSION['user_firstname'],
        'lastname' => $_SESSION['user_lastname']
      ],
      'chat_token' => $chatToken,
      'node_server_url' => 'http://localhost:3000'
    ];

    $this->view('chat/index', $data);
  }

  private function generateChatToken($userId)
  {
    $payload = [
      'user_id' => $userId,
      'timestamp' => time(),
      'expires' => time() + 3600 // 1 hour
    ];
    return base64_encode(json_encode($payload));
  }

  public function messages()
  {
    // Get current user data for socket connection
    $userData = [
      'user_id' => $_SESSION['user_id'],
      'email' => $_SESSION['user_email'],
      'firstname' => $_SESSION['user_firstname'],
      'lastname' => $_SESSION['user_lastname'],
      'photo' => $_SESSION['user_photo'] ?? '/img/avatar.webp'
    ];

    // Get all students for chat creation
    $students = $this->tableModel->getAllStudents();

    $data = [
      'currentUser' => $userData,
      'students' => $students,
      'socketUrl' => 'http://localhost:3000'
    ];

    $this->view('pages/chat', $data);
  }

  public function api()
  {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
      http_response_code(405);
      echo json_encode(['error' => 'Method not allowed']);
      return;
    }

    header('Content-Type: application/json');

    $input = json_decode(file_get_contents('php://input'), true);
    $action = $input['action'] ?? '';

    switch ($action) {
      case 'getStudents':
        $this->getStudents();
        break;
      case 'getUserInfo':
        $this->getUserInfo($input['user_id'] ?? null);
        break;
      default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid action']);
    }
  }

  private function getStudents()
  {
    try {
      $students = $this->tableModel->getAllStudents();

      // Format students data for chat
      $formattedStudents = array_map(function ($student) {
        return [
          'id' => $student->id,
          'firstname' => $student->firstname,
          'lastname' => $student->lastname,
          'email' => $student->email,
          'studygroup' => $student->studygroup ?? '',
          'photo' => $student->photo ?? '/img/avatar.webp',
          'isOnline' => $student->isLoggedIn ?? false
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
        'error' => 'Failed to fetch students'
      ]);
    }
  }

  private function getUserInfo($userId)
  {
    if (!$userId) {
      http_response_code(400);
      echo json_encode(['error' => 'User ID required']);
      return;
    }

    try {
      $user = $this->tableModel->getStudentById($userId);

      if (!$user) {
        http_response_code(404);
        echo json_encode(['error' => 'User not found']);
        return;
      }

      echo json_encode([
        'success' => true,
        'user' => [
          'id' => $user->id,
          'firstname' => $user->firstname,
          'lastname' => $user->lastname,
          'email' => $user->email,
          'studygroup' => $user->studygroup ?? '',
          'photo' => $user->photo ?? '/img/avatar.webp',
          'isOnline' => $user->isLoggedIn ?? false
        ]
      ]);
    } catch (Exception $e) {
      http_response_code(500);
      echo json_encode([
        'success' => false,
        'error' => 'Failed to fetch user info'
      ]);
    }
  }

  public function dashboard()
  {
    $this->view('pages/dashboard');
  }
}
