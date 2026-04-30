<?php
/**
 * Product Import Script
 * Reads amena.xlsx and imports data into products table.
 * All quantities are set to 1.
 * Targeted at Main Branch (ID: 1).
 */

require_once 'config/database.php';
require_once 'SimpleXLSX.php';
use Shuchkin\SimpleXLSX;

echo "Starting Product Import process...\n";

try {
    $database = new Database();
    $db = $database->getConnection();

    if (!$xlsx = SimpleXLSX::parse('amena.xlsx')) {
        die("Error parsing Excel: " . SimpleXLSX::parseError() . "\n");
    }

    $rows = $xlsx->rows();
    if (count($rows) < 2) {
        die("Excel file is empty or missing data rows.\n");
    }

    // Skip header row
    $header = array_shift($rows);
    echo "Processing " . count($rows) . " rows...\n";

    // Cache categories to avoid constant DB lookups
    $categoryMap = [];
    $stmt = $db->query("SELECT id, name FROM categories");
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        $categoryMap[strtolower(trim($row['name']))] = $row['id'];
    }

    $successCount = 0;
    $skipCount = 0;
    $errorCount = 0;
    $newCategoriesCount = 0;

    foreach ($rows as $index => $rowData) {
        // Basic column mapping based on inspection:
        // [0] Category, [1] name, [2] Received price, [3] Selling Price
        $categoryName = isset($rowData[0]) ? trim((string)$rowData[0]) : '';
        $productName = isset($rowData[1]) ? trim((string)$rowData[1]) : '';
        $arrivalPrice = isset($rowData[2]) ? (float)$rowData[2] : 0;
        $sellingPrice = isset($rowData[3]) ? (float)$rowData[3] : 0;
        $quantity = 1; // User explicitly asked for all quantities to be 1
        $branchId = 1; // Main Branch

        if (empty($productName)) {
            echo "Row " . ($index + 2) . ": Skipping due to empty product name.\n";
            $skipCount++;
            continue;
        }

        // Handle Category
        $categoryId = null;
        if (!empty($categoryName)) {
            $catLower = strtolower($categoryName);
            if (isset($categoryMap[$catLower])) {
                $categoryId = $categoryMap[$catLower];
            } else {
                // Create new category
                $insCat = $db->prepare("INSERT INTO categories (name) VALUES (:name)");
                $insCat->execute([':name' => $categoryName]);
                $categoryId = $db->lastInsertId();
                $categoryMap[$catLower] = $categoryId;
                $newCategoriesCount++;
                echo "Created new category: $categoryName\n";
            }
        }

        // Check if product already exists in this branch (avoid duplicates)
        $checkStmt = $db->prepare("SELECT id FROM products WHERE name = :name AND branch_id = :branch_id");
        $checkStmt->execute([':name' => $productName, ':branch_id' => $branchId]);
        if ($checkStmt->fetch()) {
            echo "Row " . ($index + 2) . ": Product '$productName' already exists in Main Branch. Skipping.\n";
            $skipCount++;
            continue;
        }

        // Insert Product
        try {
            $insProd = $db->prepare("INSERT INTO products (name, category_id, arrival_price, selling_price, quantity, branch_id) 
                                    VALUES (:name, :category_id, :arrival_price, :selling_price, :quantity, :branch_id)");
            $insProd->execute([
                ':name' => $productName,
                ':category_id' => $categoryId,
                ':arrival_price' => $arrivalPrice,
                ':selling_price' => $sellingPrice,
                ':quantity' => $quantity,
                ':branch_id' => $branchId
            ]);
            $successCount++;
        } catch (Exception $e) {
            echo "Row " . ($index + 2) . ": Error inserting '$productName': " . $e->getMessage() . "\n";
            $errorCount++;
        }
    }

    echo "\nImport completed!\n";
    echo "-------------------\n";
    echo "Total rows processed: " . count($rows) . "\n";
    echo "Successfully imported: $successCount\n";
    echo "Skipped (empty/exists): $skipCount\n";
    echo "New categories created: $newCategoriesCount\n";
    echo "Errors encountered: $errorCount\n";

} catch (Exception $e) {
    echo "Fatal Error: " . $e->getMessage() . "\n";
}
