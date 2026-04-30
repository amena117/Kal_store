<?php
// router.php
// This script forwards all requests to api/index.php to emulate .htaccess rewriting on the built-in PHP server

// Serve actual files directly (like uploaded images)
if (preg_match('/\.(?:png|jpg|jpeg|gif|css|js)$/', $_SERVER["REQUEST_URI"])) {
    return false;
}

// Change working directory to the api folder so relative paths inside index.php work
chdir(__DIR__ . '/api');

// Route all other requests (like /api/auth/login) to the api front-controller
$_SERVER["SCRIPT_NAME"] = "/index.php";
require "index.php";
