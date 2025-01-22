<?php
require './src/Core/Router.php';
require './src/Users/UserController.php';
require './src/Images/ImageController.php';
require './src/Core/Database.php';

// index.php
use Core\Database;
use Core\Router;
use Users\UserController;
use Images\ImageController;

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
$router = new Router();

// Register some routes
$router->register('GET', '/', function () {
    include('./index.html');
    return;
    // echo "Welcome to the Home Page!";
});

$router->register('GET', 'hello', function ($data) {
    $res = [];
    $res['msg'] = 'sup';
    $res['params'] = $data;

    return $res;
});



/*
$router->register('GET', '/about', function () {
    echo "Welcome to the About Page!";
});
 */

// Create a user controller instance
$userController = new UserController($db);

// Register the controller's routes
$userController->register($router);

$imageController = new ImageController($db);
$imageController->register($router);

// You can add as many as you need...
// $router->register('/users', [UserController::class, 'index']);


// Register a file upload route
// $router->register('POST', 'upload_image', );

// Assume we have the request path in $_SERVER['REQUEST_URI']
// Strip query string
// $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
$method = strtoupper($_SERVER['REQUEST_METHOD']);

$router->resolve($_GET['command'], $method);

