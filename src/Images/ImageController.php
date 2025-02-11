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
        $router->register('GET', 'get_image_by_id', [$this, 'get_image_by_id']);
        $router->register('POST', 'update_image_by_id', [$this, 'update_image_by_id']);
        $router->register('DELETE', 'delete_image_by_id', [$this, 'delete_image_by_id']);
        $router->register('GET', 'export_album', [$this, 'exportAlbum']); // Register the export method
    }

    public function index($data) {


      session_start();
      $user_id = $_SESSION['user_id'] ?? null;

      $images;
      if (isset($data['limit'])) {
        $limit = $data['limit'];

        $images = $this->db->rows("
            SELECT
                images.dbname AS image_id,
                images.descr,
                geo_data,
                albums.id AS album_id,
                albums.name AS album_name,
                images.created_at AS created_at,
                albums.owner_id = :user_id as can_edit       
            FROM images
            JOIN albums ON images.album_id = albums.id
            WHERE images.visibility = 'public'
            ORDER BY images.created_at DESC
            LIMIT 12
        ", ['user_id' => $user_id]);

      } else {
        $images = $this->db->rows("
            SELECT
                images.dbname AS image_id,
                images.descr,
                geo_data,
                albums.id AS album_id,
                albums.name AS album_name,
                images.created_at AS created_at,
                albums.owner_id = :user_id as can_edit       
            FROM images
            JOIN albums ON images.album_id = albums.id
            WHERE images.visibility = 'public'
            ORDER BY images.created_at DESC
        ", ['user_id' => $user_id]);
      } 


        return $images;
    }

    public function get_image_by_id($data) {
        if (!isset($data['image_id'])) {
            return ['err' => 'Image ID not provided'];
        }

        $stmt = $this->db->run("
            SELECT
                images.dbname AS image_id,
                images.descr,
                geo_data,
                visibility,
                albums.id AS album_id,
                albums.name AS album_name,
                images.created_at AS created_at
            FROM images
            JOIN albums ON images.album_id = albums.id
            WHERE images.dbname = :dbname
            LIMIT 1
        ", ['dbname' => $data['image_id']]);

        $image = $stmt->fetch();

        if ($image) {
            return $image;
        } else {
            return ['err' => 'Image not found'];
        }
    }

    public function update_image_by_id($data) {
        if (!isset($data['image_id'])) {
            return ['err' => 'Image ID not provided', 'data' => $data, 'post' => $_POST];
        }

        session_start();
        if (!isset($_SESSION['user_id'])) {
            return ['err' => 'User not authenticated'];
        }

        $stmt = $this->db->run("SELECT *, albums.owner_id FROM images JOIN albums ON images.album_id = albums.id WHERE dbname = :dbname", ['dbname' => $data['image_id']]);
        $image = $stmt->fetch();

        if (!$image) {
            return ['err' => 'Image not found'];
        }

        if ($image['owner_id'] !== $_SESSION['user_id']) {
            return ['err' => 'User does not have permission to update this image', 'image' => $image];
        }

        // $stmt = $this->db->run("
        //     UPDATE images
        //     SET descr = :descr, visibility = :visibility, geo_data = :geo_data
        //     WHERE dbname = :dbname
        //     RETURNING *
        // ", [
        //     'dbname' => $data['image_id'],
        //     'descr' => $data['descr'] ?? null,
        //     'visibility' => $data['visibility'] ?? 'public',
        //     'geo_data' => $data['geo_data'] ?? null
        // ]);

        $stmt = $this->db->run("
            UPDATE images
            SET descr = :descr, visibility = :visibility, geo_data = :geo_data
            WHERE dbname = :dbname
        ", [
            'dbname' => $data['image_id'],
            'descr' => $data['descr'] ?? null,
            'visibility' => $data['visibility'] ?? 'public',
            'geo_data' => $data['geo_data'] ?? null
        ]);

        $image = $this->db->row("
            SELECT *       
            FROM images
            JOIN albums ON images.album_id = albums.id
            WHERE images.dbname = :dbname
            LIMIT 1", ['dbname' => $data['image_id']]);


        if ($image) {
            return ['msg' => 'Image updated successfully', 'image' => [
                'image_id' => $image['dbname'],
                'descr' => $image['descr'],
                'visibility' => $image['visibility'],
                'geo_data' => $image['geo_data']
            ]];
        } else {
            return ['err' => 'Image not found'];
        }
    }

    public function delete_image_by_id($data) {
        if (!isset($data['image_id'])) {
            return ['err' => 'Image ID not provided'];
        }

        session_start();
        if (!isset($_SESSION['user_id'])) {
            return ['err' => 'User not authenticated'];
        }

        $stmt = $this->db->run("SELECT *, albums.owner_id FROM images JOIN albums ON images.album_id = albums.id WHERE dbname = :dbname", ['dbname' => $data['image_id']]);
        $image = $stmt->fetch();

        if (!$image) {
            return ['err' => 'Image not found'];
        }

        if ($image['owner_id'] !== $_SESSION['user_id']) {
            return ['err' => 'User does not have permission to delete this image', 'image' => $image];
        }

        $this->db->run("DELETE FROM images WHERE dbname = :dbname", ['dbname' => $data['image_id']]);

        return ['msg' => 'Image deleted successfully'];
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
           $geoData = $params['geo_data'] ?? null;
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
                           'geo_data' => $geoData,
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
           die(json_encode(['error' => 'Album ID is required.']));
       }
   
       try {
           // Fetch album details
           $album = $this->db->row("SELECT * FROM albums WHERE id = :album_id", ['album_id' => $albumId]);
           if (!$album) {
               http_response_code(404);
               die(json_encode(['error' => 'Album not found.']));
           }
   
           // Fetch images in the album
           $images = $this->db->rows("SELECT * FROM images WHERE album_id = :album_id", ['album_id' => $albumId]);
           if (empty($images)) {
               http_response_code(404);
               die(json_encode(['error' => 'No images found in this album.']));
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
                       'created_at' => $image['created_at'],
                       'url' => "app.php?command=image&image_id=" . $image['dbname']
                   ];
               }, $images)
           ];
   
           // Return metadata as JSON
           header('Content-Type: application/json');
           echo json_encode($metadata);
           exit();
       } catch (\Exception $e) {
           http_response_code(500);
           die(json_encode(['error' => 'Failed to export album: ' . $e->getMessage()]));
       }
   }




}

