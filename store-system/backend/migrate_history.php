<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = (new Database())->getConnection();

    // 1. reservation_history
    $query1 = "CREATE TABLE IF NOT EXISTS reservation_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        reservation_id INT NOT NULL,
        old_event_date DATE,
        new_event_date DATE,
        old_advance DECIMAL(10,2),
        new_advance DECIMAL(10,2),
        old_contact VARCHAR(255),
        new_contact VARCHAR(255),
        note TEXT,
        edited_by INT,
        branch_id INT DEFAULT 1,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
        FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    // 2. rental_history
    $query2 = "CREATE TABLE IF NOT EXISTS rental_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        rental_id INT NOT NULL,
        old_total DECIMAL(10,2),
        new_total DECIMAL(10,2),
        old_advance DECIMAL(10,2),
        new_advance DECIMAL(10,2),
        old_return_date DATE,
        new_return_date DATE,
        note TEXT,
        edited_by INT,
        branch_id INT DEFAULT 1,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE,
        FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    // 3. expense_history
    $query3 = "CREATE TABLE IF NOT EXISTS expense_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        expense_id INT NOT NULL,
        old_title VARCHAR(255),
        new_title VARCHAR(255),
        old_amount DECIMAL(10,2),
        new_amount DECIMAL(10,2),
        note TEXT,
        edited_by INT,
        branch_id INT DEFAULT 1,
        date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (expense_id) REFERENCES expenses(id) ON DELETE CASCADE,
        FOREIGN KEY (edited_by) REFERENCES users(id) ON DELETE SET NULL,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

    $db->exec($query1);
    $db->exec($query2);
    $db->exec($query3);

    echo "History tables created successfully!\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
