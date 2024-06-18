<?php
header('Content-Type: application/json');

$dir = 'Skins';
$files = array_diff(scandir($dir), array('.', '..'));

$skins = array_filter($files, function($file) use ($dir) {
    return pathinfo($file, PATHINFO_EXTENSION) === 'png';
});

echo json_encode(array_values($skins));
?>
