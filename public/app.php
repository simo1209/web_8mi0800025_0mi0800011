<?php
require './src/Core/Router.php';
require './src/Users/UserController.php';
require './src/Images/ImageController.php';
require './src/Albums/AlbumController.php'; // Include the AlbumController
require './src/Core/Database.php';

use Core\Database;
use Core\Router;
use Users\UserController;
use Images\ImageController;
use Albums\AlbumController; // Import the AlbumController

// Fetch environment variables
$databaseConfig = [
    'type'     => 'pgsql', // Use `pgsql` for PostgreSQL
    'host'     => getenv('DATABASE_HOST'),
    'database' => getenv('DATABASE_NAME'),
    'username' => getenv('DATABASE_USER'),
    'password' => getenv('DATABASE_PASSWORD'),
    'charset'  => 'utf8',
    'port'     => 5432, // Default PostgreSQL port
];

// Instantiate the Database class
try {
    $db = new Database($databaseConfig);
    // echo "Database connection established successfully.";
} catch (Exception $e) {
    echo "Database connection failed: " . $e->getMessage();
    return;
}

// Create an instance of the Router
$router = new Router($db);

// Register some routes
$router->register('GET', '/', function () {
    include('./index.html');
    return;
});

$router->register('GET', 'hello', function ($data) {
    $res = [];
    $res['msg'] = 'sup';
    $res['params'] = $data;

    return $res;
});

// Create a user controller instance
$userController = new UserController($db);

// Register the user controller's routes
$userController->register($router);

// Create an image controller instance
$imageController = new ImageController($db);

// Register the image controller's routes
$imageController->register($router);

// Create an album controller instance
$albumController = new AlbumController($db);

// Register the album controller's routes
$albumController->register($router);

// Resolve the current request
$method = strtoupper($_SERVER['REQUEST_METHOD']);
$router->resolve($_GET['command'], $method);
