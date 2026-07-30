<?php
require_once __DIR__ . '/config/database.php';

try {
    $db = (new Database())->getConnection();

    echo "--- Starting Price Update Migration ---\n";

    // 1. Create price_update_history table
    $createTableSQL = "CREATE TABLE IF NOT EXISTS price_update_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_id INT NOT NULL,
        previous_price DECIMAL(10,2) NOT NULL,
        new_price DECIMAL(10,2) NOT NULL,
        price_difference DECIMAL(10,2) NOT NULL,
        effective_date DATE NOT NULL,
        remarks TEXT DEFAULT NULL,
        updated_by INT NOT NULL,
        branch_id INT DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
    );";
    
    $db->exec($createTableSQL);
    echo "✅ Table 'price_update_history' created or verified.\n";

    // 2. Add cost_price to sales table
    try {
        $db->query("SELECT cost_price FROM sales LIMIT 1");
        echo "✅ Column 'cost_price' already exists in 'sales' table.\n";
    } catch (Exception $e) {
        $db->exec("ALTER TABLE sales ADD COLUMN cost_price DECIMAL(10,2) DEFAULT NULL AFTER selling_price");
        echo "✅ Added 'cost_price' column to 'sales' table.\n";
    }

    // 3. Populate existing sales' cost_price with current products.arrival_price if NULL
    $updateSalesCost = "UPDATE sales s 
                        INNER JOIN products p ON s.product_id = p.id 
                        SET s.cost_price = p.arrival_price 
                        WHERE s.cost_price IS NULL";
    $affected = $db->exec($updateSalesCost);
    echo "✅ Updated $affected existing sales records with product cost price.\n";

    echo "--- Migration Completed Successfully ---\n";

} catch (Exception $e) {
    echo "❌ Migration Error: " . $e->getMessage() . "\n";
}
?>
