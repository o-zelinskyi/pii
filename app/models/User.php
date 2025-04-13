<?php
  class User {
    private $db;

    public function __construct()
    {
      $this->db = new Database;
    }

    public function register($data) {
      $this->db->query('INSERT INTO users (firstname, lastname, email, password) VALUES (:firstname, :lastname, :email, :password)');
      $this->db->bind(':firstname', $data['firstname']);
      $this->db->bind(':lastname', $data['lastname']);
      $this->db->bind(':email', $data['email']);
      $this->db->bind(':password', $data['password']);

      if($this->db->execute()) {
        return true;
      } else {
        return false;
      }
    }

    public function login($email, $password) {
      $this->db->query('SELECT * FROM users WHERE email = :email');
      $this->db->bind(':email', $email);

      $row = $this->db->single();

      if($this->db->rowCount() > 0) {
        if(password_verify($password, $row->password)) {
          return $row;
        } else {
          return false;
        }
      } else {
        return false;
      }
    } 

    public function findUserByEmail($email) {
      $this->db->query('SELECT * FROM users WHERE email = :email');
      $this->db->bind(':email', $email);

      $row = $this->db->single();

      if($this->db->rowCount() > 0) {
        return true;
      } else {
        return false;
      }
    }

    public function getUsers() {
      $this->db->query('SELECT * FROM users');

      return $this->db->resultSet();
    }
  }