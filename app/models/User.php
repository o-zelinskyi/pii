<?php
class User
{
  private $db;
  private $ftp;

  public function __construct()
  {
    $this->db = new Database;
    $this->ftp = new Ftp;
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
    error_log(date('[Y-m-d H:i:s] ') . "Edit profile function called in User.php\n", 3, __DIR__ . '/../logs/user.log');
    if (isset($_FILES['photo']) && $_FILES['photo']['error'] == UPLOAD_ERR_OK) {
      error_log(date('[Y-m-d H:i:s] ') . "File upload successful\n", 3, __DIR__ . '/../logs/user.log');
      $localFile = $_FILES['photo']['tmp_name'];
      $remoteFile = '/photos/' . $data['id'] . '.png';
      if ($this->ftp->uploadFile($localFile, $remoteFile)) {
        $photoUrl = 'http://localhost/images/photos/' . $data['id'] . '.png';
        $data['photo'] = $photoUrl;
        $_SESSION['user_photo'] = $photoUrl;
      }
      $this->ftp->close();
    }

    $fields = [
      'firstname = :firstname',
      'lastname = :lastname',
      'email = :email',
      'studygroup = :studygroup',
      'gender = :gender',
      'birthday = :birthday'
    ];

    if (isset($data['photo'])) {
      $fields[] = 'photo = :photo';
    }

    if (isset($data['password']) && !empty($data['password'])) {
      $fields[] = 'password = :password';
    }

    $sql = 'UPDATE users SET ' . implode(', ', $fields) . ' WHERE id = :id';
    $this->db->query($sql);

    $this->db->bind(':firstname', $data['firstname']);
    $this->db->bind(':lastname', $data['lastname']);
    $this->db->bind(':email', $data['email']);
    $this->db->bind(':studygroup', $data['studygroup']);
    $this->db->bind(':gender', $data['gender']);
    $this->db->bind(':birthday', $data['birthday']);
    $this->db->bind(':id', $data['id']);
    $this->db->bind(':password', password_hash($data['password'], PASSWORD_DEFAULT));
    if (isset($data['photo'])) {
      $this->db->bind(':photo', $data['photo']);
    }

    $this->db->execute();

    return $this->db->rowCount() > 0;
  }
  public function getAllStudents()
  {
    $this->db->query('SELECT id, firstname, lastname, email, photo, studygroup FROM users ORDER BY firstname, lastname');
    return $this->db->resultSet();
  }

  public function getUsersForChat($search = '', $excludeId = 0)
  {
    $sql = 'SELECT id, firstname, lastname, email, studygroup, photo, isLoggedIn FROM users WHERE 1=1';
    $params = []; // Initialize params array

    if (!empty($search)) {
      $sql .= ' AND (firstname LIKE :search OR lastname LIKE :search OR email LIKE :search)';
      $params[':search'] = '%' . $search . '%'; // Add search param
    }

    if ($excludeId > 0) {
      $sql .= ' AND id != :exclude_id';
      $params[':exclude_id'] = $excludeId; // Add exclude_id param
    }

    $sql .= ' ORDER BY isLoggedIn DESC, firstname, lastname';

    $this->db->query($sql);

    // Bind parameters
    foreach ($params as $key => $value) {
      $this->db->bind($key, $value);
    }

    return $this->db->resultSet(); // Execute and return results
  }

  public function getUserById($id)
  {
    $this->db->query('SELECT * FROM users WHERE id = :id');
    $this->db->bind(':id', $id);
    return $this->db->single();
  }

  public function getOnlineUsers()
  {
    $this->db->query('SELECT id, firstname, lastname, email, photo, studygroup FROM users WHERE isLoggedIn = 1 ORDER BY firstname, lastname');
    return $this->db->resultSet();
  }
}
