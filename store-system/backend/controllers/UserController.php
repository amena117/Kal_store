<?php
require_once __DIR__ . '/../models/User.php';

class UserController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        // All user endpoints require Admin role
        // User list (GET) is accessible by any authenticated user for the dropdowns
        // Modified: only POST, PUT require Admin role
        $payload = JWT::validateRole();

        $id = $parts[0] ?? null;

        switch ($method) {
            case 'GET':
                if ($id) {
                    $this->getUser($id);
                } else {
                    // Admin can optionally filter by branch via ?branch_id=X
                    $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                        ? (int)$_GET['branch_id'] : null;
                    $this->getUsers($branch_id);
                }
                break;
            case 'POST':
                if ($payload['role'] !== 'Admin') {
                    http_response_code(403);
                    echo json_encode(["message" => "Forbidden: Admin required to create users."]);
                    return;
                }
                $this->createUser($payload);
                break;
            case 'PUT':
                if ($id === 'profile') {
                    $this->updateProfile($payload);
                } else {
                    if ($payload['role'] !== 'Admin') {
                        http_response_code(403);
                        echo json_encode(["message" => "Forbidden: Admin required to update users."]);
                        return;
                    }
                    if ($id) {
                        $this->updateUser($id, $payload);
                    } else {
                        http_response_code(400);
                        echo json_encode(["message" => "User ID required for update."]);
                    }
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
    }

    private function getUsers($branch_id = null) {
        $user = new User($this->db);
        $stmt = $user->read($branch_id);

        $users_arr = [];
        while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
            $users_arr[] = [
                "id"          => $row['id'],
                "name"        => $row['name'],
                "username"    => $row['username'],
                "role"        => $row['role'],
                "status"      => $row['status'],
                "branch_id"   => $row['branch_id'],
                "branch_name" => $row['branch_name'] ?? 'Unknown',
                "created_at"  => $row['created_at']
            ];
        }
        http_response_code(200);
        echo json_encode($users_arr);
    }

    private function getUser($id) {
        http_response_code(501);
        echo json_encode(["message" => "Not implemented"]);
    }

    private function createUser($payload) {
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->name) && !empty($data->username) && !empty($data->role) && !empty($data->password)) {
            $user = new User($this->db);
            $user->name      = $data->name;
            $user->username  = $data->username;
            $user->role      = $data->role;
            $user->password  = $data->password;
            $user->status    = $data->status ?? 'active';
            // Admin assigns a branch; defaults to admin's own (but admin is global, so default 1)
            $user->branch_id = isset($data->branch_id) && is_numeric($data->branch_id)
                ? (int)$data->branch_id : 1;

            if($user->create()) {
                http_response_code(201);
                echo json_encode(["message" => "User created successfully."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to create user."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
    }

    private function updateUser($id, $payload) {
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->name) && !empty($data->username) && !empty($data->role) && !empty($data->status)) {
            $user = new User($this->db);
            $user->id        = $id;
            $user->name      = $data->name;
            $user->username  = $data->username;
            $user->role      = $data->role;
            $user->status    = $data->status;
            $user->branch_id = isset($data->branch_id) && is_numeric($data->branch_id)
                ? (int)$data->branch_id : 1;
            
            if(isset($data->password) && !empty($data->password)) {
                $user->password = $data->password;
            }

            if($user->update()) {
                http_response_code(200);
                echo json_encode(["message" => "User updated successfully."]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to update user."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data."]);
        }
    }

    private function updateProfile($payload) {
        $data = json_decode(file_get_contents("php://input"));

        if(!empty($data->username)) {
            $user = new User($this->db);
            $user->id        = $payload['id'];
            $user->username  = $data->username;
            
            if(isset($data->password) && !empty($data->password)) {
                $user->password = $data->password;
            }

            if($user->updateProfile()) {
                http_response_code(200);
                echo json_encode(["message" => "Profile updated successfully. Please log in again if you changed your credentials.", "requires_login" => true]);
            } else {
                http_response_code(503);
                echo json_encode(["message" => "Unable to update profile. Username may be taken."]);
            }
        } else {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data. Username is required."]);
        }
    }
}
?>
