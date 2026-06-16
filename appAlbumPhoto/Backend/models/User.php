<?php
require_once __DIR__ . '/../db.php';

class User {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

    public function existeDeja($pseudo, $email) {
        $query = "SELECT id FROM users WHERE username = :pseudo OR email = :email";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute([
            'pseudo' => $pseudo,
            'email' => $email
        ]);
        return $stmt->fetch() ? true : false;
    }

    public function inscrire($pseudo, $email, $motDePasseHache) {
        $query = "INSERT INTO users (username, email, password) VALUES (:pseudo, :email, :password)";
        $stmt = $this->bdd->prepare($query);
        return $stmt->execute([
            'pseudo' => $pseudo,
            'email' => $email,
            'password' => $motDePasseHache
        ]);
    }

    public function chercherParIdentifiant($identifiant) {
        $query = "SELECT * FROM users WHERE username = :identifiant OR email = :identifiant";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute(['identifiant' => $identifiant]);
        return $stmt->fetch();
    }
}