-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Apr 28, 2025 at 02:42 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cms`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password` varchar(100) NOT NULL,
  `studygroup` varchar(5) NOT NULL DEFAULT 'PZ-25',
  `firstname` varchar(100) NOT NULL,
  `lastname` varchar(100) NOT NULL,
  `gender` varchar(30) NOT NULL,
  `birthday` date NOT NULL,
  `photo` varchar(255) NOT NULL,
  `isLoggedIn` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `email`, `password`, `studygroup`, `firstname`, `lastname`, `gender`, `birthday`, `photo`, `isLoggedIn`) VALUES
(21, 'tralalelo@gmail.com', '$2y$10$35n3llzM/XNCpScaIceqiOOBAlNqY55RCmdsvxIshaTE1ajPwTSFK', 'PZ-24', 'tralalela', 'tralala', 'Male', '2000-12-12', 'http://localhost/images/photos/21.png', 1),
(53, 'Andrii.Potikha@student.ua', '$2y$10$7MNhlNRUs2wyRgXHZib7nOrGFmHK3nsWkWcQ44JWtUvkEAqRI6QSW', 'PZ-25', 'Andrii', 'Potikha', 'Male', '2000-02-02', '', 0),
(54, 'Oleksiy.Mahinsky@student.ua', '$2y$10$VaT93huGIu3mDDoTty2lDeTZI6Js0WOGJtchXdFXsqwdbNZZiyaKe', 'PZ-25', 'Oleksiy', 'Mahinsky', 'Male', '1980-02-04', '', 0),
(55, 'Oleksandr.Zelinskyi@student.ua', '$2y$10$uJ8Sy9P3DMCCJSYceVBloetWP9Fo/QsLXk6rb4DNshDNDxDnscNry', 'PZ-25', 'Oleksandr', 'Zelinskyi', 'Male', '2006-02-03', 'http://localhost/images/photos/55.png', 0),
(56, 'Ivan.Olli@student.ua', '$2y$10$2aU2IF1Re1gfRCxnnj3rce2gHcH2IuWr6uJft2sfh5k8MvcEXr6zG', 'PZ-26', 'Ivan', 'Olli', 'Male', '2000-05-03', '', 0),
(57, 'Iryna.Hrabovenska@student.ua', '$2y$10$pc.vYYmTkeTZgqq/uq/ou.aYNwLYr0AbGR7FLTqAHN45sUVvBHm56', 'PZ-25', 'Iryna', 'Hrabovenska', 'Female', '2000-05-02', '', 0);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=58;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
