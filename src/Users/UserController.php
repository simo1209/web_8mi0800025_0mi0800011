<?php
namespace Users;

use Core\Router;

class UserController
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
        $router->register('GET', '/users', [$this, 'index']);
        $router->register('GET', '/users/{id}', [$this, 'show']);
        $router->register('POST', '/users', [$this, 'create']);
        $router->register('PUT', '/users/{id}', [$this, 'update']);
        $router->register('DELETE', '/users/{id}', [$this, 'delete']);
    }

    /**
     * List all users.
     *
     * @return void
     */
    public function index()
    {
        echo "List of all users:";
        echo "<ul>";
        $stmt = $this->db->run('SELECT * FROM users;');
        while ($user = $stmt->fetch()) {
            echo "<li>" . $user['name'] . " " . $user['email'] . "</li>";
        }
    }

    /**
     * Show a specific user.
     *
     * @param string $id
     * @return void
     */
    public function show($id)
    {
        echo "Details of user with ID: $id";
    }

    /**
     * Create a new user.
     *
     * @return void
     */
    public function create()
    {
        echo "User created.";
    }

    /**
     * Update a specific user.
     *
     * @param string $id
     * @return void
     */
    public function update($id)
    {
        echo "User with ID $id updated.";
    }

    /**
     * Delete a specific user.
     *
     * @param string $id
     * @return void
     */
    public function delete($id)
    {
        echo "User with ID $id deleted.";
    }
}

