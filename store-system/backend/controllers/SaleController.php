<?php
require_once __DIR__ . '/../models/Sale.php';

class SaleController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        $payload = JWT::validateRole();

        // Determine effective branch_id
        $branch_id = null;
        if ($payload['role'] === 'Admin') {
            $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                ? (int)$_GET['branch_id'] : null;
        } else {
            $branch_id = (int)($payload['branch_id'] ?? 1);
        }

        // Check for sub-resource: /sales/history
        if ($method === 'GET' && isset($parts[0]) && $parts[0] === 'history') {
            if($payload['role'] !== 'Admin' && $payload['role'] !== 'Manager') {
                http_response_code(403);
                echo json_encode(["message" => "Permission denied."]);
                return;
            }
            $this->getSalesEditHistory($branch_id);
            return;
        }

        // Check for /sales/{id} (PUT)
        $id = isset($parts[0]) && is_numeric($parts[0]) ? (int)$parts[0] : null;

        switch ($method) {
            case 'GET':
                // Admin, Manager, and Encoder can view all sales
                if($payload['role'] !== 'Admin' && $payload['role'] !== 'Encoder' && $payload['role'] !== 'Manager') {
                    http_response_code(403);
                    echo json_encode(["message" => "Permission denied to view all sales history."]);
                    return;
                }
                $this->getSales($branch_id);
                break;

            case 'POST':
                if(!in_array($payload['role'], ['Admin', 'Salesperson', 'Encoder', 'Manager'])) {
                    http_response_code(403);
                    echo json_encode(["message" => "Permission denied."]);
                    return;
                }
                $this->createSale($payload['id'], $branch_id ?? 1);
                break;

            case 'PUT':
                // Only Admin and Manager can edit sales
                if($payload['role'] !== 'Admin' && $payload['role'] !== 'Manager') {
                    http_response_code(403);
                    echo json_encode(["message" => "Permission denied. Only Admin and Manager can edit sales."]);
                    return;
                }
                if (!$id) {
                    http_response_code(400);
                    echo json_encode(["message" => "Sale ID required."]);
                    return;
                }
                $this->updateSale($id, $payload['id'], $branch_id);
                break;

            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
    }

    private function getSales($branch_id = null) {
        $sale = new Sale($this->db);
        $stmt = $sale->readAll($branch_id);

        $sales_arr = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            array_push($sales_arr, $row);
        }
        http_response_code(200);
        echo json_encode($sales_arr);
    }

    private function getSalesEditHistory($branch_id = null) {
        $sale = new Sale($this->db);
        $stmt = $sale->readHistory($branch_id);

        $history_arr = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            array_push($history_arr, $row);
        }
        http_response_code(200);
        echo json_encode($history_arr);
    }

    private function createSale($user_id, $branch_id = 1) {
        $data = json_decode(file_get_contents("php://input"));

        if(isset($data->product_id) && isset($data->quantity) && isset($data->selling_price) && isset($data->total)) {
            $sale = new Sale($this->db);
            $sale->product_id    = (int)$data->product_id;
            $sale->quantity      = (int)$data->quantity;
            $sale->selling_price = (float)$data->selling_price;
            $sale->total         = (float)$data->total;
            $sale->user_id       = (int)$user_id;
            $sale->branch_id     = (int)$branch_id;
            
            // Allow backdating if provided, else use current time
            if (!empty($data->actual_sale_date)) {
                $actual_date = trim($data->actual_sale_date);
                if (strlen($actual_date) === 10) {
                    $actual_date .= ' ' . date('H:i:s');
                }
                $sale->actual_sale_date = $actual_date;
            } else {
                $sale->actual_sale_date = date('Y-m-d H:i:s');
            }

            $result = $sale->create();

            if($result === "success") {
                http_response_code(201);
                echo json_encode(["message" => "Sale recorded successfully."]);
            } else if($result === "insufficient_stock") {
                http_response_code(400);
                echo json_encode(["message" => "Insufficient stock available."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to record sale.", "error" => $result]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data for sale."]);
        }
    }

    private function updateSale($sale_id, $editor_id, $branch_id = null) {
        $data = json_decode(file_get_contents("php://input"));

        if(!isset($data->quantity) || !isset($data->selling_price)) {
            http_response_code(400);
            echo json_encode(["message" => "quantity and selling_price are required."]);
            return;
        }

        $sale = new Sale($this->db);
        $result = $sale->update(
            $sale_id,
            $data->quantity,
            $data->selling_price,
            $data->actual_sale_date ?? null,
            $data->note ?? '',
            $editor_id,
            $branch_id
        );

        if($result === "success") {
            http_response_code(200);
            echo json_encode(["message" => "Sale updated successfully."]);
        } else if($result === "not_found") {
            http_response_code(404);
            echo json_encode(["message" => "Sale not found."]);
        } else if($result === "insufficient_stock") {
            http_response_code(400);
            echo json_encode(["message" => "Insufficient stock for new quantity."]);
        } else {
            http_response_code(503);
            echo json_encode(["message" => "Unable to update sale.", "debug" => $result]);
        }
    }
}
?>
