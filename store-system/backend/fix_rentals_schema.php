<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = (new Database())->getConnection();

    // Ensure rentals table has branch_id
    try {
        $db->query("SELECT branch_id FROM rentals LIMIT 1");
        echo "branch_id already exists in rentals table.\n";
    } catch (Exception $e) {
        $db->exec("ALTER TABLE rentals ADD COLUMN branch_id INT DEFAULT 1, ADD CONSTRAINT fk_rental_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE");
        echo "Added branch_id to rentals table.\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
