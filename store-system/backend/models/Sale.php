<?php
class Sale {
    private $conn;
    private $table_name = "sales";

    public $id;
    public $product_id;
    public $quantity;
    public $selling_price;
    public $total;
    public $user_id;
    public $actual_sale_date;
    public $branch_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        try {
            $this->conn->beginTransaction();

            // 1. Check stock
            $check_query = "SELECT arrival_price, quantity FROM products WHERE id = ?";
            $check_stmt = $this->conn->prepare($check_query);
            $check_stmt->execute([$this->product_id]);
            $product = $check_stmt->fetch(PDO::FETCH_ASSOC);

            if(!$product || $product['quantity'] < $this->quantity) {
                $this->conn->rollBack();
                return "insufficient_stock";
            }

            // 2. Insert sale record
            $cost_price = (float)($product['arrival_price'] ?? 0);
            $query = "INSERT INTO " . $this->table_name . " 
                      SET product_id=:product_id, quantity=:quantity, selling_price=:selling_price, cost_price=:cost_price, total=:total, user_id=:user_id, actual_sale_date=:actual_sale_date, branch_id=:branch_id";
            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(":product_id", $this->product_id);
            $stmt->bindParam(":quantity", $this->quantity);
            $stmt->bindParam(":selling_price", $this->selling_price);
            $stmt->bindParam(":cost_price", $cost_price);
            $stmt->bindParam(":total", $this->total);
            $stmt->bindParam(":user_id", $this->user_id);
            $stmt->bindParam(":actual_sale_date", $this->actual_sale_date);
            $branch = (int)($this->branch_id ?? 1);
            $stmt->bindParam(":branch_id", $branch);

            $stmt->execute();

            // 3. Deduct stock
            $update_stock = "UPDATE products SET quantity = quantity - ? WHERE id = ?";
            $update_stmt = $this->conn->prepare($update_stock);
            $update_stmt->execute([$this->quantity, $this->product_id]);

            $this->conn->commit();
            return "success";
        } catch(Exception $e) {
            if($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Sale create error: " . $e->getMessage());
            return "error: " . $e->getMessage();
        }
    }

    public function update($sale_id, $new_quantity, $new_selling_price, $new_actual_date, $note, $editor_id, $branch_id = null) {
        try {
            $this->conn->beginTransaction();

            // 1. Fetch current sale details
            $query = "SELECT s.*, p.quantity as stock 
                                           FROM sales s 
                                           JOIN products p ON s.product_id = p.id 
                                           WHERE s.id = ?";
            if ($branch_id !== null) {
                $query .= " AND s.branch_id = ?";
                $fetch = $this->conn->prepare($query);
                $fetch->execute([$sale_id, $branch_id]);
            } else {
                $fetch = $this->conn->prepare($query);
                $fetch->execute([$sale_id]);
            }
            $sale = $fetch->fetch(PDO::FETCH_ASSOC);

            if (!$sale) {
                $this->conn->rollBack();
                return "not_found";
            }

            $old_qty         = (int)$sale['quantity'];
            $old_price       = (float)$sale['selling_price'];
            $old_total       = (float)$sale['total'];
            $new_selling     = (float)$new_selling_price;
            $new_qty         = (int)$new_quantity;
            $new_total       = round($new_qty * $new_selling, 2);
            $qty_diff        = $new_qty - $old_qty; // positive = more sold, negative = returned

            // 2. Check if new quantity is satisfiable with available stock
            //    available stock = current product stock - extra needed
            if ($qty_diff > 0 && $sale['stock'] < $qty_diff) {
                $this->conn->rollBack();
                return "insufficient_stock";
            }

            // 3. Adjust product stock: restore old qty, deduct new qty
            $net_change = $new_qty - $old_qty;
            $adjust_stock = "UPDATE products SET quantity = quantity - ? WHERE id = ?";
            $adj_stmt = $this->conn->prepare($adjust_stock);
            $adj_stmt->execute([$net_change, $sale['product_id']]);

            // 4. Update sale record
            $new_actual_db_date = !empty($new_actual_date) ? date('Y-m-d H:i:s', strtotime($new_actual_date)) : $sale['actual_sale_date'];

            $update_sale = "UPDATE sales SET quantity=?, selling_price=?, total=?, actual_sale_date=? WHERE id=?";
            $upd_stmt = $this->conn->prepare($update_sale);
            $upd_stmt->execute([$new_qty, $new_selling, $new_total, $new_actual_db_date, $sale_id]);

            // 5. Log to sale_edit_history
            $log = $this->conn->prepare(
                "INSERT INTO sale_edit_history 
                 (sale_id, old_quantity, new_quantity, old_selling_price, new_selling_price, old_total, new_total, note, edited_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
            );
            $log->execute([
                $sale_id,
                $old_qty, $new_qty,
                $old_price, $new_selling,
                $old_total, $new_total,
                $note ?? '',
                $editor_id
            ]);

            $this->conn->commit();
            return "success";
        } catch(Exception $e) {
            if($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return "error:" . $e->getMessage();
        }
    }

    public function readAll($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT s.*, p.name as product_name, c.name as category_name, u.name as salesperson_name 
                      FROM " . $this->table_name . " s
                      INNER JOIN products p ON s.product_id = p.id
                      LEFT JOIN categories c ON p.category_id = c.id
                      INNER JOIN users u ON s.user_id = u.id
                      WHERE s.branch_id = :branch_id
                      ORDER BY s.date DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT s.*, p.name as product_name, c.name as category_name, u.name as salesperson_name 
                      FROM " . $this->table_name . " s
                      INNER JOIN products p ON s.product_id = p.id
                      LEFT JOIN categories c ON p.category_id = c.id
                      INNER JOIN users u ON s.user_id = u.id
                      ORDER BY s.date DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    public function readHistory($branch_id = null) {
        $where = $branch_id !== null ? "WHERE seh.branch_id = :branch_id OR (s.branch_id = :branch_id2)" : "";
        if ($branch_id !== null) {
            $query = "SELECT 
                        seh.*,
                        p.name AS product_name,
                        c.name AS category_name,
                        u_editor.name AS edited_by_name,
                        u_seller.name AS salesperson_name
                      FROM sale_edit_history seh
                      LEFT JOIN sales s ON seh.sale_id = s.id
                      LEFT JOIN products p ON s.product_id = p.id
                      LEFT JOIN categories c ON p.category_id = c.id
                      LEFT JOIN users u_editor ON seh.edited_by = u_editor.id
                      LEFT JOIN users u_seller ON s.user_id = u_seller.id
                      WHERE s.branch_id = :branch_id
                      ORDER BY seh.date DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT 
                        seh.*,
                        p.name AS product_name,
                        c.name AS category_name,
                        u_editor.name AS edited_by_name,
                        u_seller.name AS salesperson_name
                      FROM sale_edit_history seh
                      LEFT JOIN sales s ON seh.sale_id = s.id
                      LEFT JOIN products p ON s.product_id = p.id
                      LEFT JOIN categories c ON p.category_id = c.id
                      LEFT JOIN users u_editor ON seh.edited_by = u_editor.id
                      LEFT JOIN users u_seller ON s.user_id = u_seller.id
                      ORDER BY seh.date DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    /**
     * Delete one or multiple sales and restore product stock inside a single database transaction.
     * Enforces strict integrity rules, rollback on failure, and audit logging to product_history.
     */
    public function deleteSalesWithStockRestoration($sale_ids, $user_id, $branch_id = null) {
        // 1. Sanitize & deduplicate IDs (never process duplicate IDs)
        $clean_ids = array_values(array_unique(array_filter(array_map('intval', (array)$sale_ids), function($id) {
            return $id > 0;
        })));

        if (empty($clean_ids)) {
            return [
                "status" => "invalid_data",
                "message" => "No valid sale IDs provided."
            ];
        }

        try {
            $this->conn->beginTransaction();

            // 2. Lock & fetch all targeted sales
            $placeholders = implode(',', array_fill(0, count($clean_ids), '?'));
            $query = "SELECT s.id, s.product_id, s.quantity, s.branch_id, p.name AS product_name 
                      FROM " . $this->table_name . " s 
                      LEFT JOIN products p ON s.product_id = p.id 
                      WHERE s.id IN ($placeholders) FOR UPDATE";
            $stmt = $this->conn->prepare($query);
            $stmt->execute($clean_ids);
            $found_sales = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Validate that every requested sale exists in the database
            if (count($found_sales) !== count($clean_ids)) {
                $found_ids = array_map('intval', array_column($found_sales, 'id'));
                $missing = array_diff($clean_ids, $found_ids);
                $this->conn->rollBack();
                return [
                    "status" => "not_found",
                    "message" => "One or more sales could not be found or have already been deleted (IDs: " . implode(', ', $missing) . "). Operation rolled back."
                ];
            }

            // 3. Aggregate product quantities to restore (handles multi-item sales and multiple sales for same product)
            $stock_restorations = []; // [product_id => total_quantity]
            foreach ($found_sales as $sale) {
                $pid = (int)$sale['product_id'];
                $qty = (int)$sale['quantity'];

                if ($pid <= 0 || $qty <= 0) {
                    $this->conn->rollBack();
                    return [
                        "status" => "invalid_data",
                        "message" => "Sale #{$sale['id']} contains invalid product or quantity data. Operation rolled back."
                    ];
                }

                if (!isset($stock_restorations[$pid])) {
                    $stock_restorations[$pid] = 0;
                }
                $stock_restorations[$pid] += $qty;
            }

            // 4. Validate that all associated products exist in inventory and lock them
            $prod_ids = array_keys($stock_restorations);
            $prod_placeholders = implode(',', array_fill(0, count($prod_ids), '?'));
            $prod_query = "SELECT id, name, arrival_price, selling_price, quantity 
                           FROM products 
                           WHERE id IN ($prod_placeholders) FOR UPDATE";
            $prod_stmt = $this->conn->prepare($prod_query);
            $prod_stmt->execute($prod_ids);
            $products = [];
            while ($row = $prod_stmt->fetch(PDO::FETCH_ASSOC)) {
                $products[(int)$row['id']] = $row;
            }

            if (count($products) !== count($prod_ids)) {
                $found_pids = array_map('intval', array_keys($products));
                $missing_pids = array_diff($prod_ids, $found_pids);
                $this->conn->rollBack();
                return [
                    "status" => "invalid_data",
                    "message" => "Cannot restore stock: Associated product(s) (IDs: " . implode(', ', $missing_pids) . ") do not exist in inventory. Operation rolled back."
                ];
            }

            // 5. Restore product stock and log to product_history (audit trail)
            $update_stock_stmt = $this->conn->prepare("UPDATE products SET quantity = quantity + ? WHERE id = ?");
            $hist_stmt = $this->conn->prepare(
                "INSERT INTO product_history 
                 (product_id, old_arrival_price, new_arrival_price, old_price, new_price, old_quantity, new_quantity, changed_by) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
            );

            foreach ($stock_restorations as $pid => $restore_qty) {
                $prod = $products[$pid];
                $old_qty = (int)$prod['quantity'];
                $new_qty = $old_qty + $restore_qty;

                // Add sold quantity back to product inventory
                $update_stock_stmt->execute([$restore_qty, $pid]);

                // Record in product audit history
                $hist_stmt->execute([
                    $pid,
                    $prod['arrival_price'],
                    $prod['arrival_price'],
                    $prod['selling_price'],
                    $prod['selling_price'],
                    $old_qty,
                    $new_qty,
                    $user_id
                ]);
            }

            // 6. Delete sale edit history records associated with these sales
            $del_hist_stmt = $this->conn->prepare("DELETE FROM sale_edit_history WHERE sale_id IN ($placeholders)");
            $del_hist_stmt->execute($clean_ids);

            // 7. Delete sales records
            $del_sales_stmt = $this->conn->prepare("DELETE FROM " . $this->table_name . " WHERE id IN ($placeholders)");
            $del_sales_stmt->execute($clean_ids);

            // 8. Commit atomic transaction
            $this->conn->commit();

            $deleted_count = count($clean_ids);
            $msg = $deleted_count === 1
                ? "1 sale deleted and inventory quantity restored successfully."
                : "{$deleted_count} sales deleted and inventory quantities restored successfully.";

            return [
                "status" => "success",
                "message" => $msg,
                "deleted_count" => $deleted_count,
                "restored_count" => array_sum($stock_restorations)
            ];
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Sale delete error: " . $e->getMessage());
            return [
                "status" => "error",
                "message" => "An error occurred while deleting sales and restoring inventory: " . $e->getMessage(),
                "error" => $e->getMessage()
            ];
        }
    }
}
?>
