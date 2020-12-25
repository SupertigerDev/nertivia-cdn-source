
<?php
    if($_SERVER['REQUEST_METHOD'] != "DELETE"){
        header('HTTP/1.0 403 Forbidden');
        echo "Invalid request.";
        return false;
    }   
    $secret = "owo";
    $target = json_decode(file_get_contents('php://input'), true);
    $target_path = $target['removePath'];
    $target_secret = $target['secret'];

    if (empty($target_secret)) {
        header('HTTP/1.0 403 Forbidden');
        echo "Secret not provided.";
        return false;
    }
    if (empty($target_path)) {
        header('HTTP/1.0 403 Forbidden');
        echo "Target Path not provided.";
        return false;
    }
    if ($target_secret !== $secret) {
        header('HTTP/1.0 403 Forbidden');
        echo "Invalid secret.";
        return false;
    }

    $relative_path = "files" . $target_path;

    $file_or_dir_exists = file_exists($relative_path);
    $is_file = is_file($relative_path);
    if (!$file_or_dir_exists) {
        header('HTTP/1.0 403 Forbidden');
        echo "File or dir does not exist.";
        return false;
    }
    if ($is_file) {
        unlink($relative_path);
        echo "File Deleted.";
        return true;
    }
    // delete dir
    delete_dir($relative_path);
    echo "Dir Deleted.";
    return true;


    function delete_dir($src) { 
        $dir = opendir($src);
        while(false !== ( $file = readdir($dir)) ) { 
            if (( $file != '.' ) && ( $file != '..' )) { 
                if ( is_dir($src . '/' . $file) ) { 
                    delete_dir($src . '/' . $file); 
                } 
                else { 
                    unlink($src . '/' . $file); 
                } 
            } 
        } 
        closedir($dir); 
        rmdir($src);
    
    }


?>