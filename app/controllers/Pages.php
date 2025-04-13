<?php
  class Pages extends Controller {
    public function __construct() {
    }

    public function index() {
      $data =[];
      $this->view('pages/students', $data); 
    }

    public function students() {
      $this->view('pages/students'); 
    }

    public function dashboard() {
      $this->view('pages/dashboard');
    }

  }