<?php
class Product {
    private $conn;
    private $table_name = "products";
    private $history_table = "product_history";

    public $id;
    public $name;
    public $category_id;
    public $arrival_price;
    public $selling_price;
    public $quantity;
    public $branch_id;
    
    // For tracking history
    public $changed_by;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT p.*, c.name as category_name 
                      FROM " . $this->table_name . " p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      WHERE p.branch_id = :branch_id
                      ORDER BY p.id DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT p.*, c.name as category_name 
                      FROM " . $this->table_name . " p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      ORDER BY p.id DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
                  SET name=:name, category_id=:category_id, arrival_price=:arrival_price, selling_price=:selling_price, quantity=:quantity, branch_id=:branch_id";
        $stmt = $this->conn->prepare($query);

        $stmt->bindParam(":name", htmlspecialchars(strip_tags($this->name)));
        $stmt->bindParam(":category_id", htmlspecialchars(strip_tags($this->category_id)));
        $stmt->bindParam(":arrival_price", htmlspecialchars(strip_tags($this->arrival_price)));
        $stmt->bindParam(":selling_price", htmlspecialchars(strip_tags($this->selling_price)));
        $stmt->bindParam(":quantity", htmlspecialchars(strip_tags($this->quantity)));
        $branch = (int)($this->branch_id ?? 1);
        $stmt->bindParam(":branch_id", $branch);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function readOne($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT * FROM ".$this->table_name." WHERE id = ? AND branch_id = ? LIMIT 0,1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $this->id);
            $stmt->bindParam(2, $branch_id);
        } else {
            $query = "SELECT * FROM ".$this->table_name." WHERE id = ? LIMIT 0,1";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(1, $this->id);
        }
        $stmt->execute();
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function update($branch_id = null) {
        // First get old record for history
        $oldRecord = $this->readOne($branch_id);
        if(!$oldRecord) return false;

        $query = "UPDATE " . $this->table_name . " 
                  SET name=:name, category_id=:category_id, arrival_price=:arrival_price, selling_price=:selling_price, quantity=:quantity 
                  WHERE id=:id";
        if ($branch_id !== null) {
            $query .= " AND branch_id = :branch_id";
        }
        $stmt = $this->conn->prepare($query);

        $this->name = htmlspecialchars(strip_tags($this->name));
        $this->category_id = htmlspecialchars(strip_tags($this->category_id));
        $this->arrival_price = htmlspecialchars(strip_tags($this->arrival_price));
        $this->selling_price = htmlspecialchars(strip_tags($this->selling_price));
        $this->quantity = htmlspecialchars(strip_tags($this->quantity));
        $this->id = htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(":name", $this->name);
        $stmt->bindParam(":category_id", $this->category_id);
        $stmt->bindParam(":arrival_price", $this->arrival_price);
        $stmt->bindParam(":selling_price", $this->selling_price);
        $stmt->bindParam(":quantity", $this->quantity);
        $stmt->bindParam(":id", $this->id);
        if ($branch_id !== null) {
            $stmt->bindParam(":branch_id", $branch_id);
        }

        if($stmt->execute()) {
            // Save history (Audit log)
            $query_hist = "INSERT INTO " . $this->history_table . " 
                           SET product_id=:product_id, 
                               old_arrival_price=:oap, new_arrival_price=:nap,
                               old_price=:old_price, new_price=:new_price,
                               old_quantity=:old_quantity, new_quantity=:new_quantity,
                               changed_by=:changed_by";
            $stmt_hist = $this->conn->prepare($query_hist);
            
            $stmt_hist->bindParam(":product_id", $this->id);
            $stmt_hist->bindParam(":oap", $oldRecord['arrival_price']);
            $stmt_hist->bindParam(":nap", $this->arrival_price);
            $stmt_hist->bindParam(":old_price", $oldRecord['selling_price']);
            $stmt_hist->bindParam(":new_price", $this->selling_price);
            $stmt_hist->bindParam(":old_quantity", $oldRecord['quantity']);
            $stmt_hist->bindParam(":new_quantity", $this->quantity);
            $stmt_hist->bindParam(":changed_by", $this->changed_by);
            $stmt_hist->execute();

            return true;
        }
        return false;
    }

    public function getHistory($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT h.*, p.name as product_name, c.name as category_name, u.name as user_name 
                      FROM " . $this->history_table . " h
                      LEFT JOIN products p ON h.product_id = p.id
                      LEFT JOIN categories c ON p.category_id = c.id
                      LEFT JOIN users u ON h.changed_by = u.id
                      WHERE p.branch_id = :branch_id
                      ORDER BY h.date DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT h.*, p.name as product_name, c.name as category_name, u.name as user_name 
                      FROM " . $this->history_table . " h
                      LEFT JOIN products p ON h.product_id = p.id
                      LEFT JOIN categories c ON p.category_id = c.id
                      LEFT JOIN users u ON h.changed_by = u.id
                      ORDER BY h.date DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    public function readLowStock($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT p.*, c.name as category_name 
                      FROM " . $this->table_name . " p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      WHERE p.quantity < 5 AND p.branch_id = :branch_id
                      ORDER BY p.quantity ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT p.*, c.name as category_name 
                      FROM " . $this->table_name . " p 
                      LEFT JOIN categories c ON p.category_id = c.id 
                      WHERE p.quantity < 5
                      ORDER BY p.quantity ASC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }
}
?>
