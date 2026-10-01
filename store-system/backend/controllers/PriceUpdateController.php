<?php
require_once __DIR__ . '/../models/PriceUpdate.php';

class PriceUpdateController {
    private $db;

    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        // Authenticate user with role Admin, Manager, or Encoder
        $payload = JWT::validateRole(['Admin', 'Manager', 'Encoder']);

        $branch_id = null;
        if ($payload['role'] === 'Admin') {
            $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                ? (int)$_GET['branch_id'] : null;
        } else {
            $branch_id = (int)($payload['branch_id'] ?? 1);
        }

        switch ($method) {
            case 'GET':
                $this->getPriceUpdates($branch_id);
                break;
            case 'POST':
                $this->createPriceUpdate($payload, $branch_id);
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
    }

    private function getPriceUpdates($branch_id) {
        $priceUpdate = new PriceUpdate($this->db);
        $stmt = $priceUpdate->readAll($branch_id);
        $records = $stmt->fetchAll(PDO::FETCH_ASSOC);

        http_response_code(200);
        echo json_encode($records);
    }

    private function createPriceUpdate($payload, $branch_id) {
        $data = json_decode(file_get_contents("php://input"));

        if (empty($data->product_id) || !isset($data->new_price) || $data->new_price === '') {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data. Item and New Purchase Price are required."]);
            return;
        }

        $priceUpdate = new PriceUpdate($this->db);
        $priceUpdate->product_id = (int)$data->product_id;
        $priceUpdate->new_price = (float)$data->new_price;
        if (isset($data->new_selling_price) && $data->new_selling_price !== '') {
            $priceUpdate->new_selling_price = (float)$data->new_selling_price;
        } else {
            $priceUpdate->new_selling_price = null;
        }
        $priceUpdate->effective_date = !empty($data->effective_date) ? $data->effective_date : date('Y-m-d');
        $priceUpdate->remarks = !empty($data->remarks) ? $data->remarks : null;
        $priceUpdate->updated_by = (int)$payload['id'];
        $priceUpdate->branch_id = $branch_id ?? (int)($payload['branch_id'] ?? 1);

        $result = $priceUpdate->create();

        if ($result['success']) {
            http_response_code(201);
            echo json_encode($result);
        } else {
            http_response_code(500);
            echo json_encode($result);
        }
    }
}
?>
