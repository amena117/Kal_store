<?php
class ExpenseController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        $payload = JWT::validateRole(['Admin', 'Manager', 'Encoder', 'Salesperson']);
        
        switch ($method) {
            case 'GET':
                if (isset($parts[0]) && $parts[0] === 'history') {
                    $this->getHistory($payload);
                } else {
                    $this->getExpenses($payload);
                }
                break;
            case 'POST':
                $this->addExpense($payload);
                break;
            case 'PUT':
                if (isset($parts[0]) && is_numeric($parts[0])) {
                    $this->updateExpense((int)$parts[0], $payload);
                } else {
                    http_response_code(400);
                    echo json_encode(["message" => "Expense ID required"]);
                }
                break;
            default:
                http_response_code(405);
                echo json_encode(["message" => "Method not allowed"]);
                break;
        }
    }

    private function getExpenses($payload) {
        try {
            $branch_id = null;
            if ($payload['role'] === 'Admin') {
                $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                    ? (int)$_GET['branch_id'] : null;
            } else {
                $branch_id = (int)($payload['branch_id'] ?? 1);
            }

            $whereClause = "";
            $params = [];
            if ($branch_id !== null) {
                $whereClause = "WHERE e.branch_id = :branch_id";
                $params[':branch_id'] = $branch_id;
            }

            $query = "SELECT e.*, u.name as registered_by 
                      FROM expenses e 
                      JOIN users u ON e.user_id = u.id 
                      $whereClause 
                      ORDER BY e.expense_date DESC, e.id DESC";
                      
            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $expenses = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Fetch total expenses securely
            $totalQuery = "SELECT SUM(amount) as total FROM expenses e $whereClause";
            $stmt2 = $this->db->prepare($totalQuery);
            $stmt2->execute($params);
            $totalRow = $stmt2->fetch(PDO::FETCH_ASSOC);
            $total = $totalRow ? (float)$totalRow['total'] : 0;

            echo json_encode(["expenses" => $expenses, "total" => $total]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
        }
    }

    private function getHistory($payload) {
        try {
            $branch_id = null;
            if ($payload['role'] === 'Admin') {
                $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                    ? (int)$_GET['branch_id'] : null;
            } else {
                $branch_id = (int)($payload['branch_id'] ?? 1);
            }

            $query = "SELECT eh.*, u.name as editor_name
                      FROM expense_history eh
                      LEFT JOIN users u ON eh.edited_by = u.id";
            
            $params = [];
            if ($branch_id !== null) {
                $query .= " WHERE eh.branch_id = :branch_id";
                $params[':branch_id'] = $branch_id;
            }
            $query .= " ORDER BY eh.date DESC";

            $stmt = $this->db->prepare($query);
            $stmt->execute($params);
            $history = $stmt->fetchAll(PDO::FETCH_ASSOC);

            echo json_encode($history);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
        }
    }

    private function addExpense($payload) {
        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || empty($data['title']) || !isset($data['amount']) || empty($data['expense_date'])) {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data. Title, amount, and date are required."]);
            return;
        }

        try {
            $user_id = (int)$payload['id'];
            $branch_id = (int)($payload['branch_id'] ?? 1);

            $query = "INSERT INTO expenses (title, amount, description, expense_date, user_id, branch_id) 
                      VALUES (:title, :amount, :description, :expense_date, :user_id, :branch_id)";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':title' => htmlspecialchars(strip_tags($data['title'])),
                ':amount' => (float)$data['amount'],
                ':description' => htmlspecialchars(strip_tags($data['description'] ?? '')),
                ':expense_date' => $data['expense_date'],
                ':user_id' => $user_id,
                ':branch_id' => $branch_id
            ]);

            http_response_code(201);
            echo json_encode(["message" => "Expense successfully recorded.", "id" => $this->db->lastInsertId()]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
        }
    }

    private function updateExpense($id, $payload) {
        // Only Admin and Manager can edit
        if ($payload['role'] !== 'Admin' && $payload['role'] !== 'Manager') {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden: You don't have permission to edit expenses"]);
            return;
        }

        // Verify expense exists and belongs to the manager's branch if they are a manager
        $stmt = $this->db->prepare("SELECT branch_id FROM expenses WHERE id = ?");
        $stmt->execute([$id]);
        $expense = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$expense) {
            http_response_code(404);
            echo json_encode(["message" => "Expense not found"]);
            return;
        }

        if ($payload['role'] === 'Manager' && (int)$expense['branch_id'] !== (int)$payload['branch_id']) {
            http_response_code(403);
            echo json_encode(["message" => "Forbidden: You can only edit expenses from your own branch"]);
            return;
        }

        $data = json_decode(file_get_contents("php://input"), true);
        if (!$data || empty($data['title']) || !isset($data['amount']) || empty($data['expense_date'])) {
            http_response_code(400);
            echo json_encode(["message" => "Incomplete data. Title, amount, and date are required."]);
            return;
        }

        try {
            $query = "UPDATE expenses 
                      SET title = :title, amount = :amount, description = :description, expense_date = :expense_date 
                      WHERE id = :id";
            $stmt = $this->db->prepare($query);
            $stmt->execute([
                ':title' => htmlspecialchars(strip_tags($data['title'])),
                ':amount' => (float)$data['amount'],
                ':description' => htmlspecialchars(strip_tags($data['description'] ?? '')),
                ':expense_date' => $data['expense_date'],
                ':id' => $id
            ]);

            // Insert into history
            $hist_query = "INSERT INTO expense_history 
                (expense_id, old_title, new_title, old_amount, new_amount, note, edited_by, branch_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)";
            $hist_stmt = $this->db->prepare($hist_query);
            $hist_stmt->execute([
                $id,
                $expense['title'], htmlspecialchars(strip_tags($data['title'])),
                $expense['amount'], (float)$data['amount'],
                $data['description'] ?? '',
                $payload['id'],
                $expense['branch_id']
            ]);

            http_response_code(200);
            echo json_encode(["message" => "Expense successfully updated."]);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database Error: " . $e->getMessage()]);
        }
    }
}
?>
