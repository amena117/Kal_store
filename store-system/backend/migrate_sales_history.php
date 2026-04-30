<?php
// One-time migration: creates the sale_edit_history table
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

$sql = "CREATE TABLE IF NOT EXISTS sale_edit_history (
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
)";

try {
    $db->exec($sql);
    echo json_encode(["status" => "success", "message" => "sale_edit_history table created successfully."]);
} catch (PDOException $e) {
    echo json_encode(["status" => "error", "message" => $e->getMessage()]);
}
?>
