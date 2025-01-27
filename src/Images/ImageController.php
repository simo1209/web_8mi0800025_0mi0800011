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
        $router->register('GET', 'latest_images', [$this, 'index']);
        $router->register('POST', 'upload_image', [$this, 'upload']);
        $router->register('GET', 'image', [$this, 'serve_static_image']);
    }

    public function index() {
        $images = $this->db->rows("SELECT dbname as image_id, descr FROM images WHERE visibility = 'public' ORDER BY created_at DESC LIMIT 12");
        return $images;
    }

    public function serve_static_image($data) {
        $stmt = $this->db->run("SELECT filepath FROM images WHERE dbname = :dbname", ['dbname' => $data['dbname']]);
        $image = $stmt->fetch();
        
        // Check if the file exists
        if (!file_exists($image['filepath'])) {
            http_response_code(404);
            echo "Image not found.";
            exit;
        }

        // Get the file's mime type (e.g., image/jpeg, image/png)
        $mimeType = mime_content_type($image['filepath']);

        header("Content-Type: $mimeType");
        header("Content-Length: " . filesize($image['filepath']));
        header("Cache-Control: public, max-age=3600");
        header("Content-Disposition: inline; filename=\"" . basename($image['filepath']) . "\"");

        
        if (ob_get_level()) {
            ob_end_clean();
        }
        

        // Read and output the image file
        readfile($image['filepath']);
        exit;
        
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
                    $this->db->insert('images', ['filepath' => $targetFilePath, 'dbname' => $dbFileName, 'descr' => $descripiton, 'visibility' => $visibility]);
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

