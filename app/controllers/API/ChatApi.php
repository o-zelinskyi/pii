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
