<?php
class Branch {
    private $conn;
    private $table = "branches";

    public $id;
    public $name;
    public $location;
    public $status;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function read() {
        $query = "SELECT id, name, location, status, created_at FROM " . $this->table . " ORDER BY id ASC";
        $stmt = $this->conn->prepare($query);
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table . " SET name=:name, location=:location, status=:status";
        $stmt = $this->conn->prepare($query);

        $this->name     = htmlspecialchars(strip_tags($this->name));
        $this->location = htmlspecialchars(strip_tags($this->location ?? ''));
        $this->status   = htmlspecialchars(strip_tags($this->status ?? 'active'));

        $stmt->bindParam(':name',     $this->name);
        $stmt->bindParam(':location', $this->location);
        $stmt->bindParam(':status',   $this->status);

        return $stmt->execute();
    }

    public function update() {
        $query = "UPDATE " . $this->table . " SET name=:name, location=:location, status=:status WHERE id=:id";
        $stmt = $this->conn->prepare($query);

        $this->name     = htmlspecialchars(strip_tags($this->name));
        $this->location = htmlspecialchars(strip_tags($this->location ?? ''));
        $this->status   = htmlspecialchars(strip_tags($this->status ?? 'active'));
        $this->id       = (int)$this->id;

        $stmt->bindParam(':name',     $this->name);
        $stmt->bindParam(':location', $this->location);
        $stmt->bindParam(':status',   $this->status);
        $stmt->bindParam(':id',       $this->id);

        return $stmt->execute();
    }
}
?>
