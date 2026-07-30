<?php
class PriceUpdate {
    private $conn;
    private $table_name = "price_update_history";

    public $id;
    public $product_id;
    public $previous_price;
    public $new_price;
    public $price_difference;
    public $effective_date;
    public $remarks;
    public $updated_by;
    public $branch_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        try {
            $this->conn->beginTransaction();

            // 1. Fetch current product arrival_price
            $check = $this->conn->prepare("SELECT arrival_price FROM products WHERE id = ?");
            $check->execute([$this->product_id]);
            $prod = $check->fetch(PDO::FETCH_ASSOC);

            if (!$prod) {
                $this->conn->rollBack();
                return ["success" => false, "message" => "Product not found."];
            }

            $prevPrice = (float)$prod['arrival_price'];
            $newPrice = (float)$this->new_price;
            $diff = round($newPrice - $prevPrice, 2);

            // 2. Insert into price_update_history
            $query = "INSERT INTO " . $this->table_name . " 
                      (product_id, previous_price, new_price, price_difference, effective_date, remarks, updated_by, branch_id)
                      VALUES (:product_id, :previous_price, :new_price, :price_difference, :effective_date, :remarks, :updated_by, :branch_id)";
            
            $stmt = $this->conn->prepare($query);

            $effectiveDate = !empty($this->effective_date) ? $this->effective_date : date('Y-m-d');
            $remarks = !empty($this->remarks) ? htmlspecialchars(strip_tags($this->remarks)) : null;
            $branch = (int)($this->branch_id ?? 1);

            $stmt->bindParam(":product_id", $this->product_id);
            $stmt->bindParam(":previous_price", $prevPrice);
            $stmt->bindParam(":new_price", $newPrice);
            $stmt->bindParam(":price_difference", $diff);
            $stmt->bindParam(":effective_date", $effectiveDate);
            $stmt->bindParam(":remarks", $remarks);
            $stmt->bindParam(":updated_by", $this->updated_by);
            $stmt->bindParam(":branch_id", $branch);

            if (!$stmt->execute()) {
                throw new Exception("Failed to insert price update record.");
            }

            // 3. Update arrival_price in products table
            $updateProd = $this->conn->prepare("UPDATE products SET arrival_price = :new_price WHERE id = :id");
            $updateProd->execute([
                ":new_price" => $newPrice,
                ":id" => $this->product_id
            ]);

            // 4. Log to product_history (Audit Log)
            $audit = $this->conn->prepare(
                "INSERT INTO product_history 
                 (product_id, old_arrival_price, new_arrival_price, old_price, new_price, old_quantity, new_quantity, changed_by)
                 SELECT id, :old_ap, :new_ap, selling_price, selling_price, quantity, quantity, :changed_by
                 FROM products WHERE id = :pid"
            );
            $audit->execute([
                ":old_ap" => $prevPrice,
                ":new_ap" => $newPrice,
                ":changed_by" => $this->updated_by,
                ":pid" => $this->product_id
            ]);

            $this->conn->commit();
            return ["success" => true, "message" => "Purchase price updated successfully."];

        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return ["success" => false, "message" => "Error: " . $e->getMessage()];
        }
    }

    public function readAll($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT puh.*, p.name AS product_name, u.name AS updated_by_name 
                      FROM " . $this->table_name . " puh
                      INNER JOIN products p ON puh.product_id = p.id
                      INNER JOIN users u ON puh.updated_by = u.id
                      WHERE puh.branch_id = :branch_id OR p.branch_id = :branch_id
                      ORDER BY puh.created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT puh.*, p.name AS product_name, u.name AS updated_by_name 
                      FROM " . $this->table_name . " puh
                      INNER JOIN products p ON puh.product_id = p.id
                      INNER JOIN users u ON puh.updated_by = u.id
                      ORDER BY puh.created_at DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }
}
?>
