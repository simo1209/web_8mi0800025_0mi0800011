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
        $router->register('GET', 'export_album', [$this, 'exportAlbum']); // Register the export method
    }

    public function index() {
        $images = $this->db->rows("
            SELECT
                images.dbname AS image_id,
                images.descr,
                albums.id AS album_id,
                albums.name AS album_name,
                images.created_at AS created_at
            FROM images
            JOIN albums ON images.album_id = albums.id
            WHERE images.visibility = 'public'
            ORDER BY images.created_at DESC
            LIMIT 12
        ");

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


public function exportAlbum($params)
{
    $albumId = $params['album_id'] ?? null;

    if (!$albumId) {
        http_response_code(400);
        die('Album ID is required.');
    }

    try {
        // Fetch album details
        $album = $this->db->row("SELECT * FROM albums WHERE id = :album_id", ['album_id' => $albumId]);
        if (!$album) {
            http_response_code(404);
            die('Album not found.');
        }

        // Fetch images in the album
        $images = $this->db->rows("SELECT * FROM images WHERE album_id = :album_id", ['album_id' => $albumId]);
        if (empty($images)) {
            http_response_code(404);
            die('No images found in this album.');
        }

        // Prepare metadata
        $metadata = [
            'album' => [
                'id' => $album['id'],
                'name' => $album['name'],
                'description' => $album['descr'],
                'created_at' => $album['created_at']
            ],
            'images' => array_map(function ($image) {
                return [
                    'id' => $image['id'],
                    'filepath' => $image['filepath'],
                    'dbname' => $image['dbname'],
                    'description' => $image['descr'],
                    'visibility' => $image['visibility'],
                    'geo_data' => $image['geo_data'] ? json_decode($image['geo_data'], true) : null,
                    'created_at' => $image['created_at']
                ];
            }, $images)
        ];

        // Create a temporary directory for the zip export
        $tempDir = sys_get_temp_dir() . '/album_' . $albumId . '_' . time();
        mkdir($tempDir, 0777, true);

        // Save metadata as a JSON file
        $metadataFile = $tempDir . '/metadata.json';
        file_put_contents($metadataFile, json_encode($metadata, JSON_PRETTY_PRINT));

        // Copy all images to the temp directory
        foreach ($images as $image) {
            $sourcePath = $image['filepath'];
            $destinationPath = $tempDir . '/' . basename($image['filepath']);
            if (file_exists($sourcePath)) {
                copy($sourcePath, $destinationPath);
            }
        }

        // Create a zip archive
        $zipFile = sys_get_temp_dir() . '/album_' . $albumId . '.zip';
        $zip = new \ZipArchive();
        if ($zip->open($zipFile, \ZipArchive::CREATE) !== true) {
            http_response_code(500);
            die('Failed to create zip archive.');
        }

        // Add all files in the temp directory to the zip archive
        $files = scandir($tempDir);
        foreach ($files as $file) {
            if ($file !== '.' && $file !== '..') {
                $zip->addFile($tempDir . '/' . $file, $file);
            }
        }
        $zip->close();

        // Clean up the temporary directory
        array_map('unlink', glob("$tempDir/*"));
        rmdir($tempDir);

        // Serve the zip file for download
        header('Content-Type: application/zip');
        header('Content-Disposition: attachment; filename="album_' . $albumId . '.zip"');
        header('Content-Length: ' . filesize($zipFile));
        readfile($zipFile);

        // Delete the zip file after serving
        unlink($zipFile);
        exit();
    } catch (\Exception $e) {
        http_response_code(500);
        die('Failed to export album: ' . $e->getMessage());
    }
}




}

