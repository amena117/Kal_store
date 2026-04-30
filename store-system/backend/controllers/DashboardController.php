<?php
class DashboardController {
    private $db;
    
    public function __construct() {
        $database = new Database();
        $this->db = $database->getConnection();
    }

    public function processRequest($method, $parts) {
        if ($method !== 'GET') {
            http_response_code(405);
            echo json_encode(["message" => "Method not allowed"]);
            return;
        }

        $payload = JWT::validateRole(['Admin', 'Manager']);

        // Determine effective branch scope
        $branch_id = null;
        if ($payload['role'] === 'Admin') {
            $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                ? (int)$_GET['branch_id'] : null; // null = all branches combined
        } else {
            $branch_id = (int)($payload['branch_id'] ?? 1);
        }

        $this->getStats($branch_id);
    }

    private function getStats($branch_id = null) {
        $where = $branch_id !== null ? "WHERE s.branch_id = :branch_id" : "";
        $params = $branch_id !== null ? [':branch_id' => $branch_id] : [];

        $stats = [
            "totalSales"   => 0,
            "profit"       => 0,
            "capital"      => 0,
            "totalRevenue" => 0
        ];

        // 1. Total Revenue
        $q1 = "SELECT SUM(total) as revenue FROM sales s $where";
        $s1 = $this->db->prepare($q1);
        $s1->execute($params);
        $r1 = $s1->fetch(PDO::FETCH_ASSOC);
        $stats['totalRevenue'] = (float)($r1['revenue'] ?? 0);

        // 2. Profit (Selling Price - Arrival Price) * Quantity sold
        $profitWhere = $branch_id !== null ? "WHERE s.branch_id = :branch_id" : "";
        $q2 = "SELECT SUM((s.selling_price - p.arrival_price) * s.quantity) as profit 
               FROM sales s 
               INNER JOIN products p ON s.product_id = p.id
               $profitWhere";
        $s2 = $this->db->prepare($q2);
        $s2->execute($params);
        $r2 = $s2->fetch(PDO::FETCH_ASSOC);
        $stats['profit'] = (float)($r2['profit'] ?? 0);

        // 3. Capital (Remaining Stock value, scoped to branch)
        $capWhere = $branch_id !== null ? "WHERE branch_id = :branch_id" : "";
        $capParams = $branch_id !== null ? [':branch_id' => $branch_id] : [];
        $q3 = "SELECT SUM(arrival_price * quantity) as capital FROM products $capWhere";
        $s3 = $this->db->prepare($q3);
        $s3->execute($capParams);
        $r3 = $s3->fetch(PDO::FETCH_ASSOC);
        $stats['capital'] = (float)($r3['capital'] ?? 0);

        // 4. Items Sold
        $q4 = "SELECT SUM(quantity) as items FROM sales s $where";
        $s4 = $this->db->prepare($q4);
        $s4->execute($params);
        $r4 = $s4->fetch(PDO::FETCH_ASSOC);
        $stats['totalSales'] = (int)($r4['items'] ?? 0);

        http_response_code(200);
        echo json_encode($stats);
    }
}
?>
