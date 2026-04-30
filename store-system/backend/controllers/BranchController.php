<?php
require_once __DIR__ . '/../models/Branch.php';

class BranchController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        $id = isset($parts[0]) && is_numeric($parts[0]) ? (int)$parts[0] : null;

        switch ($method) {
            case 'GET':
                // Both Admin and Manager can view branches
                JWT::validateRole(['Admin', 'Manager']);
                $this->getBranches();
                break;
            case 'POST':
                // Only Admin can create branches
                JWT::validateRole(['Admin']);
                $this->createBranch();
                break;
            case 'PUT':
                // Only Admin can update branches
                JWT::validateRole(['Admin']);
                if ($id) {
                    $this->updateBranch($id);
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Branch ID required."]);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
        }
    }

    private function getBranches() {
        $branch = new Branch($this->db);
        $stmt = $branch->read();
        $arr = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $arr[] = $row;
        }
        http_response_code(200);
        echo json_encode($arr);
    }

    private function createBranch() {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name)) {
            http_response_code(400);
            echo json_encode(["message" => "Branch name is required."]);
            return;
        }
        $branch = new Branch($this->db);
        $branch->name     = $data->name;
        $branch->location = $data->location ?? '';
        $branch->status   = $data->status ?? 'active';

        if ($branch->create()) {
            http_response_code(201);
            echo json_encode(["message" => "Branch created successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to create branch."]);
        }
    }

    private function updateBranch($id) {
        $data = json_decode(file_get_contents("php://input"));
        if (empty($data->name)) {
            http_response_code(400);
            echo json_encode(["message" => "Branch name is required."]);
            return;
        }
        $branch = new Branch($this->db);
        $branch->id       = $id;
        $branch->name     = $data->name;
        $branch->location = $data->location ?? '';
        $branch->status   = $data->status ?? 'active';

        if ($branch->update()) {
            http_response_code(200);
            echo json_encode(["message" => "Branch updated successfully."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update branch."]);
        }
    }
}
?>
