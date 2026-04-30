<?php
require_once __DIR__ . '/config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "Checking for customer_name column in rentals table...\n";
    $stmt = $db->query("SHOW COLUMNS FROM rentals LIKE 'customer_name'");
    $exists = $stmt->fetch();

    if (!$exists) {
        echo "Adding customer_name and phone_number columns to rentals table...\n";
        $sql = "ALTER TABLE rentals 
                ADD COLUMN customer_name VARCHAR(255) DEFAULT NULL AFTER return_date,
                ADD COLUMN phone_number VARCHAR(20) DEFAULT NULL AFTER customer_name";
        $db->exec($sql);
        echo "Migration successful.\n";
    } else {
        echo "Columns already exist.\n";
    }

} catch (Exception $e) {
    echo "Migration failed: " . $e->getMessage() . "\n";
}
?>
