<?php
$dir = '../Skins';
$files = array_diff(scandir($dir), array('.', '..'));
$skins = array_values(array_filter($files, function($file) {
    return pathinfo($file, PATHINFO_EXTENSION) === 'png';
}));
echo json_encode($skins);
?>
