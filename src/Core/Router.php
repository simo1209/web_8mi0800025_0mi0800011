<?php
namespace Core;

class Router
{
    private $db;
    private $routes = [];

    public function __construct($db)
    {
        $this->db = $db;
    }

    /**
     * Register a route with a callable function for a specific command.
     *
     * @param string   $method
     * @param string   $command
     * @param callable $handler
     * @return void
     */
    public function register($method, $command, $handler)
    {
        $method = strtoupper($method); // Normalize method to uppercase
        $this->routes[$method][$command] = $handler;
    }

    /**
     * Resolve the current command and call the matching handler.
     *
     * @param string $command
     * @param string $method
     * @return void
     */
    public function resolve($command, $method)
    {
        $method = strtoupper($method); // Normalize method to uppercase

        if (!isset($this->routes[$method][$command])) {
            $this->notFound();
            return;
        }

        $handler = $this->routes[$method][$command];
        try {
            // Start transaction
            $this->db->run('BEGIN');
    
            // Extend $_REQUEST with JSON-decoded $_POST
            $jsonInput = file_get_contents('php://input');
            $data = json_decode($jsonInput, true); // true converts JSON to associative array

            // Check if JSON decoding was successful
            if (json_last_error() === JSON_ERROR_NONE && is_array($data)) {
                // Merge the decoded data into the $_REQUEST array
                $_REQUEST = array_merge($_REQUEST, $data);
            }

            // Call the handler
            $response = call_user_func($handler, $_REQUEST, $_FILES ?? []);
    
            // Commit transaction if no exception occurs
            $this->db->run('COMMIT');
    
            // Send response
            $this->sendResponse($response);
        } catch (Exception $e) {
            // Rollback transaction on exception
            $this->db->run('ROLLBACK');
    
            // Handle the error (you can log it or send an error response)
            $this->handleError($e);
        }
    }

    /**
     * Send a JSON response.
     *
     * @param array $response
     * @return void
     */
    private function sendResponse($response)
    {
        header('Content-Type: application/json');
        echo json_encode($response);
    }

    /**
     * Send a 404 response.
     *
     * @return void
     */
    private function notFound()
    {
        header('HTTP/1.1 404 Not Found');
        echo json_encode(["error" => "404 - Page Not Found"]);
    }

    /**
     * Send a 400 invalid request response.
     *
     * @return void
     */
    private function invalidRequest()
    {
        header('HTTP/1.1 400 Bad Request');
        echo json_encode(["error" => "Invalid Request"]);
    }
}
