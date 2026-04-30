<?php
class ProfitController {
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
        
        $branch_id = null;
        if ($payload['role'] === 'Admin') {
            $branch_id = isset($_GET['branch_id']) && is_numeric($_GET['branch_id'])
                ? (int)$_GET['branch_id'] : null;
        } else {
            $branch_id = (int)($payload['branch_id'] ?? 1);
        }

        $startDate = $_GET['start_date'] ?? null;
        $endDate = $_GET['end_date'] ?? null;

        $this->getProfitStats($branch_id, $startDate, $endDate);
    }

    private function getProfitStats($branch_id, $startDate, $endDate) {
        $whereFilters = [];
        $params = [];

        if ($branch_id !== null) {
            $whereFilters[] = "s.branch_id = :branch_id";
            $params[':branch_id'] = $branch_id;
        }

        if ($startDate && $endDate) {
            $whereFilters[] = "DATE(s.date) >= :start_date AND DATE(s.date) <= :end_date";
            $params[':start_date'] = $startDate;
            $params[':end_date'] = $endDate;
        }

        $whereClause = count($whereFilters) > 0 ? "WHERE " . implode(" AND ", $whereFilters) : "";

        $response = [
            "summary" => [
                "totalRevenue" => 0,
                "totalCost" => 0,
                "netProfit" => 0
            ],
            "productBreakdown" => [],
            "dailyTrend" => []
        ];

        try {
            // 1. Overall Summary
            $q1 = "SELECT 
                    SUM(s.total) as revenue,
                    SUM(p.arrival_price * s.quantity) as cost,
                    SUM((s.selling_price - p.arrival_price) * s.quantity) as profit
                   FROM sales s 
                   INNER JOIN products p ON s.product_id = p.id
                   $whereClause";
            
            $stmt1 = $this->db->prepare($q1);
            $stmt1->execute($params);
            $row1 = $stmt1->fetch(PDO::FETCH_ASSOC);
            
            if ($row1) {
                $response['summary']['totalRevenue'] = (float)($row1['revenue'] ?? 0);
                $response['summary']['totalCost'] = (float)($row1['cost'] ?? 0);
                $response['summary']['netProfit'] = (float)($row1['profit'] ?? 0);
            }

            // 2. Breakdown By Product
            $q2 = "SELECT 
                    p.id, p.name,
                    SUM(s.quantity) as qty_sold,
                    SUM(s.total) as rx_total,
                    SUM((s.selling_price - p.arrival_price) * s.quantity) as prod_profit
                   FROM sales s
                   INNER JOIN products p ON s.product_id = p.id
                   $whereClause
                   GROUP BY p.id, p.name
                   ORDER BY prod_profit DESC";
            
            $stmt2 = $this->db->prepare($q2);
            $stmt2->execute($params);
            $response['productBreakdown'] = $stmt2->fetchAll(PDO::FETCH_ASSOC);

            // 3. Daily Trend
            $q3 = "SELECT 
                    DATE(s.date) as sale_date,
                    SUM((s.selling_price - p.arrival_price) * s.quantity) as daily_profit,
                    SUM(s.total) as daily_revenue
                   FROM sales s
                   INNER JOIN products p ON s.product_id = p.id
                   $whereClause
                   GROUP BY DATE(s.date)
                   ORDER BY DATE(s.date) ASC";
            
            $stmt3 = $this->db->prepare($q3);
            $stmt3->execute($params);
            $response['dailyTrend'] = $stmt3->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);
            echo json_encode($response);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(["message" => "Database error: " . $e->getMessage()]);
        }
    }
}
?>
