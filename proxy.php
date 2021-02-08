<?php
header("User-Agent: Mozilla/5.0 NertiviaBot");
header("Cache-Control: public, max-age=31536000");
header("Access-Control-Allow-Origin: https://nertivia.net");
$url = "";

if (isset($_GET['url'])) {
	$url = $_GET['url'];
} else {
	exit();
}

$imginfo = getimagesize($url);
$mime = $imginfo['mime'];
if (isImage($mime) == false || isUrl($url) == false) {
	header('HTTP/1.0 403 Forbidden');
	return;
}
header("Content-type: " . $imginfo['mime']);
readfile($url);



function isImage($mime)
{
	$available_mimes = array('image/jpeg', 'image/jpg', 'image/png', 'image/webp',, 'image/gif');
	if (in_array($mime, $available_mimes)) {
		return true;
	} else {
		return false;
	}
}

function isUrl($url)
{
	if (strpos($url, "http://") === 0 || strpos($url, "https://") === 0) {
		return true;
	} else {
		return false;
	}
}
