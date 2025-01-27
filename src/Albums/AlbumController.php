<?php
namespace Albums;

use Core\Router;

class AlbumController
{
    private $db;

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Register the controller's routes with the router.
     *
     * @param Router $router
     * @return void
     */
    public function register(Router $router)
    {
        $router->register('GET', '/albums', [$this, 'index']); // List all albums
        $router->register('GET', '/albums/{id}', [$this, 'show']); // Show a specific album
        $router->register('GET', 'my_albums', [$this, 'getMyAlbums']);
        $router->register('GET', 'album_images', [$this, 'getAlbumImages']);
        $router->register('POST', '/albums', [$this, 'create']); // Create a new album
        $router->register('PUT', '/albums/{id}', [$this, 'update']); // Update a specific album
        $router->register('DELETE', '/albums/{id}', [$this, 'delete']); // Delete a specific album
    }

    /**
     * Get a list of albums.
     */
    public function index() {
        header('Content-Type: application/json');

        try {
            $albums = $this->db->rows("SELECT id, name, descr AS description FROM albums ORDER BY created_at DESC");

            // Send JSON response
            echo json_encode($albums);
        } catch (\Exception $e) {
            http_response_code(500);
            echo json_encode([
                'error' => 'Failed to fetch albums.',
                'details' => $e->getMessage()
            ]);
        }

        // Ensure no further output is sent
        exit();
    }

    public function getMyAlbums($params)
    {
        session_start();
        $userId = $_SESSION['user_id'] ?? null;

        if (!$userId) {
            http_response_code(401);
            return ['error' => 'Unauthorized'];
        }

        $albums = $this->db->rows("SELECT * FROM albums WHERE owner_id = :owner_id", ['owner_id' => $userId]);

        return $albums;
    }

    public function getAlbumImages($params)
    {
        $albumId = $params['album_id'] ?? null;

        if (!$albumId) {
            http_response_code(400);
            return ['error' => 'Album ID is required'];
        }

        // Join the albums table to fetch the album name
        $images = $this->db->rows(
            "SELECT
                images.id AS id,
                images.dbname AS dbname,
                images.descr AS descr,
                images.created_at AS created_at,
                albums.name AS album_name,
                albums.id AS album_id
             FROM images
             JOIN albums ON images.album_id = albums.id
             WHERE images.album_id = :album_id",
            ['album_id' => $albumId]
        );

        return $images;
    }


    /**
     * Show a specific album.
     *
     * @param array $params
     * @return void
     */
    public function show($params)
    {
        $albumId = $params['id'] ?? null;
        if (!$albumId) {
            http_response_code(400);
            echo json_encode(['error' => 'Album ID is required.']);
            return;
        }

        $stmt = $this->db->run('SELECT * FROM albums WHERE id = :id', ['id' => $albumId]);
        $album = $stmt->fetch();

        if (!$album) {
            http_response_code(404);
            echo json_encode(['error' => 'Album not found.']);
            return;
        }

        header('Content-Type: application/json');
        echo json_encode($album);
    }

public function create($params)
{
    header('Content-Type: application/json');

    // Decode raw JSON input
    $input = json_decode(file_get_contents('php://input'), true);

    // Debug: Log the input for verification
    error_log(json_encode($input));

    $name = $input['name'] ?? null;
    $description = $input['description'] ?? null;
    // $ownerId = $input['owner_id'] ?? null;\
    session_start();
    $ownerId = $_SESSION['user_id'];

    if (!$name || !$description || !$ownerId) {
        return ['error' => 'Name, description, and owner ID are required.'];
    }

    $albumId = $this->db->insert('albums', [
        'name' => $name,
        'descr' => $description,
        'owner_id' => $ownerId
    ]);

    return [
        'message' => 'Album created successfully.',
        'album_id' => $albumId
    ];


    // Ensure no extra output
    // exit();
}
    /**
     * Update a specific album.
     *
     * @param array $params
     * @return void
     */
    public function update($params)
    {
        $albumId = $params['id'] ?? null;
        $name = $params['name'] ?? null;
        $description = $params['description'] ?? null;

        if (!$albumId || !$name) {
            http_response_code(400);
            echo json_encode(['error' => 'Album ID and name are required.']);
            return;
        }

        $this->db->update('albums', [
            'name' => $name,
            'descr' => $description
        ], ['id' => $albumId]);

        http_response_code(200);
        echo json_encode(['message' => 'Album updated successfully.']);
    }

    /**
     * Delete a specific album.
     *
     * @param array $params
     * @return void
     */
    public function delete($params)
    {
        $albumId = $params['id'] ?? null;

        if (!$albumId) {
            http_response_code(400);
            echo json_encode(['error' => 'Album ID is required.']);
            return;
        }

        $this->db->delete('albums', ['id' => $albumId]);

        http_response_code(200);
        echo json_encode(['message' => 'Album deleted successfully.']);
    }
}