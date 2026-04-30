<?php
require_once __DIR__ . '/../models/Reservation.php';
require_once __DIR__ . '/../helpers/JWT.php';

class ReservationController {
    private $db;
    private $reservation;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->reservation = new Reservation($this->db);
        
        // Ensure table exists (Lazy migration)
        $this->ensureTableExists();
    }

    private function ensureTableExists() {
        try {
            $stmt = $this->db->query("SELECT 1 FROM reservations LIMIT 1");
            if ($stmt) {
                $stmt->closeCursor();
            }
        } catch (Exception $e) {
            // Table doesn't exist, try to create it
            $sql = "CREATE TABLE IF NOT EXISTS reservations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                event_date DATE NOT NULL,
                place VARCHAR(255) NOT NULL,
                category VARCHAR(50) NOT NULL,
                advance_payment DECIMAL(10,2) NOT NULL,
                description TEXT,
                contact_name VARCHAR(255) NOT NULL,
                phone VARCHAR(20) NOT NULL,
                email VARCHAR(255),
                contract_image VARCHAR(255) NOT NULL,
                sample_image VARCHAR(255),
                created_by INT,
                branch_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
            )";
            $this->db->exec($sql);
            
            // Also ensure role enum is updated
            $this->db->exec("ALTER TABLE users MODIFY COLUMN role ENUM('Admin', 'Encoder', 'Salesperson', 'Manager') NOT NULL");
        }

        // Always check for branch_id column if table already existed
        try {
            $this->db->query("SELECT branch_id FROM reservations LIMIT 1");
        } catch (Exception $e) {
            $this->db->exec("ALTER TABLE reservations ADD COLUMN branch_id INT DEFAULT 1, ADD CONSTRAINT fk_reservation_branch FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE");
        }
    }

    public function processRequest($method, $parts) {
        $user_data = JWT::validateRole();
        
        $user_role = $user_data['role'];
        $user_id   = $user_data['id'];

        // Only Admin and Manager can access reservations
        if ($user_role !== 'Admin' && $user_role !== 'Manager') {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden: Admin or Manager access required."]);
            return;
        }

        // Determine branch scope
        $branch_id = null;
        if ($user_role === 'Admin') {
            $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                ? (int)$_GET['branch_id'] : null;
        } else {
            $branch_id = (int)($user_data['branch_id'] ?? 1);
        }

        $id = isset($parts[0]) ? $parts[0] : null;

        switch ($method) {
            case 'GET':
                if ($id === 'history') {
                    $this->getHistory($branch_id);
                } elseif ($id) {
                    $this->getReservation($id, $branch_id);
                } else {
                    $this->getAllReservations($branch_id);
                }
                break;
            case 'POST':
                if ($id) {
                    $this->updateReservation($id, $user_id, $branch_id);
                } else {
                    $this->createReservation($user_id, $branch_id);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method Not Allowed"]);
                break;
        }
    }

    private function getAllReservations($branch_id = null) {
        $stmt = $this->reservation->read($branch_id);
        $reservations = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($reservations);
    }

    private function getReservation($id, $branch_id = null) {
        $res = $this->reservation->readOne($id, $branch_id);
        if ($res) {
            echo json_encode($res);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Reservation not found"]);
        }
    }

    private function getHistory($branch_id = null) {
        $query = "SELECT rh.*, r.place as reservation_place, r.contact_name as reservation_contact, u.name as editor_name
                  FROM reservation_history rh
                  JOIN reservations r ON rh.reservation_id = r.id
                  LEFT JOIN users u ON rh.edited_by = u.id";
        
        if ($branch_id !== null) {
            $query .= " WHERE rh.branch_id = :branch_id";
        }
        $query .= " ORDER BY rh.date DESC";

        $stmt = $this->db->prepare($query);
        if ($branch_id !== null) {
            $stmt->bindParam(':branch_id', $branch_id);
        }
        $stmt->execute();
        $history = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($history);
    }

    private function createReservation($userId, $branch_id = 1) {
        if (empty($_POST['event_date']) || empty($_POST['place']) || empty($_POST['category']) || empty($_FILES['contract_image'])) {
            http_response_code(400);
            echo json_encode(["message" => "Missing required fields."]);
            return;
        }

        $this->reservation->event_date      = $_POST['event_date'];
        $this->reservation->place           = $_POST['place'];
        $this->reservation->category        = $_POST['category'];
        $this->reservation->advance_payment = $_POST['advance_payment'];
        $this->reservation->description     = $_POST['description'] ?? '';
        $this->reservation->contact_name    = $_POST['contact_name'];
        $this->reservation->phone           = $_POST['phone'];
        $this->reservation->email           = $_POST['email'] ?? '';
        $this->reservation->created_by      = $userId;
        $this->reservation->branch_id       = $branch_id;

        // Handle File Uploads
        $upload_dir = __DIR__ . '/../uploads/reservations/';
        if (!is_dir($upload_dir)) {
            mkdir($upload_dir, 0777, true);
        }

        // 1. Contract Image (Required)
        $contract_file = $_FILES['contract_image'];
        $contract_ext = pathinfo($contract_file['name'], PATHINFO_EXTENSION);
        $contract_name = "contract_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $contract_ext;
        move_uploaded_file($contract_file['tmp_name'], $upload_dir . $contract_name);
        $this->reservation->contract_image = "uploads/reservations/" . $contract_name;

        // 2. Sample Image (Optional)
        if (!empty($_FILES['sample_image']['tmp_name'])) {
            $sample_file = $_FILES['sample_image'];
            $sample_ext = pathinfo($sample_file['name'], PATHINFO_EXTENSION);
            $sample_name = "sample_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $sample_ext;
            move_uploaded_file($sample_file['tmp_name'], $upload_dir . $sample_name);
            $this->reservation->sample_image = "uploads/reservations/" . $sample_name;
        } else {
            $this->reservation->sample_image = null;
        }

        if ($this->reservation->create()) {
            http_response_code(201);
            echo json_encode(["message" => "Reservation created successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Could not create reservation."]);
        }
    }

    private function updateReservation($id, $userId, $branch_id = null) {
        // 1. Find existing
        $existing = $this->reservation->readOne($id, $branch_id);
        if (!$existing) {
            http_response_code(404);
            echo json_encode(["message" => "Reservation not found or access denied."]);
            return;
        }

        // 2. Map fields
        $this->reservation->id              = $id;
        $this->reservation->event_date      = $_POST['event_date'] ?? $existing['event_date'];
        $this->reservation->place           = $_POST['place'] ?? $existing['place'];
        $this->reservation->category        = $_POST['category'] ?? $existing['category'];
        $this->reservation->advance_payment = $_POST['advance_payment'] ?? $existing['advance_payment'];
        $this->reservation->description     = $_POST['description'] ?? $existing['description'];
        $this->reservation->contact_name    = $_POST['contact_name'] ?? $existing['contact_name'];
        $this->reservation->phone           = $_POST['phone'] ?? $existing['phone'];
        $this->reservation->email           = $_POST['email'] ?? $existing['email'];
        // Note: created_by should not change
        $this->reservation->created_by      = $existing['created_by'];
        $this->reservation->branch_id       = $existing['branch_id'];

        // Handle Images
        $upload_dir = __DIR__ . '/../uploads/reservations/';
        
        // Contract Image
        if (!empty($_FILES['contract_image']['tmp_name'])) {
            // Delete old
            if ($existing['contract_image'] && file_exists(__DIR__ . '/../' . $existing['contract_image'])) {
                @unlink(__DIR__ . '/../' . $existing['contract_image']);
            }
            $contract_file = $_FILES['contract_image'];
            $contract_ext = pathinfo($contract_file['name'], PATHINFO_EXTENSION);
            $contract_name = "contract_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $contract_ext;
            move_uploaded_file($contract_file['tmp_name'], $upload_dir . $contract_name);
            $this->reservation->contract_image = "uploads/reservations/" . $contract_name;
        } else {
            $this->reservation->contract_image = $existing['contract_image'];
        }

        // Sample Image
        if (!empty($_FILES['sample_image']['tmp_name'])) {
            // Delete old
            if ($existing['sample_image'] && file_exists(__DIR__ . '/../' . $existing['sample_image'])) {
                @unlink(__DIR__ . '/../' . $existing['sample_image']);
            }
            $sample_file = $_FILES['sample_image'];
            $sample_ext = pathinfo($sample_file['name'], PATHINFO_EXTENSION);
            $sample_name = "sample_" . time() . "_" . bin2hex(random_bytes(4)) . "." . $sample_ext;
            move_uploaded_file($sample_file['tmp_name'], $upload_dir . $sample_name);
            $this->reservation->sample_image = "uploads/reservations/" . $sample_name;
        } else {
            $this->reservation->sample_image = $existing['sample_image'];
        }

        if ($this->reservation->update($branch_id, $userId, $_POST['note'] ?? '')) {
            http_response_code(200);
            echo json_encode(["message" => "Reservation updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Could not update reservation."]);
        }
    }
}
?>
