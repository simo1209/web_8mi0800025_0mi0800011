<?php
namespace Core;

class Router
{
    private $routes = [];

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
        $response = call_user_func($handler, $_REQUEST, $_FILES ?? []);
        $this->sendResponse($response);
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
