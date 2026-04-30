<?php
// setup_db.php - Automates database creation and table import

$host = "localhost";
$username = "root";
$password = ""; // Default XAMPP password is empty

try {
    // 1. Connect to MySQL server (without selecting a DB)
    $conn = new PDO("mysql:host=$host", $username, $password);
    $conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);

    echo "--- Connecting to MySQL...\n";

    // 2. Create the Database
    $conn->exec("CREATE DATABASE IF NOT EXISTS store_db CHARACTER SET utf8 COLLATE utf8_general_ci;");
    echo "--- Database 'store_db' checked/created.\n";

    // 3. Connect to the new Database
    $conn->exec("USE store_db;");

    // 4. Read and Execute database.sql
    $sqlFile = __DIR__ . '/database.sql';
    if (!file_exists($sqlFile)) {
        die("Error: database.sql not found at $sqlFile\n");
    }

    $sql = file_get_contents($sqlFile);
    
    // Split SQL into individual statements
    // This is a simple split, assuming statements end with ;
    $statements = array_filter(array_map('trim', explode(';', $sql)));

    foreach ($statements as $stmt) {
        if (!empty($stmt)) {
            $conn->exec($stmt);
        }
    }

    echo "--- Successfully imported tables.\n";

    // 5. Update Super Admin password to 'admin123' explicitly
    $newHash = password_hash('admin123', PASSWORD_BCRYPT);
    $updateStmt = $conn->prepare("UPDATE users SET password = ? WHERE name = 'Super Admin'");
    $updateStmt->execute([$newHash]);

    echo "--- Password for 'Super Admin' set to: admin123\n";
    echo "--- You can now log in at http://localhost:5173\n";

} catch(PDOException $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Make sure XAMPP / MySQL is running!\n";
}
