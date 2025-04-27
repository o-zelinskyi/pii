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

    $perPage = 5;

    $totalStudents = $this->tableModel->countStudents();
    $totalPages = ceil($totalStudents / $perPage);

    if ($page > $totalPages && $totalPages > 0) {
      $page = $totalPages;
    }

    $rows = $this->tableModel->getPaginatedStudents($page, $perPage);

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
          'password' => trim($_POST['password'] ?? ''),
          'studygroup_err' => '',
          'firstname_err' => '',
          'lastname_err' => '',
          'gender_err' => '',
          'birthday_err' => '',
          'email_err' => '',
          'password_err' => ''
        ];

        // Validate studygroup
        if (empty($data['studygroup'])) {
          $data['studygroup_err'] = 'Будь ласка, виберіть групу.';
        }

        // Validate firstname
        if (empty($data['firstname'])) {
          $data['firstname_err'] = 'Будь ласка, введіть ім\'я.';
        } elseif (!preg_match("/^[a-zA-Zа-яА-ЯіІїЇєЄёЁ ]*$/u", $data['firstname'])) {
          $data['firstname_err'] = 'Ім\'я може містити лише літери та пробіли.';
        }

        // Validate lastname
        if (empty($data['lastname'])) {
          $data['lastname_err'] = 'Будь ласка, введіть прізвище.';
        } elseif (!preg_match("/^[a-zA-Zа-яА-ЯіІїЇєЄёЁ ]*$/u", $data['lastname'])) {
          $data['lastname_err'] = 'Прізвище може містити лише літери та пробіли.';
        }

        // Validate gender
        if (empty($data['gender'])) {
          $data['gender_err'] = 'Будь ласка, виберіть стать.';
        }

        // Validate birthday
        if (empty($data['birthday'])) {
          $data['birthday_err'] = 'Будь ласка, введіть дату народження.';
        } else {
          $birthdayDate = new DateTime($data['birthday']);
          $currentDate = new DateTime();

          if ($birthdayDate > $currentDate) {
            $data['birthday_err'] = 'Дата народження не може бути у майбутньому.';
          }

          $minDate = new DateTime('1910-01-01');
          if ($birthdayDate < $minDate) {
            $data['birthday_err'] = 'Некоректна дата народження.';
          }
        }

        // Check duplicate student
        if ($this->tableModel->findDuplicateStudent($data['firstname'], $data['lastname'], $data['studygroup'])) {
          $data['firstname_err'] = 'Студент з таким іменем та прізвищем у цій групі вже існує.';
          $data['lastname_err'] = 'Студент з таким іменем та прізвищем у цій групі вже існує.';
        }

        // Check for errors
        if (
          empty($data['studygroup_err']) &&
          empty($data['firstname_err']) &&
          empty($data['lastname_err']) &&
          empty($data['gender_err']) &&
          empty($data['birthday_err']) &&
          empty($data['email_err']) &&
          empty($data['password_err'])
        ) {


          // Add the student to the database
          $result = $this->tableModel->addStudent($data);

          if ($result) {
            // Return success response
            echo json_encode(['success' => true, 'message' => 'Student added successfully']);
          } else {
            // Return error response
            echo json_encode(['success' => false, 'message' => 'Failed to add student']);
          }
        } else {
          // Return validation errors
          echo json_encode([
            'success' => false,
            'message' => 'Помилки валідації',
            'errors' => [
              'studygroup_err' => $data['studygroup_err'],
              'firstname_err' => $data['firstname_err'],
              'lastname_err' => $data['lastname_err'],
              'gender_err' => $data['gender_err'],
              'birthday_err' => $data['birthday_err'],
              'email_err' => $data['email_err'],
              'password_err' => $data['password_err']
            ]
          ]);
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
          'studygroup_err' => '',
          'firstname_err' => '',
          'lastname_err' => '',
          'gender_err' => '',
          'birthday_err' => ''
        ];

        error_log(date('[Y-m-d H:i:s] ') . "Student ID: " . $data['id'] . "\n", 3, __DIR__ . '/../logs/table.log');
        error_log(date('[Y-m-d H:i:s] ') . "Data received: " . json_encode($data) . "\n", 3, __DIR__ . '/../logs/table.log');

        // Validate studygroup
        if (empty($data['studygroup'])) {
          $data['studygroup_err'] = 'Будь ласка, виберіть групу.';
        }

        // Validate firstname
        if (empty($data['firstname'])) {
          $data['firstname_err'] = 'Будь ласка, введіть ім\'я.';
        } elseif (!preg_match("/^[a-zA-Zа-яА-ЯіІїЇєЄёЁ ]*$/u", $data['firstname'])) {
          $data['firstname_err'] = 'Ім\'я може містити лише літери та пробіли.';
        }

        // Validate lastname
        if (empty($data['lastname'])) {
          $data['lastname_err'] = 'Будь ласка, введіть прізвище.';
        } elseif (!preg_match("/^[a-zA-Zа-яА-ЯіІїЇєЄёЁ ]*$/u", $data['lastname'])) {
          $data['lastname_err'] = 'Прізвище може містити лише літери та пробіли.';
        }

        // Validate gender
        if (empty($data['gender'])) {
          $data['gender_err'] = 'Будь ласка, виберіть стать.';
        }

        // Validate birthday
        if (empty($data['birthday'])) {
          $data['birthday_err'] = 'Будь ласка, введіть дату народження.';
        } else {
          $birthdayDate = new DateTime($data['birthday']);
          $currentDate = new DateTime();

          if ($birthdayDate > $currentDate) {
            $data['birthday_err'] = 'Дата народження не може бути у майбутньому.';
          }

          $minDate = new DateTime('1910-01-01');
          if ($birthdayDate < $minDate) {
            $data['birthday_err'] = 'Некоректна дата народження.';
          }
        }

        // Check duplicate student (excluding the current student)
        if ($this->tableModel->findDuplicateStudentExcludingSelf($data['firstname'], $data['lastname'], $data['studygroup'], $data['id'])) {
          $data['firstname_err'] = 'Студент з таким іменем та прізвищем у цій групі вже існує.';
          $data['lastname_err'] = 'Студент з таким іменем та прізвищем у цій групі вже існує.';
        }

        // Check for errors
        if (
          empty($data['studygroup_err']) &&
          empty($data['firstname_err']) &&
          empty($data['lastname_err']) &&
          empty($data['gender_err']) &&
          empty($data['birthday_err'])
        ) {

          $result = $this->tableModel->editStudent($data);

          if ($result) {
            echo json_encode(['success' => true, 'message' => 'Student added successfully']);
          } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add student']);
          }
        } else {
          // Return validation errors
          echo json_encode([
            'success' => false,
            'message' => 'Помилки валідації',
            'errors' => [
              'studygroup_err' => $data['studygroup_err'],
              'firstname_err' => $data['firstname_err'],
              'lastname_err' => $data['lastname_err'],
              'gender_err' => $data['gender_err'],
              'birthday_err' => $data['birthday_err']
            ]
          ]);
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
