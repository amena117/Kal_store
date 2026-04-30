<?php
require_once __DIR__ . '/../models/Product.php';

class ProductController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        $payload = JWT::validateRole(); // All roles need access to products list
        
        $id = $parts[0] ?? null;

        // Helper: determine effective branch_id for filtering
        // Admin can pass ?branch_id=X; others always use their own
        $branch_id = null;
        if ($payload['role'] === 'Admin') {
            $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                ? (int)$_GET['branch_id'] : null; // null = all branches
        } else {
            $branch_id = (int)($payload['branch_id'] ?? 1);
        }

        // Check for specific endpoint /api/products/history
        if($id === 'history') {
            if ($method === 'GET' && ($payload['role'] === 'Admin' || $payload['role'] === 'Manager' || $payload['role'] === 'Encoder')) {
                $this->getHistory($branch_id);
            } else {
                http_response_code(403);
                echo json_encode(["message" => "Access denied to history."]);
            }
            return;
        }

        // Check for specific endpoint /api/products/low-stock
        if($id === 'low-stock') {
            if ($method === 'GET' && ($payload['role'] === 'Admin' || $payload['role'] === 'Manager')) {
                $this->getLowStock($branch_id);
            } else {
                http_response_code(403);
                echo json_encode(["message" => "Access denied to notifications."]);
            }
            return;
        }

        switch ($method) {
            case 'GET':
                $this->getProducts($branch_id);
                break;
            case 'POST':
                if($payload['role'] !== 'Admin' && $payload['role'] !== 'Encoder' && $payload['role'] !== 'Manager') {
                    http_response_code(403);
                    echo json_encode(["message" => "Permission denied."]);
                    return;
                }
                $this->createProduct($branch_id ?? 1);
                break;
            case 'PUT':
                if($payload['role'] !== 'Admin' && $payload['role'] !== 'Encoder' && $payload['role'] !== 'Manager') {
                    http_response_code(403);
                    echo json_encode(["message" => "Permission denied."]);
                    return;
                }
                if ($id) {
                    $this->updateProduct($id, $payload['id'], $branch_id);
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Product ID required."]);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
    }

    private function getProducts($branch_id = null) {
        $product = new Product($this->db);
        $stmt = $product->read($branch_id);

        $prod_arr = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            array_push($prod_arr, $row);
        }
        http_response_code(200);
        echo json_encode($prod_arr);
    }

    private function createProduct($branch_id = 1) {
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->name) && !empty($data->arrival_price) && !empty($data->selling_price)) {
            $product = new Product($this->db);
            $product->name         = $data->name;
            $product->category_id  = $data->category_id ?? null;
            $product->arrival_price = $data->arrival_price;
            $product->selling_price = $data->selling_price;
            $product->quantity     = $data->quantity ?? 0;
            $product->branch_id    = (int)$branch_id;

            if($product->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Product created."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to create product."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
    }

    private function updateProduct($id, $user_id, $branch_id = null) {
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->name) && !empty($data->arrival_price) && !empty($data->selling_price)) {
            $product = new Product($this->db);
            $product->id = $id;
            $product->name = $data->name;
            $product->category_id = $data->category_id ?? null;
            $product->arrival_price = $data->arrival_price;
            $product->selling_price = $data->selling_price;
            $product->quantity = $data->quantity ?? 0;
            $product->changed_by = $user_id;

            if($product->update($branch_id)) {
                http_response_code(200);
                echo json_encode(["message" => "Product updated & history saved."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to update product."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
    }

    private function getHistory($branch_id = null) {
        $product = new Product($this->db);
        $stmt = $product->getHistory($branch_id);

        $hist_arr = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            array_push($hist_arr, $row);
        }
        http_response_code(200);
        echo json_encode($hist_arr);
    }

    private function getLowStock($branch_id = null) {
        $product = new Product($this->db);
        $stmt = $product->readLowStock($branch_id);

        $prod_arr = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            array_push($prod_arr, $row);
        }
        http_response_code(200);
        echo json_encode($prod_arr);
    }
}
?>
