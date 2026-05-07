<?php
// Set CORS headers
$allowed_origin = 'https://yourdomain.com';
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin === $allowed_origin) {
    header("Access-Control-Allow-Origin: $allowed_origin");
} else {
    header("Access-Control-Allow-Origin: $allowed_origin");
}
header("Content-Type: application/json; charset=UTF-8");
header("Access-Control-Allow-Methods: OPTIONS,GET,POST,PUT,DELETE");
header("Access-Control-Max-Age: 3600");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Basic Routing Logic
$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);

// For local php -S we might not have /api/ folder prefix in URI depending on how it's launched,
// But on cPanel it will be in /api/...
// Let's normalize it to find the endpoint
$path = '';
if (strpos($uri, '/api/') !== false) {
    $path = explode('/api/', $uri)[1];
} else {
    // Fallback if running directly from api directory
    $path = ltrim($uri, '/');
}

$parts = explode('/', $path);
$endpoint = isset($parts[0]) && $parts[0] !== '' ? $parts[0] : '';
// Remove endpoint from parts, so $parts[1] usually holds the ID
if($endpoint != '') array_shift($parts); 

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../helpers/JWT.php';

// Route to correct controller
switch ($endpoint) {
    case 'auth':
        if(file_exists(__DIR__ . '/../controllers/AuthController.php')) {
            require_once __DIR__ . '/../controllers/AuthController.php';
            $controller = new AuthController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'users':
        if(file_exists(__DIR__ . '/../controllers/UserController.php')) {
            require_once __DIR__ . '/../controllers/UserController.php';
            $controller = new UserController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'categories':
        if(file_exists(__DIR__ . '/../controllers/CategoryController.php')) {
            require_once __DIR__ . '/../controllers/CategoryController.php';
            $controller = new CategoryController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'products':
        if(file_exists(__DIR__ . '/../controllers/ProductController.php')) {
            require_once __DIR__ . '/../controllers/ProductController.php';
            $controller = new ProductController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'sales':
        if(file_exists(__DIR__ . '/../controllers/SaleController.php')) {
            require_once __DIR__ . '/../controllers/SaleController.php';
            $controller = new SaleController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'reservations':
        if(file_exists(__DIR__ . '/../controllers/ReservationController.php')) {
            require_once __DIR__ . '/../controllers/ReservationController.php';
            $controller = new ReservationController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'dashboard':
        if(file_exists(__DIR__ . '/../controllers/DashboardController.php')) {
            require_once __DIR__ . '/../controllers/DashboardController.php';
            $controller = new DashboardController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'rentals':
        if(file_exists(__DIR__ . '/../controllers/RentalController.php')) {
            require_once __DIR__ . '/../controllers/RentalController.php';
            $controller = new RentalController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'branches':
        if(file_exists(__DIR__ . '/../controllers/BranchController.php')) {
            require_once __DIR__ . '/../controllers/BranchController.php';
            $controller = new BranchController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'profit':
        if(file_exists(__DIR__ . '/../controllers/ProfitController.php')) {
            require_once __DIR__ . '/../controllers/ProfitController.php';
            $controller = new ProfitController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    case 'expenses':
        if(file_exists(__DIR__ . '/../controllers/ExpenseController.php')) {
            require_once __DIR__ . '/../controllers/ExpenseController.php';
            $controller = new ExpenseController();
            $controller->processRequest($_SERVER['REQUEST_METHOD'], $parts);
        }
        break;
    default:
        http_response_code(404);
        echo json_encode(["message" => "Endpoint not found."]);
        break;
}
?>
