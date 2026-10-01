-- Store Management System Database Schema

CREATE DATABASE IF NOT EXISTS store_db;
USE store_db;

-- ======================
-- Branches Table
-- ======================
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Default Branch
INSERT INTO branches (name, location, status) 
VALUES ('Main Branch', 'Head Office', 'active')
ON DUPLICATE KEY UPDATE id = id;

-- ======================
-- Users Table
-- ======================
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    role ENUM('Admin', 'Encoder', 'Salesperson', 'Manager') NOT NULL,
    status ENUM('active', 'blocked') DEFAULT 'active',
    password VARCHAR(255) NOT NULL,
    branch_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- Initial Admin Account
-- Username: admin
-- Password: password
INSERT INTO users (username, name, role, status, password, branch_id) 
VALUES (
    'admin', 
    'Super Admin', 
    'Admin', 
    'active', 
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    1
)
ON DUPLICATE KEY UPDATE id = id;

-- ======================
-- Categories Table
-- ======================
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ======================
-- Products Table
-- ======================
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category_id INT,
    arrival_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    quantity INT NOT NULL DEFAULT 0,
    branch_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ======================
-- Product History
-- ======================
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

-- ======================
-- Sales Table
-- ======================
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity INT NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2) DEFAULT NULL,
    total DECIMAL(10,2) NOT NULL,
    user_id INT NOT NULL,
    branch_id INT DEFAULT 1,
    actual_sale_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ======================
-- Reservations Table
-- ======================
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
    branch_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE SET NULL
);

-- ======================
-- Sale Edit History
-- ======================
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

-- ======================
-- Price Update History
-- ======================
CREATE TABLE IF NOT EXISTS price_update_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    previous_price DECIMAL(10,2) NOT NULL,
    new_price DECIMAL(10,2) NOT NULL,
    price_difference DECIMAL(10,2) NOT NULL,
    effective_date DATE NOT NULL,
    remarks TEXT DEFAULT NULL,
    updated_by INT NOT NULL,
    branch_id INT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);