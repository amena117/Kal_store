<?php
/**
 * Multi-Branch Migration Script
 * Run once via: http://localhost:8000/migrate_branches.php
 * Safe to re-run (uses IF NOT EXISTS / IF EXISTS checks)
 */
require_once __DIR__ . '/config/database.php';

$database = new Database();
$db = $database->getConnection();

$steps = [];
$errors = [];

function run($db, &$steps, &$errors, $label, $sql) {
    try {
        $db->exec($sql);
        $steps[] = "✅ " . $label;
    } catch (PDOException $e) {
        $errors[] = "❌ " . $label . " — " . $e->getMessage();
    }
}

// 1. Create branches table
run($db, $steps, $errors, "Create branches table", "
    CREATE TABLE IF NOT EXISTS branches (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) DEFAULT '',
        status ENUM('active', 'inactive') DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
");

// 2. Insert default Main Branch
run($db, $steps, $errors, "Insert Main Branch", "
    INSERT INTO branches (id, name, location, status)
    VALUES (1, 'Main Branch', '', 'active')
    ON DUPLICATE KEY UPDATE id=id
");

// 3. Add branch_id to users
run($db, $steps, $errors, "Add branch_id to users", "
    ALTER TABLE users ADD COLUMN IF NOT EXISTS branch_id INT NULL DEFAULT 1
");
run($db, $steps, $errors, "Set existing users to Main Branch", "
    UPDATE users SET branch_id = 1 WHERE branch_id IS NULL
");

// 4. Add branch_id to products
run($db, $steps, $errors, "Add branch_id to products", "
    ALTER TABLE products ADD COLUMN IF NOT EXISTS branch_id INT NULL DEFAULT 1
");
run($db, $steps, $errors, "Set existing products to Main Branch", "
    UPDATE products SET branch_id = 1 WHERE branch_id IS NULL
");

// 5. Add branch_id to sales
run($db, $steps, $errors, "Add branch_id to sales", "
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS branch_id INT NULL DEFAULT 1
");
run($db, $steps, $errors, "Set existing sales to Main Branch", "
    UPDATE sales SET branch_id = 1 WHERE branch_id IS NULL
");

// 6. Add branch_id to reservations
run($db, $steps, $errors, "Add branch_id to reservations", "
    ALTER TABLE reservations ADD COLUMN IF NOT EXISTS branch_id INT NULL DEFAULT 1
");
run($db, $steps, $errors, "Set existing reservations to Main Branch", "
    UPDATE reservations SET branch_id = 1 WHERE branch_id IS NULL
");

// 7. Add branch_id to rentals
run($db, $steps, $errors, "Add branch_id to rentals", "
    ALTER TABLE rentals ADD COLUMN IF NOT EXISTS branch_id INT NULL DEFAULT 1
");
run($db, $steps, $errors, "Set existing rentals to Main Branch", "
    UPDATE rentals SET branch_id = 1 WHERE branch_id IS NULL
");

// Also patch actual_sale_date for sales if not already there
run($db, $steps, $errors, "Add actual_sale_date to sales (if missing)", "
    ALTER TABLE sales ADD COLUMN IF NOT EXISTS actual_sale_date DATETIME NULL
");

// Output
header('Content-Type: text/html; charset=utf-8');
echo "<h2>Branch Migration Report</h2><pre>";
foreach ($steps as $s) echo $s . "\n";
if ($errors) {
    echo "\n--- ERRORS ---\n";
    foreach ($errors as $e) echo $e . "\n";
} else {
    echo "\n🎉 Migration completed successfully! All existing data assigned to 'Main Branch' (id=1).";
}
echo "</pre>";
?>
