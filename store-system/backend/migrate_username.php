<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

try {
    // Check if column exists
    $stmt = $db->query("SHOW COLUMNS FROM users LIKE 'username'");
    if ($stmt->rowCount() == 0) {
        $db->exec("ALTER TABLE users ADD COLUMN username VARCHAR(255) NULL AFTER name");
        // Update existing users to have their name + id as username initially
        $db->exec("UPDATE users SET username = CONCAT(REPLACE(LOWER(name), ' ', '_'), '_', id) WHERE username IS NULL");
        // Now make it unique
        $db->exec("ALTER TABLE users ADD UNIQUE(username)");
        echo "Successfully added username column to users table.\n";
    } else {
        // If column exists but wasn't made unique properly, let's fix it
        $db->exec("UPDATE users SET username = CONCAT(REPLACE(LOWER(name), ' ', '_'), '_', id) WHERE username IS NULL OR username = ''");
        try {
            $db->exec("ALTER TABLE users ADD UNIQUE(username)");
            echo "Successfully added unique constraint.\n";
        } catch (Exception $e) {
            echo "Unique constraint might already exist.\n";
        }
        echo "Username column already exists.\n";
    }
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
?>
