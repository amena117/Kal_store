<?php
class Database {
    // -------------------------------------------------------
    // PRODUCTION: Replace these with your cPanel DB credentials
    // cPanel > MySQL Databases > your database name/user
    // -------------------------------------------------------
    private $host     = "localhost";
    private $db_name  = "cpanel_username_store_db";  // e.g. john_store_db
    private $username = "cpanel_username_dbuser";     // e.g. john_dbuser
    private $password = "your_db_password_here";
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
