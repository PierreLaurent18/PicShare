<?php
// On inclut le fichier de connexion à la base de données
require_once __DIR__ . '/../db.php';

class User {
    private $bdd;

    public function __construct() {
        // On récupère l'instance unique de connexion PDO
        $this->bdd = Db::getConnection();
    }

    // 1. Vérifier si un e-mail ou un pseudo existe déjà (pour éviter les doublons)
    public function existeDeja($pseudo, $email) {
        $query = "SELECT id FROM users WHERE username = :pseudo OR email = :email";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute([
            'pseudo' => $pseudo,
            'email' => $email
        ]);
        return $stmt->fetch() ? true : false;
    }

    // 2. Créer un nouvel utilisateur en base de données
    public function inscrire($pseudo, $email, $motDePasseHache) {
        $query = "INSERT INTO users (username, email, password) VALUES (:pseudo, :email, :password)";
        $stmt = $this->bdd->prepare($query);
        return $stmt->execute([
            'pseudo' => $pseudo,
            'email' => $email,
            'password' => $motDePasseHache
        ]);
    }

    // 3. Récupérer un utilisateur par son pseudo ou son e-mail (pour la connexion)
    public function chercherParIdentifiant($identifiant) {
        $query = "SELECT * FROM users WHERE username = :identifiant OR email = :identifiant";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute(['identifiant' => $identifiant]);
        return $stmt->fetch(); // Retourne le tableau de l'utilisateur ou false s'il n'existe pas
    }
}