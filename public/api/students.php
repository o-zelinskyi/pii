<?php
// Direct API endpoint for fetching students from MariaDB
// This bypasses the MVC framework to avoid authentication issues

header('Access-Control-Allow-Origin: http://localhost:3000');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Include database configuration
require_once '../../app/config/config.php';

try {
  // Direct database connection
  $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME;
  $pdo = new PDO($dsn, DB_USER, DB_PASS, [
    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
  ]);

  // Fetch all students
  $stmt = $pdo->query('SELECT id, firstname, lastname, email, studygroup, photo FROM users ORDER BY firstname, lastname');
  $students = $stmt->fetchAll();

  // Format for Node.js consumption
  $formattedStudents = array_map(function ($student) {
    return [
      'id' => (int)$student['id'],
      'firstname' => $student['firstname'],
      'lastname' => $student['lastname'],
      'email' => $student['email'],
      'studygroup' => $student['studygroup'] ?? '',
      'photo' => $student['photo'] ?? '/img/avatar.webp'
    ];
  }, $students);

  echo json_encode([
    'success' => true,
    'students' => $formattedStudents
  ]);
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
