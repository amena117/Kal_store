<?php
class Database {
    private $host = "localhost";
    private $db_name = "store_db";
    // Using default root credentials for local XAMPP/WAMP environments
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = null;
        try {
            $this->conn = new PDO("mysql:host=" . $this->host . ";dbname=" . $this->db_name, $this->username, $this->password);
            
            // Set PDO error mode to exception
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->exec("set names utf8");
        } catch(PDOException $exception) {
            // Ensure CORS headers are sent even on connection failure
            header("Access-Control-Allow-Origin: *");
            header("Content-Type: application/json; charset=UTF-8");
            http_response_code(500);
            echo json_encode(["message" => "Database connection error.", "error" => $exception->getMessage()]);
            exit;
        }
        return $this->conn;
    }
}
?>
