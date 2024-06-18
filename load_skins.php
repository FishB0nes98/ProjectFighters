<?php
$directory = '../Skins';
$skins = array();

if (is_dir($directory)) {
    if ($dh = opendir($directory)) {
        while (($file = readdir($dh)) !== false) {
            if (pathinfo($file, PATHINFO_EXTENSION) == 'png') {
                $skins[] = $file;
            }
        }
        closedir($dh);
    }
}

echo json_encode($skins);
?>
