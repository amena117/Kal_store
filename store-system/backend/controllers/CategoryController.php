<?php
require_once __DIR__ . '/../models/Category.php';

class CategoryController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        // All roles can read categories (Auth required)
        $payload = JWT::validateRole();
        
        $id = $parts[0] ?? null;

        switch ($method) {
            case 'GET':
                $this->getCategories();
                break;
            case 'POST':
                if($payload['role'] !== 'Admin' && $payload['role'] !== 'Encoder') {
                    http_response_code(403);
                    echo json_encode(["message" => "Only Admin or Encoder can create categories."]);
                    return;
                }
                $this->createCategory();
                break;
            case 'PUT':
                if($payload['role'] !== 'Admin' && $payload['role'] !== 'Encoder') {
                    http_response_code(403);
                    echo json_encode(["message" => "Only Admin or Encoder can update categories."]);
                    return;
                }
                if ($id) {
                    $this->updateCategory($id);
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Category ID required for update."]);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
    }

    private function getCategories() {
        $category = new Category($this->db);
        $stmt = $category->read();

        $cats_arr = array();
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)){
            extract($row);
            $cat_item = array(
                "id" => $id,
                "name" => $name
            );
            array_push($cats_arr, $cat_item);
        }
        http_response_code(200);
        echo json_encode($cats_arr);
    }

    private function createCategory() {
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->name)) {
            $category = new Category($this->db);
            $category->name = $data->name;

            if($category->create()) {
                http_response_code(201);
                echo json_encode(["message" => "Category created successfully."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to create category, may already exist."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
    }

    private function updateCategory($id) {
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->name)) {
            $category = new Category($this->db);
            $category->id = $id;
            $category->name = $data->name;

            if($category->update()) {
                http_response_code(200);
                echo json_encode(["message" => "Category updated successfully."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to update category."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
    }
}
?>
