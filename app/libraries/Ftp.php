<?php

class Ftp
{
  private $connection;
  private $loginResult;
  private $host = FTP_HOST;
  private $user = FTP_USER;
  private $pass = FTP_PASS;
  private $port = FTP_PORT;

  public function __construct()
  {
    $this->connection = ftp_connect($this->host, $this->port);
    if (!$this->connection) {
      throw new Exception("Could not connect to FTP server");
    }
    $this->loginResult = ftp_login($this->connection, $this->user, $this->pass);
    if (!$this->loginResult) {
      throw new Exception("Could not log in to FTP server");
    }
    ftp_pasv($this->connection, true);
  }

  public function uploadFile($localFile, $remoteFile)
  {
    return ftp_put($this->connection, $remoteFile, $localFile, FTP_BINARY);
  }

  public function close()
  {
    ftp_close($this->connection);
  }
}
