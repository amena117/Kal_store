<?php
class User {
    private $conn;
    private $table_name = "users";

    public $id;
    public $name;
    public $username;
    public $role;
    public $status;
    public $password;
    public $branch_id;

    public function __construct($db) {
        $this->conn = $db;
    }

    public function login() {
        $query = "SELECT id, name, username, role, status, password, branch_id FROM " . $this->table_name . " WHERE name = ? OR username = ? LIMIT 0,1";
        $stmt = $this->conn->prepare($query);
        $identifier = htmlspecialchars(strip_tags($this->name));
        $stmt->bindParam(1, $identifier);
        $stmt->bindParam(2, $identifier);
        $stmt->execute();

        if($stmt->rowCount() > 0) {
            $row = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if($row['status'] === 'blocked') {
                return "blocked";
            }

            if(password_verify($this->password, $row['password'])) {
                $this->id        = $row['id'];
                $this->role      = $row['role'];
                $this->branch_id = $row['branch_id'];
                return "success";
            }
        }
        return "invalid";
    }

    /**
     * Read users. If $branch_id is null (Admin with no filter), returns all.
     * Otherwise scoped to that branch.
     */
    public function read($branch_id = null) {
        if ($branch_id !== null) {
            $query = "SELECT u.id, u.name, u.username, u.role, u.status, u.branch_id, u.created_at, b.name AS branch_name
                      FROM " . $this->table_name . " u
                      LEFT JOIN branches b ON u.branch_id = b.id
                      WHERE u.branch_id = :branch_id
                      ORDER BY u.id DESC";
            $stmt = $this->conn->prepare($query);
            $stmt->bindParam(':branch_id', $branch_id);
        } else {
            $query = "SELECT u.id, u.name, u.username, u.role, u.status, u.branch_id, u.created_at, b.name AS branch_name
                      FROM " . $this->table_name . " u
                      LEFT JOIN branches b ON u.branch_id = b.id
                      ORDER BY u.id DESC";
            $stmt = $this->conn->prepare($query);
        }
        $stmt->execute();
        return $stmt;
    }

    public function create() {
        $query = "INSERT INTO " . $this->table_name . " SET name=:name, username=:username, role=:role, password=:password, status=:status, branch_id=:branch_id";
        $stmt = $this->conn->prepare($query);

        $this->name      = htmlspecialchars(strip_tags($this->name));
        $this->username  = htmlspecialchars(strip_tags($this->username));
        $this->role      = htmlspecialchars(strip_tags($this->role));
        $this->status    = htmlspecialchars(strip_tags($this->status));
        $password_hash   = password_hash($this->password, PASSWORD_BCRYPT);
        $this->branch_id = (int)($this->branch_id ?? 1);

        $stmt->bindParam(":name",      $this->name);
        $stmt->bindParam(":username",  $this->username);
        $stmt->bindParam(":role",      $this->role);
        $stmt->bindParam(":password",  $password_hash);
        $stmt->bindParam(":status",    $this->status);
        $stmt->bindParam(":branch_id", $this->branch_id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function update() {
        $passwordBlock = !empty($this->password) ? ", password=:password" : "";
        $query = "UPDATE " . $this->table_name . " SET name=:name, username=:username, role=:role, status=:status, branch_id=:branch_id" . $passwordBlock . " WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);

        $this->name      = htmlspecialchars(strip_tags($this->name));
        $this->username  = htmlspecialchars(strip_tags($this->username));
        $this->role      = htmlspecialchars(strip_tags($this->role));
        $this->status    = htmlspecialchars(strip_tags($this->status));
        $this->id        = htmlspecialchars(strip_tags($this->id));
        $this->branch_id = (int)($this->branch_id ?? 1);

        $stmt->bindParam(":name",      $this->name);
        $stmt->bindParam(":username",  $this->username);
        $stmt->bindParam(":role",      $this->role);
        $stmt->bindParam(":status",    $this->status);
        $stmt->bindParam(":branch_id", $this->branch_id);
        if(!empty($this->password)) {
            $password_hash = password_hash($this->password, PASSWORD_BCRYPT);
            $stmt->bindParam(":password", $password_hash);
        }
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }

    public function updateProfile() {
        $passwordBlock = !empty($this->password) ? ", password=:password" : "";
        $query = "UPDATE " . $this->table_name . " SET username=:username" . $passwordBlock . " WHERE id = :id";
        
        $stmt = $this->conn->prepare($query);

        $this->username  = htmlspecialchars(strip_tags($this->username));
        $this->id        = htmlspecialchars(strip_tags($this->id));

        $stmt->bindParam(":username",  $this->username);
        if(!empty($this->password)) {
            $password_hash = password_hash($this->password, PASSWORD_BCRYPT);
            $stmt->bindParam(":password", $password_hash);
        }
        $stmt->bindParam(":id", $this->id);

        if($stmt->execute()) {
            return true;
        }
        return false;
    }
}
?>
