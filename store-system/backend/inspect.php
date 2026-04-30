<?php
require_once 'SimpleXLSX.php';

if ( $xlsx = SimpleXLSX::parse('amena.xlsx') ) {
    print_r( $xlsx->rows()[0] ); // Headers
    print_r( $xlsx->rows()[1] ); // First data row
} else {
    echo SimpleXLSX::parseError();
}
?>
