<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        if ($method !== 'POST') {
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
            return;
        }

        // Action routing e.g., /api/auth/login -> $parts[0] is 'login'
        $action = $parts[0] ?? null;

        if ($action === 'login') {
            $this->login();
        } else {
            http_response_code(404);
            echo json_encode(["message" => "Auth endpoint not found"]);
        }
    }

    private function login() {
        $data = json_decode(file_get_contents("php://input"));
        
        if (!empty($data->name) && !empty($data->password)) {
            $user = new User($this->db);
            $user->name = $data->name;
            $user->password = $data->password;
            
            $login_result = $user->login();
            
            if ($login_result === "success") {
                // Fetch branch name
                $branch_name = 'Main Branch';
                if ($user->branch_id) {
                    $bstmt = $this->db->prepare("SELECT name FROM branches WHERE id = ? LIMIT 1");
                    $bstmt->execute([$user->branch_id]);
                    $brow = $bstmt->fetch(PDO::FETCH_ASSOC);
                    if ($brow) $branch_name = $brow['name'];
                }

                $payload = [
                    "id"          => $user->id,
                    "name"        => $user->name,
                    "role"        => $user->role,
                    "branch_id"   => (int)$user->branch_id,
                    "branch_name" => $branch_name
                ];
                $jwt = JWT::encode($payload);
                
                http_response_code(200);
                echo json_encode([
                    "message" => "Login successful",
                    "token"   => $jwt,
                    "user"    => $payload
                ]);
            } else if ($login_result === "blocked") {
                http_response_code(403);
                echo json_encode(["message" => "Account is blocked. Contact administrator."]);
            } else {
                http_response_code(401);
                echo json_encode(["message" => "Invalid credentials."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data. Provide name and password."]);
        }
    }
}
?>
