<?php
$directory = 'skins';
$skins = array_filter(scandir($directory), function($file) use ($directory) {
    return is_file("$directory/$file") && pathinfo($file, PATHINFO_EXTENSION) === 'png';
});

header('Content-Type: application/json');
echo json_encode(array_values($skins));
?>
