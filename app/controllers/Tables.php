<?php
class Tables extends Controller
{
  public function __construct()
  {
    if (!isLoggedIn()) {
      redirect('users/login');
    }

    $this->tableModel = $this->model('Table');
  }

  public function index()
  {
    $rows = $this->tableModel->getAllStudents();
    $data = [
      'rows' => $rows
    ];
    $this->view('pages/students', $data);
  }

  public function add()
  {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      if (ob_get_level()) ob_end_clean();

      header('Content-Type: application/json');

      ini_set('display_errors', 0);

      try {
        $data = [
          'studygroup' => trim($_POST['studygroup'] ?? ''),
          'firstname' => trim($_POST['firstname'] ?? ''),
          'lastname' => trim($_POST['lastname'] ?? ''),
          'gender' => trim($_POST['gender'] ?? ''),
          'birthday' => trim($_POST['birthday'] ?? ''),
          'email' => trim($_POST['email'] ?? ''),
          'password' => trim($_POST['password'] ?? '')
        ];

        // Add the student to the database
        $result = $this->tableModel->addStudent($data);

        if ($result) {
          // Return success response
          echo json_encode(['success' => true, 'message' => 'Student added successfully']);
        } else {
          // Return error response
          echo json_encode(['success' => false, 'message' => 'Failed to add student']);
        }
      } catch (Exception $e) {
        // Handle any exceptions and return a proper JSON error
        echo json_encode([
          'success' => false,
          'message' => 'Server error occurred',
          'error' => $e->getMessage()
        ]);
      }

      // Make sure to exit after sending JSON response
      exit;
    } else {
      // Handle non-POST requests if needed
      header('Content-Type: application/json');
      echo json_encode(['success' => false, 'message' => 'Invalid request method']);
      exit;
    }
  }

  public function edit()
  {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      if (ob_get_level()) ob_end_clean();

      header('Content-Type: application/json');

      ini_set('display_errors', 0);

      try {
        $data = [
          'id' => trim($_POST['id'] ?? ''),
          'studygroup' => trim($_POST['studygroup'] ?? ''),
          'firstname' => trim($_POST['firstname'] ?? ''),
          'lastname' => trim($_POST['lastname'] ?? ''),
          'gender' => trim($_POST['gender'] ?? ''),
          'birthday' => trim($_POST['birthday'] ?? ''),
          'email' => trim($_POST['email'] ?? ''),
          'password' => trim($_POST['password'] ?? '')
        ];

        // Add the student to the database
        $result = $this->tableModel->editStudent($data);

        if ($result) {
          // Return success response
          echo json_encode(['success' => true, 'message' => 'Student added successfully']);
        } else {
          // Return error response
          echo json_encode(['success' => false, 'message' => 'Failed to add student']);
        }
      } catch (Exception $e) {
        // Handle any exceptions and return a proper JSON error
        echo json_encode([
          'success' => false,
          'message' => 'Server error occurred',
          'error' => $e->getMessage()
        ]);
      }

      // Make sure to exit after sending JSON response
      exit;
    } else {
      // Handle non-POST requests if needed
      header('Content-Type: application/json');
      echo json_encode(['success' => false, 'message' => 'Invalid request method']);
      exit;
    }
  }


  public function delete()
  {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {
      $ids = $_POST['ids'];
      foreach ($ids as $id) {
        $this->tableModel->deleteStudent($id);
      }
    }
    $rows = $this->tableModel->getAllStudents();
    $data = [
      'rows' => $rows
    ];
    $this->view('pages/students', $data);
  }

  public function students()
  {
    $this->view('pages/students');
  }

  public function dashboard()
  {
    $this->view('pages/dashboard');
  }
}
