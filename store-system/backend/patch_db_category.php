<?php
require_once __DIR__ . '/config/database.php';

$db = new Database();
$conn = $db->getConnection();

try {
    $conn->exec("ALTER TABLE reservation_history ADD COLUMN old_category VARCHAR(50) DEFAULT NULL");
    echo "Column 'old_category' added.\n";
} catch (PDOException $e) {
    echo "Info: " . $e->getMessage() . "\n";
}

try {
    $conn->exec("ALTER TABLE reservation_history ADD COLUMN new_category VARCHAR(50) DEFAULT NULL");
    echo "Column 'new_category' added.\n";
} catch (PDOException $e) {
    echo "Info: " . $e->getMessage() . "\n";
}

echo "Done patching DB.\n";
?>
