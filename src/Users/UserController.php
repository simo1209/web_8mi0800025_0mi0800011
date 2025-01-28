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
        $stmt = $this->db->run(
            "INSERT INTO users (username, email, password) VALUES (:username, :email, :password) RETURNING *",
            [
                'username' => $data['username'],
                'email' => $data['email'],
                'password' => $hashedPassword
            ]
        );
        $user = $stmt->fetch();
    
        // Create a session token
        $sessionToken = bin2hex(random_bytes(32));
    
        // Insert the session into the sessions table
        $this->db->run(
            "INSERT INTO sessions (user_id, session_token) VALUES (:user_id, :session_token) RETURNING session_token",
            [
                'user_id' => $user['id'],
                'session_token' => $sessionToken
            ]
        );

        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['session_token'] = $sessionToken;

        header('Location: /');
        return ['msg' => 'User created successfully', 'session_token' => $sessionToken];
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
    
        // Insert the session into the sessions table, overwriting any existing session for the user
        $this->db->run(
            "INSERT INTO sessions (user_id, session_token, expires_at)
            VALUES (:user_id, :session_token, NOW() + INTERVAL '1 day')
            ON CONFLICT (user_id) DO UPDATE
            SET session_token = EXCLUDED.session_token, expires_at = EXCLUDED.expires_at
            RETURNING session_token",
            [
                'user_id' => $user['id'],
                'session_token' => $sessionToken
            ]
        );
    
        session_start();
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['session_token'] = $sessionToken;
        // header("Authorization: Bearer $sessionToken");

        header('Location: /');

        return ['msg' => 'Login successful', 'session_token' => $sessionToken];
    }
    
    public function logout()
    {
        session_start();
        
        // Check if the user is logged in
        if (isset($_SESSION['user_id'], $_SESSION['session_token'])) {
            // Remove the session token from the database
            $this->db->run(
                "DELETE FROM sessions WHERE user_id = :user_id AND session_token = :session_token",
                [
                    'user_id' => $_SESSION['user_id'],
                    'session_token' => $_SESSION['session_token']
                ]
            );

        }
        
        $_SESSION = array();
        setcookie(session_name(), '', time() - 3600, '/');

        // Destroy the session
        session_unset();
        session_destroy();
        
        header('Location: /login.html'); // Redirect to login or homepage
        return ['msg' => 'Logout successful'];
    }
}

