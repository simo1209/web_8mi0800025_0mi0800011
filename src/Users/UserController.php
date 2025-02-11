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

    public function register(Router $router)
    {
        $router->register('POST', 'login', [$this, 'login']);
        $router->register('POST', 'signup', [$this, 'signup']);
        $router->register('GET', 'logout', [$this, 'logout']);
    }

    public function signup($data)
    {
        if (!isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
            return ['err' => 'Missing required fields'];
        }
    
        // Check if the username or email is already taken
        $stmt = $this->db->run("SELECT * FROM users WHERE username = :username OR email = :email LIMIT 1", [
            'username' => $data['username'],
            'email' => $data['email']
        ]);
        $user = $stmt->fetch();
    
        if ($user) {
            return ['err' => 'Username or email already taken'];
        }
    
        // Hash the password
        $hashedPassword = password_hash($data['password'], PASSWORD_BCRYPT);
    
        // Insert the user into the database and return the user ID
        // $stmt = $this->db->run(
        //     "INSERT INTO users (username, email, password) VALUES (:username, :email, :password) RETURNING *",
        //     [
        //         'username' => $data['username'],
        //         'email' => $data['email'],
        //         'password' => $hashedPassword
        //     ]
        // );
        // $user = $stmt->fetch();

        $user_id = $this->db->insert(
            "users",
            [
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => $hashedPassword
            ]
        );

        session_start();
        $_SESSION['user_id'] = $user['id'];

        header('Location: index.html');
        return ['msg' => 'User created successfully'];
    }
    

    public function login($data)
    {
        if (!isset($data['email']) || !isset($data['password'])) {
            return ['err' => 'Missing required fields'];
        }
    
        // Query the database for the user
        $stmt = $this->db->run("SELECT * FROM users WHERE email = :email LIMIT 1", [
            'email' => $data['email']
        ]);
        $user = $stmt->fetch();
    
        if (!$user) {
            return ['err' => 'User not found'];
        }
    
        // Verify the password
        if (!password_verify($data['password'], $user['password'])) {
            return ['err' => 'Incorrect password', $data['password']];
        }
    
        // Create a new session token
        $sessionToken = bin2hex(random_bytes(32));
    
        session_start();
        $_SESSION['user_id'] = $user['id'];
        // header("Authorization: Bearer $sessionToken");

        header('Location: index.html');

        return ['msg' => 'Login successful'];
    }
    
    public function logout()
    {
        session_start();
        
        $_SESSION = array();
        setcookie(session_name(), '', time() - 3600, '/');

        // Destroy the session
        session_unset();
        session_destroy();
        
        header('Location: login.html'); // Redirect to login or homepage
        return ['msg' => 'Logout successful'];
    }
}

