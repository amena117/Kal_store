<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    echo "=== BRANCHES ===\n";
    $branches = $db->query("SELECT id, name FROM branches")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($branches as $b) {
        echo "ID: {$b['id']} | Name: {$b['name']}\n";
    }

    echo "\n=== CATEGORIES ===\n";
    $categories = $db->query("SELECT id, name FROM categories")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($categories as $c) {
        echo "ID: {$c['id']} | Name: {$c['name']}\n";
    }

    echo "\n=== PRODUCTS TABLE STRUCT ===\n";
    $columns = $db->query("DESCRIBE products")->fetchAll(PDO::FETCH_ASSOC);
    foreach ($columns as $col) {
        echo "Field: {$col['Field']} | Type: {$col['Type']} | Null: {$col['Null']} | Default: {$col['Default']}\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
