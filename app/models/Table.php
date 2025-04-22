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
    $this->db->query('UPDATE users SET firstname = :firstname, lastname = :lastname, email = :email, studygroup = :studygroup, gender = :gender, password = :password, birthday = :birthday WHERE id = :id');
    $this->db->bind(':firstname', $data['firstname']);
    $this->db->bind(':lastname', $data['lastname']);
    $this->db->bind(':studygroup', $data['studygroup']);
    $this->db->bind(':gender', $data['gender']);
    $this->db->bind(':birthday', $data['birthday']);
    $this->db->bind(':id', $data['id']);
    $this->db->bind(':password', password_hash($data['password'], PASSWORD_DEFAULT));

    $row = $this->db->single();

    if ($this->db->rowCount() > 0) {
      $this->db->execute();
      return true;
    } else {
      return false;
    }
  }
}
