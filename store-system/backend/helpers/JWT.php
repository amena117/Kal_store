<?php
class JWT {
    // Secret key for JWT. In production, move to an environment variable.
    private static $secret = 'store_system_super_secret_key_123';
    // Expected payload keys: id, name, role, branch_id, branch_name

    public static function encode($payload) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        // Add expiration time (24 hours)
        $payload['exp'] = time() + (60 * 60 * 24); 
        $payload = json_encode($payload);

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));

        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        return $base64UrlHeader . "." . $base64UrlPayload . "." . $base64UrlSignature;
    }

    public static function decode($jwt) {
        $tokenParts = explode('.', $jwt);
        if(count($tokenParts) != 3) {
            return false;
        }

        $header = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[0]));
        $payload = base64_decode(str_replace(['-', '_'], ['+', '/'], $tokenParts[1]));
        $signature_provided = $tokenParts[2];

        $base64UrlHeader = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($header));
        $base64UrlPayload = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($payload));
        
        $signature = hash_hmac('sha256', $base64UrlHeader . "." . $base64UrlPayload, self::$secret, true);
        $base64UrlSignature = str_replace(['+', '/', '='], ['-', '_', ''], base64_encode($signature));

        if (hash_equals($base64UrlSignature, $signature_provided)) {
            $data = json_decode($payload, true);
            if(isset($data['exp']) && $data['exp'] < time()) {
                return false; // Token expired
            }
            return $data;
        }
        
        return false;
    }
    
    public static function getBearerToken() {
        $headers = null;
        if (isset($_SERVER['Authorization'])) {
            $headers = trim($_SERVER["Authorization"]);
        } else if (isset($_SERVER['HTTP_AUTHORIZATION'])) { 
            // Nginx or fast CGI
            $headers = trim($_SERVER["HTTP_AUTHORIZATION"]);
        } elseif (function_exists('apache_request_headers')) {
            $requestHeaders = apache_request_headers();
            $requestHeaders = array_combine(array_map('ucwords', array_keys($requestHeaders)), array_values($requestHeaders));
            if (isset($requestHeaders['Authorization'])) {
                $headers = trim($requestHeaders['Authorization']);
            }
        }
        
        if (!empty($headers)) {
            if (preg_match('/Bearer\s(\S+)/', $headers, $matches)) {
                return $matches[1];
            }
        }
        return null;
    }

    public static function validateRole($requiredRoles = []) {
        $token = self::getBearerToken();
        if (!$token) {
            http_response_code(401);
            echo json_encode(["message" => "Access denied. Token missing."]);
            exit;
        }

        $decoded = self::decode($token);
        if (!$decoded) {
            http_response_code(401);
            echo json_encode(["message" => "Access denied. Invalid or expired token."]);
            exit;
        }

        if (!empty($requiredRoles) && !in_array($decoded['role'], $requiredRoles)) {
            http_response_code(403);
            echo json_encode(["message" => "Access denied. Insufficient permissions."]);
            exit;
        }

        return $decoded; // Returns payload (e.g., id, name, role)
    }
}
?>
