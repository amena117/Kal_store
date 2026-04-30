<?php
require 'config/database.php';
$db = new Database();
$conn = $db->getConnection();
$stmt = $conn->query("SELECT name, role FROM users");
echo json_encode($stmt->fetchAll(PDO::FETCH_ASSOC));
