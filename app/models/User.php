<?php
class User
{
  private $db;

  public function __construct()
  {
    $this->db = new Database;
  }

  public function register($data)
  {
    $this->db->query('INSERT INTO users (firstname, lastname, email, password) VALUES (:firstname, :lastname, :email, :password)');
    $this->db->bind(':firstname', $data['firstname']);
    $this->db->bind(':lastname', $data['lastname']);
    $this->db->bind(':email', $data['email']);
    $this->db->bind(':password', $data['password']);

    if ($this->db->execute()) {
      return true;
    } else {
      return false;
    }
  }

  public function login($email, $password)
  {
    $this->db->query('SELECT * FROM users WHERE email = :email');
    $this->db->bind(':email', $email);

    $row = $this->db->single();

    if ($this->db->rowCount() > 0) {
      if (password_verify($password, $row->password)) {
        $this->db->query('UPDATE users SET isLoggedIn = 1 WHERE email = :email');
        $this->db->bind(':email', $email);
        $this->db->execute();
        return $row;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  public function findUserByEmail($email)
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

  public function getUsers()
  {
    $this->db->query('SELECT * FROM users');

    return $this->db->resultSet();
  }

  public function logout($email)
  {
    $this->db->query('UPDATE users SET isLoggedIn = 0 WHERE email = :email');
    $this->db->bind(':email', $email);
    $this->db->execute();
  }

  public function profileEdit($data)
  {
    $this->db->query('UPDATE users SET firstname = :firstname, lastname = :lastname, email = :email, studygroup = :studygroup, gender = :gender, password = :password, birthday = :birthday WHERE id = :id');
    $this->db->bind(':firstname', $data['firstname']);
    $this->db->bind(':lastname', $data['lastname']);
    $this->db->bind(':email', $data['email']);
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
