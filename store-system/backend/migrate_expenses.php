<?php
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

echo "Starting expenses migration...\n";

try {
    $sql = "
    CREATE TABLE IF NOT EXISTS expenses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        description TEXT NULL,
        expense_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        user_id INT NOT NULL,
        branch_id INT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT
    )";
    $db->exec($sql);
    echo "✅ Successfully created 'expenses' table.\n";
} catch (PDOException $e) {
    echo "❌ Basic Migration Failed: " . $e->getMessage() . "\n";
}
echo "Migration complete.\n";
?>
