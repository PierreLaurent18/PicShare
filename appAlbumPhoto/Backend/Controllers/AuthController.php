<?php
require_once __DIR__ . '/../models/User.php';

class AuthController {
    private $userModel;

    public function __construct() {
        $this->userModel = new User();
    }

    public function inscription() {
        $username = isset($_POST['username']) ? trim($_POST['username']) : '';
        $email    = isset($_POST['email'])    ? trim($_POST['email'])    : '';
        $password = isset($_POST['password']) ? $_POST['password']       : '';
        $confirm  = isset($_POST['password_confirm']) ? $_POST['password_confirm'] : $password;

        if (empty($username) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Veuillez remplir tous les champs."]);
            return;
        }

        if ($password !== $confirm) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Les mots de passe ne correspondent pas."]);
            return;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Adresse e-mail invalide."]);
            return;
        }

        if ($this->userModel->existeDeja($username, $email)) {
            http_response_code(409);
            echo json_encode(["succes" => false, "message" => "Ce pseudo ou cet email est déjà utilisé."]);
            return;
        }

        $mdpHache = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
        $succes = $this->userModel->inscrire($username, $email, $mdpHache);

        if ($succes) {
            Db::logAction("Nouvel utilisateur inscrit : $username");
            http_response_code(201);
            echo json_encode(["succes" => true, "message" => "Inscription réussie !"]);
        } else {
            http_response_code(500);
            echo json_encode(["succes" => false, "message" => "Erreur lors de l'inscription."]);
        }
    }

    public function connexion() {
        $identifiant = isset($_POST['identifier']) ? trim($_POST['identifier']) : '';
        $password    = isset($_POST['password'])   ? $_POST['password']         : '';

        if (empty($identifiant) || empty($password)) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Veuillez remplir tous les champs."]);
            return;
        }

        $utilisateur = $this->userModel->chercherParIdentifiant($identifiant);

        if ($utilisateur && password_verify($password, $utilisateur['password'])) {
            Db::logAction("Connexion réussie : " . $utilisateur['username']);
            http_response_code(200);
            echo json_encode([
                "succes" => true,
                "message" => "Connexion réussie !",
                "user" => [
                    "id"       => $utilisateur['id'],
                    "username" => $utilisateur['username'],
                    "email"    => $utilisateur['email']
                ]
            ]);
        } else {
            http_response_code(401);
            echo json_encode(["succes" => false, "message" => "Identifiant ou mot de passe incorrect."]);
        }
    }
}
