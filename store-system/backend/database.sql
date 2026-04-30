-- Store Management System Database Schema

CREATE DATABASE IF NOT EXISTS store_db;
USE store_db;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Encoder', 'Salesperson', 'Manager') NOT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Initial Admin Account (Password: admin123)
INSERT INTO users (name, role, status, password) 
VALUES ('Super Admin', 'Admin', 'active', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON DUPLICATE KEY UPDATE id=id;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    arrival_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
);

-- Product History (Audit Log)
CREATE TABLE IF NOT EXISTS product_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    old_arrival_price DECIMAL(10,2) DEFAULT 0,
    new_arrival_price DECIMAL(10,2) DEFAULT 0,
    old_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) DEFAULT 0,
    old_quantity INT NOT NULL,
    new_quantity INT DEFAULT 0,
    changed_by INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    total DECIMAL(10,2) NOT NULL,
    user_id INT NOT NULL,  -- Salesperson making the sale
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
);

-- Reservations Table
CREATE TABLE IF NOT EXISTS reservations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    event_date DATE NOT NULL,
    place VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL,
    advance_payment DECIMAL(10,2) NOT NULL,
    description TEXT,
    contact_name VARCHAR(255) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    contract_image VARCHAR(255) NOT NULL,
    sample_image VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sale Edit History (Audit Log for sale edits)
CREATE TABLE IF NOT EXISTS sale_edit_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    old_quantity INT NOT NULL,
    new_quantity INT NOT NULL,
    old_selling_price DECIMAL(10,2) NOT NULL,
    new_selling_price DECIMAL(10,2) NOT NULL,
    old_total DECIMAL(10,2) NOT NULL,
    new_total DECIMAL(10,2) NOT NULL,
    note TEXT,
    edited_by INT NOT NULL,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE CASCADE
);

