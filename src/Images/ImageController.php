<?php
namespace Images;

use Core\Router;

class ImageController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    public function register(Router $router)
    {
        $router->register('POST', 'upload_image', [$this, 'upload']);
    }

    public function upload($params, $files) {
        $uploadDir = 'uploads/';
        
        // Ensure the upload directory exists
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }
    
        if (!is_writable('uploads/')) {
            error_log('Uploads directory is not writable.');
            return ['err' => 'uploads not writable'];
        }
    
        if (isset($files['file'])) {

            $basename = basename($files['file']['name']);
            $dbFileName =  sha1(time() . '_' . $basename);
            $descripiton = isset($params['description']) ? $params['description'] : null;
            $visibility = $params['visibility'];
            $fileType = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
            $targetFilePath = $uploadDir . $dbFileName . '.' . $fileType;
            $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];
    
            if (in_array($fileType, $allowedTypes)) {
                if (move_uploaded_file($files['file']['tmp_name'], $targetFilePath)) {
                    $this->db->insert('images', ['filename' => $targetFilePath, 'description' => $descripiton, 'visibility' => $visibility]);
                    return ["success" => true, "message" => "File uploaded successfully."];
                } else {
                    return ["success" => false, "error" => "Failed to move uploaded file."];
                }
            } else {
                return ["success" => false, "error" => "Unsupported file type."];
            }
        } else {
            return ["success" => false, "error" => "No file uploaded."];
        }
    }


}

