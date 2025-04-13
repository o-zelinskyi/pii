<?php
 class Table {
  private $db;

  public function __construct()
  {
    $this->db = new Database;
  }

  public function getAllStudents() {
    $this->db->query('SELECT * FROM users');
    return $this->db->resultSet();
  }

  public function getStudentById($id) {
    $this->db->query('SELECT * FROM users WHERE id = :id');
    $this->db->bind(':id', $id);
    return $this->db->single();
  }

  public function addStudent($data) {
    $this->db->query('INSERT INTO users (studygroup, firstname, lastname, gender, birthday) VALUES (:studygroup, :firstname, :lastname, :gender, :birthday)');
    $this->db->bind(':studygroup', $data['studygroup']);
    $this->db->bind(':firstname', $data['first-name']);
    $this->db->bind(':lastname', $data['last-name']);
    $this->db->bind(':gender', $data['gender']);
    $this->db->bind(':birthday', $data['birthday']);

    if($this->db->execute()) {
      return true;
    } else {
      return false;
    }
  }

  public function editStudent($data) {
    $this->db->query('UPDATE users SET (studygroup, firstname, lastname, gender, birthday) VALUES (:studygroup, :firstname, :lastname, :gender, :birthday) WHERE ');
  }
 }