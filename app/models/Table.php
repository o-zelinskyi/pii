<?php
class Table
{
  private $db;

  public function __construct()
  {
    $this->db = new Database;
  }

  public function getAllStudents()
  {
    $this->db->query('SELECT * FROM users');
    error_log(date('[Y-m-d H:i:s] ') . "Get all students\n", 3, __DIR__ . '/../logs/table.log');
    return $this->db->resultSet();
  }

  public function getStudentById($id)
  {
    $this->db->query('SELECT * FROM users WHERE id = :id');
    $this->db->bind(':id', $id);
    return $this->db->single();
  }

  public function getPaginatedStudents($page = 1, $perPage = 10)
  {
    $offset = ($page - 1) * $perPage;

    $this->db->query('SELECT * FROM users ORDER BY id DESC LIMIT :limit OFFSET :offset');
    $this->db->bind(':limit', $perPage);
    $this->db->bind(':offset', $offset);

    error_log(date('[Y-m-d H:i:s] ') . "Get paginated students - Page: $page, Per Page: $perPage\n", 3, __DIR__ . '/../logs/table.log');

    return $this->db->resultSet();
  }

  public function countStudents()
  {
    $this->db->query('SELECT COUNT(*) as total FROM users');
    $row = $this->db->single();
    return $row->total;
  }

  public function findStudentByEmail($email)
  {
    $this->db->query('SELECT * FROM users WHERE email = :email');
    $this->db->bind(':email', $email);

    $row = $this->db->single();

    if ($this->db->rowCount() > 0) {
      return true;
    } else {
      return false;
    }
  }

  public function findDuplicateStudent($firstname, $lastname, $studygroup)
  {
    $this->db->query('SELECT * FROM users WHERE firstname = :firstname AND lastname = :lastname AND studygroup = :studygroup');
    $this->db->bind(':firstname', $firstname);
    $this->db->bind(':lastname', $lastname);
    $this->db->bind(':studygroup', $studygroup);

    $row = $this->db->single();

    if ($this->db->rowCount() > 0) {
      return true;
    } else {
      return false;
    }
  }

  public function findDuplicateStudentExcludingSelf($firstname, $lastname, $studygroup, $id)
  {
    $this->db->query('SELECT * FROM users WHERE firstname = :firstname AND lastname = :lastname AND studygroup = :studygroup AND id != :id');
    $this->db->bind(':firstname', $firstname);
    $this->db->bind(':lastname', $lastname);
    $this->db->bind(':studygroup', $studygroup);
    $this->db->bind(':id', $id);

    $row = $this->db->single();

    if ($this->db->rowCount() > 0) {
      return true;
    } else {
      return false;
    }
  }

  public function addStudent($data)
  {
    $this->db->query('INSERT INTO users (studygroup, firstname, lastname, gender, birthday, email, password) VALUES (:studygroup, :firstname, :lastname, :gender, :birthday, :email, :password)');
    $this->db->bind(':studygroup', $data['studygroup']);
    $this->db->bind(':firstname', $data['firstname']);
    $this->db->bind(':lastname', $data['lastname']);
    $this->db->bind(':gender', $data['gender']);
    $this->db->bind(':birthday', $data['birthday']);
    $this->db->bind(':email', $data['email']);
    $this->db->bind(':password', password_hash($data['password'], PASSWORD_DEFAULT));

    error_log(date('[Y-m-d H:i:s] ') . "Add students\n", 3, __DIR__ . '/../logs/table.log');
    error_log(date('[Y-m-d H:i:s] ') . "Email: " . $data['email'] . "\n", 3, __DIR__ . '/../logs/table.log');
    error_log(date('[Y-m-d H:i:s] ') . "Password: " . $data['password'] . "\n", 3, __DIR__ . '/../logs/table.log');

    if ($this->db->execute()) {
      return true;
    } else {
      return false;
    }
  }

  public function editStudent($data)
  {
    error_log(date('[Y-m-d H:i:s] ') . "Edit student function called in Table.php\n", 3, __DIR__ . '/../logs/table.log');
    error_log(date('[Y-m-d H:i:s] ') . "Student ID: " . $data['id'] . "\n", 3, __DIR__ . '/../logs/table.log');
    error_log(date('[Y-m-d H:i:s] ') . "Data received: " . json_encode($data) . "\n", 3, __DIR__ . '/../logs/table.log');

    $this->db->query('UPDATE users SET firstname = :firstname, lastname = :lastname, studygroup = :studygroup, gender = :gender, birthday = :birthday WHERE id = :id');
    $this->db->bind(':firstname', $data['firstname']);
    $this->db->bind(':lastname', $data['lastname']);
    $this->db->bind(':studygroup', $data['studygroup']);
    $this->db->bind(':gender', $data['gender']);
    $this->db->bind(':birthday', $data['birthday']);
    $this->db->bind(':id', $data['id']);

    if ($this->db->execute()) {
      return true;
    } else {
      return false;
    }
  }

  public function deleteStudent($id)
  {
    $this->db->query('DELETE FROM users WHERE id = :id');
    $this->db->bind(':id', $id);
    return $this->db->execute();
  }
}
