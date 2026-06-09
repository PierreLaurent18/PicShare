<?php
require_once __DIR__ . '/../db.php';

class Album {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

    // 1. Créer un nouvel album photo
    public function creer($titre, $description, $visibilite, $userId) {
        $query = "INSERT INTO albums (title, description, visibility, user_id) 
                  VALUES (:title, :description, :visibility, :user_id)";
        $stmt = $this->bdd->prepare($query);
        return $stmt->execute([
            'title' => $titre,
            'description' => $description,
            'visibility' => $visibilite,
            'user_id' => $userId
        ]);
    }

    // 2. Récupérer tous les albums d'un utilisateur spécifique
    public function listerParUtilisateur($userId) {
        $query = "SELECT * FROM albums WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }

    // 3. Supprimer un album (les photos liées seront supprimées automatiquement grâce au ON DELETE CASCADE de notre SQL)
    public function supprimer($albumId, $userId) {
        // Sécurité : On vérifie que l'album appartient bien à l'utilisateur qui demande la suppression
        $query = "DELETE FROM albums WHERE id = :id AND user_id = :user_id";
        $stmt = $this->bdd->prepare($query);
        return $stmt->execute([
            'id' => $albumId,
            'user_id' => $userId
        ]);
    }
}