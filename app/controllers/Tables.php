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

  public function index($page = 1)
  {
    $page = (int)$page;
    if ($page < 1) $page = 1;

    // Items per page
    $perPage = 2;

    // Get paginated data
    $rows = $this->tableModel->getPaginatedStudents($page, $perPage);

    // Count total students for pagination
    $totalStudents = $this->tableModel->countStudents();
    $totalPages = ceil($totalStudents / $perPage);

    $data = [
      'rows' => $rows,
      'currentPage' => $page,
      'totalPages' => $totalPages,
      'totalStudents' => $totalStudents,
      'perPage' => $perPage
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
      error_log(date('[Y-m-d H:i:s] ') . "POST | Edit student function called in Tables.php\n", 3, __DIR__ . '/../logs/table.log');
      error_log(date('[Y-m-d H:i:s] ') . "Student ID: " . $data['id'] . "\n", 3, __DIR__ . '/../logs/table.log');
      error_log(date('[Y-m-d H:i:s] ') . "Data received: " . json_encode($data) . "\n", 3, __DIR__ . '/../logs/table.log');

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
        ];

        $result = $this->tableModel->editStudent($data);

        if ($result) {
          echo json_encode(['success' => true, 'message' => 'Student added successfully']);
        } else {
          echo json_encode(['success' => false, 'message' => 'Failed to add student']);
        }
      } catch (Exception $e) {
        echo json_encode([
          'success' => false,
          'message' => 'Server error occurred',
          'error' => $e->getMessage()
        ]);
      }

      exit;
    } else {
      header('Content-Type: application/json');
      echo json_encode(['success' => false, 'message' => 'Invalid request method']);
      exit;
    }
  }


  public function delete()
  {
    if ($_SERVER['REQUEST_METHOD'] == 'POST') {

      if (ob_get_level()) ob_end_clean();

      header('Content-Type: application/json');

      ini_set('display_errors', 0);

      try {
        $ids = $_POST['ids'];
        foreach ($ids as $id) {
          $this->tableModel->deleteStudent($id);
        }

        echo json_encode(['success' => true, 'message' => 'Students deleted successfully']);
      } catch (Exception $e) {
        echo json_encode([
          'success' => false,
          'message' => 'Server error occurred',
          'error' => $e->getMessage()
        ]);
      }
      exit();
    }
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
