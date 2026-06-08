CREATE DATABASE IF NOT EXISTS `tournament` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `tournament`;

CREATE TABLE IF NOT EXISTS `classes` (
    `name` varchar(255) NOT NULL PRIMARY KEY,
    `level` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `participants` (
    `id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `name` varchar(255) NOT NULL,
    `forename` varchar(255) NOT NULL,
    `gender` enum('male', 'female') NOT NULL,
    `class_name` varchar(255) NOT NULL,
    FOREIGN KEY (`class_name`) REFERENCES `classes`(`name`) ON DELETE CASCADE,
    UNIQUE KEY `unique_participant` (`name`, `forename`, `gender`, `class_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `disciplines` (
    `id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `name` varchar(255) NOT NULL UNIQUE,
    `unit` varchar(255) NOT NULL,
    `attempts` int(11) NOT NULL DEFAULT 2,
    `timer` tinyint(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `measurements` (
    `id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `participant_id` int(11) NOT NULL,
    `discipline_id` int(11) NOT NULL,
    `attempt_number` int(11) NOT NULL,
    `value` float NOT NULL,
    `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`participant_id`) REFERENCES `participants`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`discipline_id`) REFERENCES `disciplines`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mark-ranges` (
    `id` int(11) NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `discipline_id` int(11) NOT NULL,
    `class_level` int(11) NOT NULL,
    `gender` enum('male', 'female') NOT NULL,
    `min_value` float NOT NULL,
    `mark` int(11) NOT NULL,
    FOREIGN KEY (`discipline_id`) REFERENCES `disciplines`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `unique_mark` (`discipline_id`, `class_level`, `gender`, `mark`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;