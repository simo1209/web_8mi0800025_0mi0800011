<?php
namespace Core;

class Router
{
    private $routes = [];

    /**
     * Register a route with a callable function for a specific HTTP method.
     *
     * @param string   $method
     * @param string   $path
     * @param callable $handler
     * @return void
     */
    public function register($method, $path, $handler)
    {
        $method = strtoupper($method); // Normalize method to uppercase
        // Convert path parameters like {id} into regex patterns
        $path = preg_replace('/\{([a-zA-Z0-9_]+)\}/', '(?P<$1>[a-zA-Z0-9_-]+)', $path);
        $this->routes[$method][$path] = $handler;
    }

    /**
     * Resolve the current path (or a given path) and call the matching handler.
     *
     * @param string $path
     * @param string $method
     * @return void
     */
    public function resolve($path, $method)
    {
        $method = strtoupper($method); // Normalize method to uppercase
        $path = $path === '' ? '/' : $path; // Treat empty paths as "/"

        if (!isset($this->routes[$method])) {
            $this->notFound();
            return;
        }

        foreach ($this->routes[$method] as $route => $handler) {
            $pattern = "~^" . $route . "$~"; // Build regex pattern for route
            if (preg_match($pattern, $path, $matches)) {
                // Filter only named parameters from the matches
                $params = array_filter($matches, 'is_string', ARRAY_FILTER_USE_KEY);
                call_user_func($handler, $params);
                return;
            }
        }

        $this->notFound();
    }

    /**
     * Send a 404 response.
     *
     * @return void
     */
    private function notFound()
    {
        header('HTTP/1.1 404 Not Found');
        echo "404 - Page Not Found";
    }
}

