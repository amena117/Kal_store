-- ============================================
-- Migration for EXISTING live database
-- Run AFTER backing up your live database!
-- Does NOT delete any existing data.
-- ============================================

-- 1. New: branches table + default branch
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255) DEFAULT NULL,
    status ENUM('active', 'inactive') DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO branches (name, location, status)
SELECT 'Main Branch', 'Head Office', 'active'
WHERE NOT EXISTS (SELECT 1 FROM branches);

-- 2. users: add username column (nullable first, then backfill)
ALTER TABLE users ADD COLUMN username VARCHAR(100) NULL AFTER id;

-- Backfill unique usernames for existing users
SET @row := 0;
UPDATE users
SET username = CONCAT('user', @row := @row + 1)
WHERE username IS NULL OR username = '';

-- Give the admin a known username so you can log in
UPDATE users SET username = 'admin' WHERE role = 'Admin' AND username = 'user1';

ALTER TABLE users MODIFY username VARCHAR(100) NOT NULL UNIQUE;

-- 3. users: add branch_id
ALTER TABLE users ADD COLUMN branch_id INT DEFAULT 1 AFTER status;

-- 4. products: add branch_id
ALTER TABLE products ADD COLUMN branch_id INT DEFAULT 1 AFTER quantity;

-- 5. sales: add branch_id + actual_sale_date
ALTER TABLE sales ADD COLUMN branch_id INT DEFAULT 1 AFTER user_id;
ALTER TABLE sales ADD COLUMN actual_sale_date DATETIME DEFAULT CURRENT_TIMESTAMP AFTER branch_id;

-- 6. reservations: add branch_id
ALTER TABLE reservations ADD COLUMN branch_id INT DEFAULT 1 AFTER created_by;

-- 7. New: price_update_history table
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
