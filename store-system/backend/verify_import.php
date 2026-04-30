<?php
require_once 'config/database.php';

try {
    $database = new Database();
    $db = $database->getConnection();

    $count = $db->query("SELECT COUNT(*) FROM products WHERE branch_id = 1 AND quantity = 1")->fetchColumn();
    echo "Products in Main Branch with Quantity 1: $count\n";

    $totalCat = $db->query("SELECT COUNT(*) FROM categories")->fetchColumn();
    echo "Total Categories: $totalCat\n";

    echo "\nSample of imported products:\n";
    $stmt = $db->query("SELECT name, (SELECT name FROM categories WHERE id=p.category_id) as category FROM products p WHERE branch_id = 1 ORDER BY id DESC LIMIT 5");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        echo "- {$row['name']} ({$row['category']})\n";
    }

} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
