<?php
require_once __DIR__ . '/../models/Rental.php';
require_once __DIR__ . '/../helpers/JWT.php';

class RentalController {
    private $db;
    private $rental;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
        $this->rental = new Rental($this->db);
        
        // Ensure tables exist (Lazy migration)
        $this->ensureTablesExist();
    }

    private function ensureTablesExist() {
        try {
            $stmt = $this->db->query("SELECT 1 FROM rentals LIMIT 1");
            if ($stmt) {
                $stmt->closeCursor();
            }
        } catch (Exception $e) {
            // Tables don't exist, try to create them
            $sql1 = "CREATE TABLE IF NOT EXISTS rentals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                total_payment DECIMAL(10,2) NOT NULL,
                advance_payment DECIMAL(10,2) NOT NULL,
                remaining_payment DECIMAL(10,2) NOT NULL,
                take_away_date DATE NOT NULL,
                return_date DATE NOT NULL,
                received_by INT,
                customer_name VARCHAR(255),
                phone_number VARCHAR(20),
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL,
                FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
            )";

            $sql2 = "CREATE TABLE IF NOT EXISTS rental_items (
                id INT AUTO_INCREMENT PRIMARY KEY,
                rental_id INT NOT NULL,
                product_name VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                quantity INT NOT NULL,
                FOREIGN KEY (rental_id) REFERENCES rentals(id) ON DELETE CASCADE
            )";

            $sql3 = "CREATE TABLE IF NOT EXISTS rental_item_memory (
                id INT AUTO_INCREMENT PRIMARY KEY,
                product_name VARCHAR(255) NOT NULL,
                category VARCHAR(255) NOT NULL,
                UNIQUE KEY unique_entry (product_name, category)
            )";

            $this->db->exec($sql1);
            $this->db->exec($sql2);
            $this->db->exec($sql3);
        }
    }

    public function processRequest($method, $parts) {
        $user_data = JWT::validateRole();
        
        $user_role = $user_data['role'];
        $user_id   = $user_data['id'];

        // Determine branch scope
        $branch_id = null;
        if ($user_role === 'Admin') {
            $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                ? (int)$_GET['branch_id'] : null;
        } else {
            $branch_id = (int)($user_data['branch_id'] ?? 1);
        }

        $id = isset($parts[0]) ? $parts[0] : null;

        // Check for specific endpoint /api/rentals/memory
        if($id === 'memory') {
            if ($method === 'GET') {
                $this->getMemory();
            } else {
                http_response_code(405);
                echo json_encode(["message" => "Method Not Allowed"]);
            }
            return;
        }

        // Check for /api/rentals/{id}/mark-paid
        if ($id && isset($parts[1]) && $parts[1] === 'mark-paid') {
            if ($method === 'POST') {
                if ($user_role !== 'Admin' && $user_role !== 'Manager') {
                    http_response_code(403);
                    echo json_encode(["message" => "Forbidden: Admin or Manager required."]);
                    return;
                }
                $this->markRentalAsPaid($id, $branch_id);
            } else {
                http_response_code(405);
                echo json_encode(["message" => "Method Not Allowed"]);
            }
            return;
        }

        switch ($method) {
            case 'GET':
                if ($id === 'history') {
                    $this->getHistory($branch_id);
                } elseif ($id) {
                    $this->getRental($id, $branch_id);
                } else {
                    $this->getAllRentals($branch_id);
                }
                break;
            case 'POST':
                // All roles can create
                $this->createRental($user_id, $branch_id);
                break;
            case 'PUT':
                // Only Admin and Manager can edit
                if ($user_role !== 'Admin' && $user_role !== 'Manager') {
                    http_response_code(403);
                    echo json_encode(["message" => "Forbidden: Admin or Manager required to edit rentals."]);
                    return;
                }
                if ($id) {
                    $this->updateRental($id, $user_id, $branch_id);
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Rental ID required for update."]);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method Not Allowed"]);
                break;
        }
    }

    private function getAllRentals($branch_id = null) {
        $stmt = $this->rental->readAll($branch_id);
        $rentals = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($rentals);
    }

    private function getRental($id, $branch_id = null) {
        $res = $this->rental->readOne($id, $branch_id);
        if ($res) {
            echo json_encode($res);
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Rental not found"]);
        }
    }

    private function getHistory($branch_id = null) {
        $query = "SELECT rh.*, r.customer_name as rental_customer, u.name as editor_name
                  FROM rental_history rh
                  JOIN rentals r ON rh.rental_id = r.id
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

    private function getMemory() {
        $stmt = $this->rental->getMemory();
        $memory = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($memory);
    }

    private function createRental($user_id, $branch_id = 1) {
        $data = json_decode(file_get_contents("php://input"));
        
        if (empty($data->total_payment) || !isset($data->advance_payment) || empty($data->take_away_date) || empty($data->return_date) || empty($data->received_by) || empty($data->customer_name) || empty($data->phone_number) || empty($data->items)) {
            http_response_code(400);
            echo json_encode(["message" => "Missing required fields or items list empty."]);
            return;
        }

        $this->rental->total_payment     = $data->total_payment;
        $this->rental->advance_payment   = $data->advance_payment;
        $this->rental->remaining_payment = $data->remaining_payment ?? ($data->total_payment - $data->advance_payment);
        $this->rental->take_away_date    = $data->take_away_date;
        $this->rental->return_date       = $data->return_date;
        $this->rental->received_by       = $data->received_by;
        $this->rental->customer_name     = $data->customer_name;
        $this->rental->phone_number      = $data->phone_number;
        $this->rental->created_by        = $user_id;
        $this->rental->branch_id         = $branch_id;

        if ($this->rental->create($data->items)) {
            http_response_code(201);
            echo json_encode(["message" => "Rental created successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Could not create rental."]);
        }
    }

    private function updateRental($id, $editor_id, $branch_id = null) {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!isset($data->total_payment) || !isset($data->advance_payment) || empty($data->take_away_date) || empty($data->return_date) || empty($data->received_by) || empty($data->customer_name) || empty($data->phone_number) || empty($data->items)) {
            http_response_code(400);
            echo json_encode(["message" => "Missing required fields or items list empty."]);
            return;
        }

        $this->rental->total_payment = $data->total_payment;
        $this->rental->advance_payment = $data->advance_payment;
        $this->rental->remaining_payment = $data->remaining_payment ?? ($data->total_payment - $data->advance_payment);
        $this->rental->take_away_date = $data->take_away_date;
        $this->rental->return_date = $data->return_date;
        $this->rental->received_by = $data->received_by;
        $this->rental->customer_name = $data->customer_name;
        $this->rental->phone_number = $data->phone_number;

        if ($this->rental->update($id, $data->items, $branch_id, $editor_id, $data->note ?? '')) {
            http_response_code(200);
            echo json_encode(["message" => "Rental updated successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Could not update rental."]);
        }
    }

    private function markRentalAsPaid($id, $branch_id = null) {
        if ($this->rental->markAsPaid($id, $branch_id)) {
            http_response_code(200);
            echo json_encode(["message" => "Rental marked as fully paid."]);
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Could not update rental status."]);
        }
    }
}
?>
