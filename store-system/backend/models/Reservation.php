<?php
class Reservation {
    private $conn;
    private $table_name = "reservations";

    public $id;
    public $event_date;
    public $place;
    public $category;
    public $advance_payment;
    public $description;
    public $contact_name;
    public $phone;
    public $email;
    public $contract_image;
    public $sample_image;
    public $created_by;
    public $branch_id;
    public $created_at;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " 
            SET event_date=:event_date, place=:place, category=:category, advance_payment=:advance_payment, 
                description=:description, contact_name=:contact_name, phone=:phone, email=:email, 
                contract_image=:contract_image, sample_image=:sample_image, created_by=:created_by, branch_id=:branch_id";
        
        $stmt = $this->conn->prepare($query);

        // Sanitize and bind
        $this->event_date = htmlspecialchars(strip_tags($this->event_date));
        $this->place = htmlspecialchars(strip_tags($this->place));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->advance_payment = htmlspecialchars(strip_tags($this->advance_payment));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->contact_name = htmlspecialchars(strip_tags($this->contact_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->contract_image = htmlspecialchars(strip_tags($this->contract_image));
        $this->sample_image = htmlspecialchars(strip_tags($this->sample_image));
        $this->created_by = (int)$this->created_by;

        $stmt->bindParam(":event_date", $this->event_date);
        $stmt->bindParam(":place", $this->place);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":advance_payment", $this->advance_payment);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":contact_name", $this->contact_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":contract_image", $this->contract_image);
        $stmt->bindParam(":sample_image", $this->sample_image);
        $stmt->bindParam(":created_by", $this->created_by);
        $branch = (int)($this->branch_id ?? 1);
        $stmt->bindParam(":branch_id", $branch);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function read($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT r.*, u.name as creator_name 
                FROM " . $this->table_name . " r
                LEFT JOIN users u ON r.created_by = u.id
                WHERE r.branch_id = :branch_id
                ORDER BY r.event_date ASC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT r.*, u.name as creator_name 
                FROM " . $this->table_name . " r
                LEFT JOIN users u ON r.created_by = u.id
                ORDER BY r.event_date ASC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    public function readOne($id, $branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT r.*, u.name as creator_name 
                FROM " . $this->table_name . " r
                LEFT JOIN users u ON r.created_by = u.id
                WHERE r.id = ? AND r.branch_id = ? LIMIT 0,1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id, $branch_id]);
        } else {
            $query = "SELECT r.*, u.name as creator_name 
                FROM " . $this->table_name . " r
                LEFT JOIN users u ON r.created_by = u.id
                WHERE r.id = ? LIMIT 0,1";
            $stmt = $this->conn->prepare($query);
            $stmt->execute([$id]);
        }
        return $stmt->fetch(PDO::FETCH_ASSOC);
    }

    public function update($branch_id = null, $editor_id = null, $note = '') {
        // Fetch old record to log changes
        $old_record = $this->readOne($this->id, $branch_id);

        $query = "UPDATE " . $this->table_name . " 
            SET event_date=:event_date, place=:place, category=:category, advance_payment=:advance_payment, 
                description=:description, contact_name=:contact_name, phone=:phone, email=:email, 
                contract_image=:contract_image, sample_image=:sample_image
            WHERE id=:id";
        
        if ($branch_id !== null) {
            $query .= " AND branch_id=:branch_id";
        }

        $stmt = $this->conn->prepare($query);

        // Sanitize and bind
        $this->id = (int)$this->id;
        $this->event_date = htmlspecialchars(strip_tags($this->event_date));
        $this->place = htmlspecialchars(strip_tags($this->place));
        $this->category = htmlspecialchars(strip_tags($this->category));
        $this->advance_payment = htmlspecialchars(strip_tags($this->advance_payment));
        $this->description = htmlspecialchars(strip_tags($this->description));
        $this->contact_name = htmlspecialchars(strip_tags($this->contact_name));
        $this->phone = htmlspecialchars(strip_tags($this->phone));
        $this->email = htmlspecialchars(strip_tags($this->email));
        $this->contract_image = htmlspecialchars(strip_tags($this->contract_image));
        $this->sample_image = htmlspecialchars(strip_tags($this->sample_image));

        $stmt->bindParam(":id", $this->id);
        $stmt->bindParam(":event_date", $this->event_date);
        $stmt->bindParam(":place", $this->place);
        $stmt->bindParam(":category", $this->category);
        $stmt->bindParam(":advance_payment", $this->advance_payment);
        $stmt->bindParam(":description", $this->description);
        $stmt->bindParam(":contact_name", $this->contact_name);
        $stmt->bindParam(":phone", $this->phone);
        $stmt->bindParam(":email", $this->email);
        $stmt->bindParam(":contract_image", $this->contract_image);
        $stmt->bindParam(":sample_image", $this->sample_image);

        if ($branch_id !== null) {
            $stmt->bindParam(":branch_id", $branch_id);
        }

        if($stmt->execute()) {
            // Insert into reservation_history if editor_id is provided
            if ($editor_id !== null && $old_record) {
                $hist_query = "INSERT INTO reservation_history 
                    (reservation_id, old_event_date, new_event_date, old_advance, new_advance, old_contact, new_contact, note, edited_by, branch_id)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
                $hist_stmt = $this->conn->prepare($hist_query);
                $hist_stmt->execute([
                    $this->id,
                    $old_record['event_date'], $this->event_date,
                    $old_record['advance_payment'], $this->advance_payment,
                    $old_record['contact_name'], $this->contact_name,
                    $note,
                    $editor_id,
                    $branch_id ?? 1
                ]);
            }
            return true;
        }
        return false;
    }
}
?>
