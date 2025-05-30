<?php

/**
 * Enhanced User Synchronization Service
 * Handles real-time sync between MariaDB and MongoDB
 */
class UserSyncService
{
  private $nodeServerUrl;
  private $timeout;

  public function __construct($nodeServerUrl = 'http://localhost:3000')
  {
    $this->nodeServerUrl = rtrim($nodeServerUrl, '/');
    $this->timeout = 5; // 5 seconds timeout
  }

  /**
   * Sync user data to MongoDB when they log in
   */
  public function syncUserLogin($userData)
  {
    try {
      $syncData = [
        'action' => 'userLogin',
        'user' => [
          'user_id' => (int)$userData['user_id'],
          'email' => $userData['email'],
          'firstname' => $userData['firstname'],
          'lastname' => $userData['lastname'],
          'photo' => $userData['photo'] ?? '/img/avatar.webp',
          'studygroup' => $userData['studygroup'] ?? '',
          'gender' => $userData['gender'] ?? '',
          'birthday' => $userData['birthday'] ?? '',
          'timestamp' => date('Y-m-d H:i:s')
        ]
      ];

      return $this->sendToNodeServer('/api/sync-user', $syncData);
    } catch (Exception $e) {
      error_log("User sync error (login): " . $e->getMessage());
      return false;
    }
  }

  /**
   * Sync user data when profile is updated
   */
  public function syncUserUpdate($userData)
  {
    try {
      $syncData = [
        'action' => 'userUpdate',
        'user' => [
          'user_id' => (int)$userData['user_id'],
          'email' => $userData['email'],
          'firstname' => $userData['firstname'],
          'lastname' => $userData['lastname'],
          'photo' => $userData['photo'] ?? '/img/avatar.webp',
          'studygroup' => $userData['studygroup'] ?? '',
          'gender' => $userData['gender'] ?? '',
          'birthday' => $userData['birthday'] ?? '',
          'timestamp' => date('Y-m-d H:i:s')
        ]
      ];

      return $this->sendToNodeServer('/api/sync-user', $syncData);
    } catch (Exception $e) {
      error_log("User sync error (update): " . $e->getMessage());
      return false;
    }
  }

  /**
   * Notify MongoDB when user logs out
   */
  public function syncUserLogout($userId)
  {
    try {
      $syncData = [
        'action' => 'userLogout',
        'user_id' => (int)$userId,
        'timestamp' => date('Y-m-d H:i:s')
      ];

      return $this->sendToNodeServer('/api/sync-user', $syncData);
    } catch (Exception $e) {
      error_log("User sync error (logout): " . $e->getMessage());
      return false;
    }
  }

  /**
   * Get real-time user status from MongoDB
   */
  public function getUserStatus($userId)
  {
    try {
      $response = $this->sendToNodeServer('/api/user-status/' . $userId, null, 'GET');
      return $response['data'] ?? null;
    } catch (Exception $e) {
      error_log("User status error: " . $e->getMessage());
      return null;
    }
  }

  /**
   * Send data to Node.js server
   */
  private function sendToNodeServer($endpoint, $data = null, $method = 'POST')
  {
    $url = $this->nodeServerUrl . $endpoint;

    $ch = curl_init();
    curl_setopt_array($ch, [
      CURLOPT_URL => $url,
      CURLOPT_RETURNTRANSFER => true,
      CURLOPT_TIMEOUT => $this->timeout,
      CURLOPT_CONNECTTIMEOUT => 3,
      CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
      ]
    ]);

    if ($method === 'POST' && $data) {
      curl_setopt($ch, CURLOPT_POST, true);
      curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
    }

    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $error = curl_error($ch);
    curl_close($ch);

    if ($error) {
      throw new Exception("CURL Error: " . $error);
    }

    if ($httpCode >= 400) {
      throw new Exception("HTTP Error {$httpCode}: " . $response);
    }

    $decodedResponse = json_decode($response, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
      throw new Exception("Invalid JSON response: " . $response);
    }

    return $decodedResponse;
  }

  /**
   * Check if Node.js server is running
   */
  public function isNodeServerRunning()
  {
    try {
      $response = $this->sendToNodeServer('/health', null, 'GET');
      return isset($response['status']) && $response['status'] === 'OK';
    } catch (Exception $e) {
      return false;
    }
  }
}
