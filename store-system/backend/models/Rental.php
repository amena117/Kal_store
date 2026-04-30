<?php
class Rental {
    private $conn;
    private $table_name = "rentals";

    public $id;
    public $total_payment;
    public $advance_payment;
    public $remaining_payment;
    public $take_away_date;
    public $return_date;
    public $received_by;
    public $customer_name;
    public $phone_number;
    public $created_by;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create($items) {
        try {
            $this->conn->beginTransaction();

            $query = "INSERT INTO " . $this->table_name . " 
                      SET total_payment=:total_payment, advance_payment=:advance_payment, 
                          remaining_payment=:remaining_payment, take_away_date=:take_away_date, 
                          return_date=:return_date, received_by=:received_by, 
                          customer_name=:customer_name, phone_number=:phone_number,
                          created_by=:created_by, branch_id=:branch_id";
            
            $stmt = $this->conn->prepare($query);

            $this->total_payment = htmlspecialchars(strip_tags($this->total_payment));
            $this->advance_payment = htmlspecialchars(strip_tags($this->advance_payment));
            $this->remaining_payment = htmlspecialchars(strip_tags($this->remaining_payment));
            $this->take_away_date = htmlspecialchars(strip_tags($this->take_away_date));
            $this->return_date = htmlspecialchars(strip_tags($this->return_date));
            $this->received_by = (int)$this->received_by;
            $this->customer_name = htmlspecialchars(strip_tags($this->customer_name));
            $this->phone_number = htmlspecialchars(strip_tags($this->phone_number));
            $this->created_by = (int)$this->created_by;

            $stmt->bindParam(":total_payment", $this->total_payment);
            $stmt->bindParam(":advance_payment", $this->advance_payment);
            $stmt->bindParam(":remaining_payment", $this->remaining_payment);
            $stmt->bindParam(":take_away_date", $this->take_away_date);
            $stmt->bindParam(":return_date", $this->return_date);
            $stmt->bindParam(":received_by", $this->received_by);
            $stmt->bindParam(":customer_name", $this->customer_name);
            $stmt->bindParam(":phone_number", $this->phone_number);
            $stmt->bindParam(":created_by", $this->created_by);
            $branch = (int)($this->branch_id ?? 1);
            $stmt->bindParam(":branch_id", $branch);

            if (!$stmt->execute()) {
                throw new Exception("Failed to insert rental");
            }

            $rental_id = $this->conn->lastInsertId();

            if (!empty($items) && is_array($items)) {
                $item_query = "INSERT INTO rental_items (rental_id, product_name, category, quantity) VALUES (?, ?, ?, ?)";
                $item_stmt = $this->conn->prepare($item_query);

                $memory_query = "INSERT IGNORE INTO rental_item_memory (product_name, category) VALUES (?, ?)";
                $memory_stmt = $this->conn->prepare($memory_query);

                foreach ($items as $item) {
                    $p_name = htmlspecialchars(strip_tags($item->product_name));
                    $p_cat = htmlspecialchars(strip_tags($item->category));
                    $p_qty = (int)$item->quantity;

                    // Insert to rental_items
                    $item_stmt->execute([$rental_id, $p_name, $p_cat, $p_qty]);

                    // Insert to memory
                    $memory_stmt->execute([$p_name, $p_cat]);
                }
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            return false;
        }
    }

    public function update($id, $items, $branch_id = null, $editor_id = null, $note = '') {
        try {
            $this->conn->beginTransaction();

            $old_record = $this->readOne($id, $branch_id);

            $query = "UPDATE " . $this->table_name . " 
                      SET total_payment=:total_payment, advance_payment=:advance_payment, 
                          remaining_payment=:remaining_payment, take_away_date=:take_away_date, 
                          return_date=:return_date, received_by=:received_by,
                          customer_name=:customer_name, phone_number=:phone_number
                      WHERE id=:id";
            
            if ($branch_id !== null) {
                $query .= " AND branch_id = :branch_id";
            }

            $stmt = $this->conn->prepare($query);

            // Sanitize
            $this->total_payment = htmlspecialchars(strip_tags($this->total_payment));
            $this->advance_payment = htmlspecialchars(strip_tags($this->advance_payment));
            $this->remaining_payment = htmlspecialchars(strip_tags($this->remaining_payment));
            $this->take_away_date = htmlspecialchars(strip_tags($this->take_away_date));
            $this->return_date = htmlspecialchars(strip_tags($this->return_date));
            $this->received_by = (int)$this->received_by;
            $this->customer_name = htmlspecialchars(strip_tags($this->customer_name));
            $this->phone_number = htmlspecialchars(strip_tags($this->phone_number));

            // Bind
            $stmt->bindParam(":total_payment", $this->total_payment);
            $stmt->bindParam(":advance_payment", $this->advance_payment);
            $stmt->bindParam(":remaining_payment", $this->remaining_payment);
            $stmt->bindParam(":take_away_date", $this->take_away_date);
            $stmt->bindParam(":return_date", $this->return_date);
            $stmt->bindParam(":received_by", $this->received_by);
            $stmt->bindParam(":customer_name", $this->customer_name);
            $stmt->bindParam(":phone_number", $this->phone_number);
            $stmt->bindParam(":id", $id);
            
            if ($branch_id !== null) {
                $stmt->bindParam(":branch_id", $branch_id);
            }

            if (!$stmt->execute()) {
                throw new Exception("Failed to execute update query");
            }
            
            if ($stmt->rowCount() == 0) {
                // It might be 0 if nothing changed, which is not necessarily an error in some DB configs, 
                // but usually we want to know if it matched. 
                // Let's just check if it executed.
            }

            // Remove existing items and insert new ones
            $del_stmt = $this->conn->prepare("DELETE FROM rental_items WHERE rental_id = ?");
            $del_stmt->execute([$id]);

            if (!empty($items) && is_array($items)) {
                $item_query = "INSERT INTO rental_items (rental_id, product_name, category, quantity) VALUES (?, ?, ?, ?)";
                $item_stmt = $this->conn->prepare($item_query);

                $memory_query = "INSERT IGNORE INTO rental_item_memory (product_name, category) VALUES (?, ?)";
                $memory_stmt = $this->conn->prepare($memory_query);

                foreach ($items as $item) {
                    $p_name = htmlspecialchars(strip_tags($item->product_name));
                    $p_cat = htmlspecialchars(strip_tags($item->category));
                    $p_qty = (int)$item->quantity;

                    $item_stmt->execute([$id, $p_name, $p_cat, $p_qty]);
                    $memory_stmt->execute([$p_name, $p_cat]);
                }
            }

            if ($editor_id !== null && $old_record) {
                $hist_query = "INSERT INTO rental_history 
                    (rental_id, old_total, new_total, old_advance, new_advance, old_return_date, new_return_date, note, edited_by, branch_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $hist_stmt = $this->conn->prepare($hist_query);
                $hist_stmt->execute([
                    $id,
                    $old_record['total_payment'], $this->total_payment,
                    $old_record['advance_payment'], $this->advance_payment,
                    $old_record['return_date'], $this->return_date,
                    $note,
                    $editor_id,
                    $branch_id ?? 1
                ]);
            }

            $this->conn->commit();
            return true;
        } catch (Exception $e) {
            if ($this->conn->inTransaction()) {
                $this->conn->rollBack();
            }
            error_log("Rental Update Error: " . $e->getMessage());
            return false;
        }
    }

    public function readAll($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT r.*, u.name as receiver_name, uc.name as creator_name
                      FROM " . $this->table_name . " r
                      LEFT JOIN users u ON r.received_by = u.id
                      LEFT JOIN users uc ON r.created_by = uc.id
                      WHERE r.branch_id = :branch_id
                      ORDER BY r.created_at DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT r.*, u.name as receiver_name, uc.name as creator_name
                      FROM " . $this->table_name . " r
                      LEFT JOIN users u ON r.received_by = u.id
                      LEFT JOIN users uc ON r.created_by = uc.id
                      ORDER BY r.created_at DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    public function readOne($id, $branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT r.*, u.name as receiver_name, uc.name as creator_name
                      FROM " . $this->table_name . " r
                      LEFT JOIN users u ON r.received_by = u.id
                      LEFT JOIN users uc ON r.created_by = uc.id
                      WHERE r.id = ? AND r.branch_id = ? LIMIT 0,1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id, $branch_id]);
        } else {
            $query = "SELECT r.*, u.name as receiver_name, uc.name as creator_name
                      FROM " . $this->table_name . " r
                      LEFT JOIN users u ON r.received_by = u.id
                      LEFT JOIN users uc ON r.created_by = uc.id
                      WHERE r.id = ? LIMIT 0,1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
        }
        $rental = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($rental) {
            $items_query = "SELECT * FROM rental_items WHERE rental_id = ?";
            $items_stmt = $this->conn->prepare($items_query);
            $items_stmt->execute([$id]);
            $rental['items'] = $items_stmt->fetchAll(PDO::FETCH_ASSOC);
        }

        return $rental;
    }

    public function getMemory() {
        $query = "SELECT product_name, category FROM rental_item_memory ORDER BY product_name ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function markAsPaid($id, $branch_id = null) {
        $query = "UPDATE " . $this->table_name . " 
                  SET advance_payment = total_payment, remaining_payment = 0 
                  WHERE id = :id";
        
        if ($branch_id !== null) {
            $query .= " AND branch_id = :branch_id";
        }

        $stmt = $this->conn->prepare($query);
        $stmt->bindParam(":id", $id);
        if ($branch_id !== null) {
            $stmt->bindParam(":branch_id", $branch_id);
        }

        return $stmt->execute();
    }
}
?>
