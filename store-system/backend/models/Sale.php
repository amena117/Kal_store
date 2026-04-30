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
            $query = "INSERT INTO " . $this->table_name . " 
                      SET product_id=:product_id, quantity=:quantity, selling_price=:selling_price, total=:total, user_id=:user_id, actual_sale_date=:actual_sale_date, branch_id=:branch_id";
            $stmt = $this->conn->prepare($query);

            $stmt->bindParam(":product_id", $this->product_id);
            $stmt->bindParam(":quantity", $this->quantity);
            $stmt->bindParam(":selling_price", $this->selling_price);
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
            return "error";
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
}
?>
