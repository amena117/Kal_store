<?php
require_once __DIR__ . '/config/database.php';

$db = new Database();
$conn = $db->getConnection();

try {
    $conn->exec("ALTER TABLE sales ADD COLUMN actual_sale_date DATETIME DEFAULT CURRENT_TIMESTAMP");
    echo "Column 'actual_sale_date' added successfully to 'sales' table.\n";
} catch (PDOException $e) {
    if (strpos($e->getMessage(), 'Duplicate column name') !== false || strpos($e->getMessage(), 'already exists') !== false) {
        echo "Column 'actual_sale_date' already exists.\n";
    } else {
        echo "Error: " . $e->getMessage() . "\n";
    }
}
?>
