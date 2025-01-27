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
        
        if (!isset($data['image_id'])) {
            return [err => 'Image ID not provided'];
        }

        // Query the database for the image file path
        $stmt = $this->db->run("SELECT filepath FROM images WHERE dbname = :dbname", ['dbname' => $data['image_id']]);
        $image = $stmt->fetch();
    
        if ($image) {
            $filePath = $image['filepath'];
    
            // Check if the file exists
            if (file_exists($filePath)) {
                // Get the file's MIME type
                $mimeType = mime_content_type($filePath);
    
                // Serve the image with appropriate headers
                header('Content-Type: ' . $mimeType);
                header('Content-Length: ' . filesize($filePath));
    
                // Read and output the image file
                readfile($filePath);
            } else {
                // If the file does not exist, send a 404 response
                return ['err' => 'Image not found'];
            }
        } else {
            // If no record was found in the database, send a 404 response
            return ['err' => 'Image not found'];
        }
    }

   public function upload($params, $files) {
       $uploadDir = 'uploads/';

       // Ensure the upload directory exists
       if (!is_dir($uploadDir)) {
           mkdir($uploadDir, 0755, true);
       }

       if (!is_writable($uploadDir)) {
           error_log('Uploads directory is not writable.');
           return ['err' => 'Uploads directory is not writable'];
       }

       if (isset($files['file'])) {
           $basename = basename($files['file']['name']);
           $dbFileName = sha1(time() . '_' . $basename);
           $description = $params['description'] ?? null;
           $visibility = $params['visibility'] ?? 'public';
           $albumId = $params['album_id'] ?? null; // Get album_id from the request

           if (!$albumId) {
               http_response_code(400);
               return ['error' => 'Album ID is required.'];
           }

           $fileType = strtolower(pathinfo($basename, PATHINFO_EXTENSION));
           $targetFilePath = $uploadDir . $dbFileName . '.' . $fileType;
           $allowedTypes = ['jpg', 'jpeg', 'png', 'gif'];

           if (in_array($fileType, $allowedTypes)) {
               if (move_uploaded_file($files['file']['tmp_name'], $targetFilePath)) {
                   try {
                       // Insert image record into the database
                       $this->db->insert('images', [
                           'filepath' => $targetFilePath,
                           'dbname' => $dbFileName,
                           'descr' => $description,
                           'visibility' => $visibility,
                           'album_id' => $albumId // Ensure album_id is inserted
                       ]);

                       return ['success' => true, 'message' => 'File uploaded successfully.'];
                   } catch (\Exception $e) {
                       http_response_code(500);
                       return ['error' => 'Failed to save image to database.', 'details' => $e->getMessage()];
                   }
               } else {
                   return ['success' => false, 'error' => 'Failed to move uploaded file.'];
               }
           } else {
               return ['success' => false, 'error' => 'Unsupported file type.'];
           }
       } else {
           return ['success' => false, 'error' => 'No file uploaded.'];
       }
   }




}

