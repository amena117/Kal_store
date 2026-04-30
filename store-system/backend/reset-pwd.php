<?php
require 'config/database.php';
$db = new Database();
$conn = $db->getConnection();
$hash = password_hash('amena123', PASSWORD_BCRYPT);
$conn->query("UPDATE users SET password='$hash' WHERE name='amena'");
echo "done";
?>
