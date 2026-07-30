<?php
class Database {
    // -------------------------------------------------------
    // PRODUCTION: Replace these with your cPanel DB credentials
    // cPanel > MySQL Databases > your database name/user
    // -------------------------------------------------------
    private $host     = "localhost";
    private $db_name  = "store_db";
    private $username = "root";
    private $password = "";
    public  $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO(
                "mysql:host=" . $this->host . ";dbname=" . $this->db_name . ";charset=utf8",
                $this->username,
                $this->password
            );
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
        } catch(PDOException $exception) {
            header("Access-Control-Allow-Origin: *");
            header("Content-Type: application/json; charset=UTF-8");
            http_response_code(500);
            echo json_encode([
                "message" => "Database connection error.",
                "error"   => $exception->getMessage()
            ]);
            exit;
        }
        return $this->conn;
    }
}
?>
