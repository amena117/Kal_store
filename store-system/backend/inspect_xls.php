<?php
require 'SimpleXLSX.php';
use Shuchkin\SimpleXLSX;

if ($xlsx = SimpleXLSX::parse('amena.xlsx')) {
    $rows = $xlsx->rows();
    echo json_encode([
        'headers' => $rows[0] ?? [],
        'first_row' => $rows[1] ?? []
    ], JSON_PRETTY_PRINT);
} else {
    echo json_encode(['error' => SimpleXLSX::parseError()]);
}
