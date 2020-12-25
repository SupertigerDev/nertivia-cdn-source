<?php
$target_userid = $_POST['userid'];
$target_fileid = $_POST['fileid'];
$target_isEmoji = $_POST['isemoji'];
$target_dir = "";
if (!empty($target_isEmoji) and $target_isEmoji === "1") {
    $target_dir = "emojis_dir/";
} else {
   $target_dir = "files/" . $target_userid ."/" . $target_fileid . "/";
}
$target_file = $target_dir . basename($_FILES["fileToUpload"]["name"]);
$target_secret = $_POST['secret'];

$secret = "owo";

$uploadOk = 1;


// Check if file already exists

if (empty($target_secret)) {
    header('HTTP/1.0 403 Forbidden');
    echo "Secret not provided.";
    $uploadOk = 0;
    return false;
}
if ($target_secret !== $secret) {
    header('HTTP/1.0 403 Forbidden');
    echo "Invalid secret.";
    $uploadOk = 0;
    return false;
}

if (!file_exists($target_dir)) {
    mkdir($target_dir, 0777, true);
}

$imageFileType = strtolower(pathinfo($target_file,PATHINFO_EXTENSION));
// Check if image file is a actual image or fake image

if (file_exists($target_file)) {
    header('HTTP/1.0 403 Forbidden');
    echo "File already exists. ";
    $uploadOk = 0;
}
// Check file size
if ($_FILES["fileToUpload"]["size"] > 7840000) {
    header('HTTP/1.0 403 Forbidden');
    echo "Nertivia CDN max file upload is 7MB for now. ";
    $uploadOk = 0;
}
// Allow certain file formats
if($imageFileType != "jpg" && $imageFileType != "webp" && $imageFileType != "png" && $imageFileType != "jpeg" && $imageFileType != "gif" ) {
    header('HTTP/1.0 403 Forbidden');
    echo "Nertivia CDN only supports WEBP, JPG, JPEG, PNG & GIF formats for now. ";
    $uploadOk = 0;
}
// Check if $uploadOk is set to 0 by an error
if ($uploadOk == 0) {
    header('HTTP/1.0 403 Forbidden');
    echo "Your file was not uploaded.";
// if everything is ok, try to upload file
} else {
    if (move_uploaded_file($_FILES["fileToUpload"]["tmp_name"], $target_file)) {
        echo basename( $_FILES["fileToUpload"]["name"]). " has been uploaded.";
    } else {
	header('HTTP/1.0 403 Forbidden');
        echo "There was an error uploading your file.";
    }
}
?>