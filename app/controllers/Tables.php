<?php
  class Tables extends Controller {
    public function __construct() {
      if(!isLoggedIn()) {
        redirect('users/login');
      }

      $this->tableModel = $this->model('Table');
    }

    public function index() {
      $rows = $this->tableModel->getAllStudents();
      $data = [
        'rows' => $rows
      ];
      $this->view('pages/students', $data); 
    }

    public function add() {
      if ($_SERVER['REQUEST_METHOD'] == 'POST') {
        $data = [
          'studygroup' => trim($_POST['studygroup'] ?? ''),
          'firstname' => trim($_POST['firstname'] ?? ''),
          'lastname' => trim($_POST['lastname'] ?? ''),
          'gender' => trim($_POST['gender'] ?? ''),
          'birthday' => trim($_POST['birthday'] ?? ''),
          'email' => trim($_POST['email'] ?? ''),
          'password' => trim($_POST['password'] ?? '')
        ];


        $this->tableModel->addStudent($data);
        $rows = $this->tableModel->getAllStudents();
        $data = [
          'rows' => $rows
        ];
        $this->view('pages/students', $data);


        // $newStudent = [
        //   'studygroup' => $data['studygroup'],
        //   'firstname' => $data['firstname'],
        //   'lastname' => $data['lastname']
        // ];

        // header('Content-Type: application/json');
        // echo json_encode(['newStudent' => $newStudent]);
        // exit;
      }
    }

    public function edit() {
      if($_SERVER['REQUEST_METHOD'] == 'POST') {
        $data = [
          'studygroup' => trim($_POST['studygroup'] ?? ''),
          'first-name' => trim($_POST['firstname'] ?? ''),
          'last-name' => trim($_POST['lastname'] ?? ''),
          'gender' => trim($_POST['gender'] ?? ''),
          'birthday' => trim($_POST['birthday'] ?? '')
        ];

        $this->tableModel->updateStudent($data);
        $rows = $this->tableModel->getAllStudents();
        $data = [
          'rows' => $rows
        ];
        $this->view('pages/students', $data);
      }
    }

    public function delete() {
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




    public function students() {
      $this->view('pages/students'); 
    }

    public function dashboard() {
      $this->view('pages/dashboard');
    }

  }