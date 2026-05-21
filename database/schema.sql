-- =============================================
-- Smart Exam Seating Arrangement System
-- MySQL Schema
-- =============================================

CREATE DATABASE IF NOT EXISTS exam_seating;
USE exam_seating;

-- Admins
CREATE TABLE IF NOT EXISTS admins (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(64) NOT NULL,  -- MD5 hash
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default admin: admin / admin123
INSERT INTO admins (name, username, password)
VALUES ('Administrator', 'admin', MD5('admin123'))
ON DUPLICATE KEY UPDATE id=id;

-- Students
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    roll_number VARCHAR(30) UNIQUE NOT NULL,
    department VARCHAR(100) NOT NULL,
    year ENUM('1st','2nd','3rd','4th') NOT NULL,
    subject VARCHAR(150),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Rooms
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    room_number VARCHAR(20) NOT NULL,
    capacity INT NOT NULL DEFAULT 30,
    floor VARCHAR(20) NOT NULL,
    block VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    subject VARCHAR(150) NOT NULL,
    exam_date DATE NOT NULL,
    start_time TIME NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seating Arrangements
CREATE TABLE IF NOT EXISTS seating_arrangements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    room_id INT NOT NULL,
    seat_number INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- Sample data
INSERT INTO rooms (room_number, capacity, floor, block) VALUES
('101', 40, 'Ground', 'A'),
('102', 35, 'Ground', 'A'),
('201', 30, 'First', 'B'),
('202', 45, 'First', 'B');

INSERT INTO exams (name, subject, exam_date, start_time) VALUES
('Semester Final 2024', 'Mathematics', '2024-12-15', '09:00:00'),
('Mid Term 2024', 'Physics', '2024-11-10', '10:00:00');