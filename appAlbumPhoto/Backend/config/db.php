<?php
require_once __DIR__ . '/../db.php';

class AuthController {

    // 1. L'INSCRIPTION (REGISTER)
    public function register() {
        // On récupère les données envoyées par le formulaire
        $username = isset($_POST['username']) ? trim($_POST['username']) : null;
        $email = isset($_POST['email']) ? trim($_POST['email']) : null;
        $password = isset($_POST['password']) ? $_POST['password'] : null;

        // Vérification de sécurité : aucun champ ne doit être vide
        if (empty($username) || empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Tous les champs sont obligatoires."]);
            return;
        }

        try {
            $bdd = Db::getConnection();

            // Étape A : Vérifier si l'email ou le pseudo existe déjà
            $verif = $bdd->prepare("SELECT id FROM users WHERE email = ? OR username = ?");
            $verif->execute([$email, $username]);
            if ($verif->fetch()) {
                http_response_code(400);
                echo json_encode(["succes" => false, "message" => "Ce pseudo ou cet email est déjà utilisé."]);
                return;
            }

            // Étape B : Hachage du mot de passe pour la sécurité
            $passwordHash = password_hash($password, PASSWORD_BCRYPT);

            // Étape C : Insertion dans la base de données
            // ⚠️ ATTENTION : Vérifie bien que tes colonnes s'appellent username, email, password dans ta table !
            $requete = $bdd->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
            $resultat = $requete->execute([$username, $email, $passwordHash]);

            if ($resultat) {
                Db::logAction("Nouvel utilisateur inscrit : $username");
                echo json_encode(["succes" => true, "message" => "Utilisateur créé avec succès !"]);
            } else {
                throw new Exception("L'insertion a échoué sans erreur PDO.");
            }

        } catch (Exception $e) {
            // Si ça plante, on écrit l'erreur exacte dans le fichier Backend/error.log
            file_put_contents(__DIR__ . '/../error.log', "[" . date('Y-m-d H:i:s') . "] Erreur Inscription: " . $e->getMessage() . "\n", FILE_APPEND);
            
            http_response_code(500);
            echo json_encode(["succes" => false, "message" => "Erreur interne du serveur : " . $e->getMessage()]);
        }
    }

    // 2. LA CONNEXION (LOGIN)
    public function login() {
        $email = isset($_POST['email']) ? trim($_POST['email']) : null;
        $password = isset($_POST['password']) ? $_POST['password'] : null;

        if (empty($email) || empty($password)) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Veuillez remplir tous les champs."]);
            return;
        }

        try {
            $bdd = Db::getConnection();

            // On cherche l'utilisateur par son email
            $requete = $bdd->prepare("SELECT * FROM users WHERE email = ?");
            $requete->execute([$email]);
            $user = $requete->fetch();

            // Si l'utilisateur existe et que le mot de passe correspond au hachage
            if ($user && password_verify($password, $user['password'])) {
                
                // On nettoie les données sensibles avant de les renvoyer au JavaScript
                unset($user['password']);
                
                Db::logAction("Connexion réussie pour : " . $user['username']);
                echo json_encode([
                    "succes" => true,
                    "message" => "Connexion réussie !",
                    "user" => $user
                ]);
            } else {
                http_response_code(401);
                echo json_encode(["succes" => false, "message" => "Identifiants ou mot de passe incorrects."]);
            }

        } catch (Exception $e) {
            file_put_contents(__DIR__ . '/../error.log', "[" . date('Y-m-d H:i:s') . "] Erreur Connexion: " . $e->getMessage() . "\n", FILE_APPEND);
            http_response_code(500);
            echo json_encode(["succes" => false, "message" => "Erreur lors de la connexion."]);
        }
    }
}