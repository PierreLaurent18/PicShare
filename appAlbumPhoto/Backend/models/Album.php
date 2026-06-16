<?php
require_once __DIR__ . '/../db.php';

class Album {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

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

    public function listerParUtilisateur($userId) {
        $query = "SELECT * FROM albums WHERE user_id = :user_id ORDER BY created_at DESC";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute(['user_id' => $userId]);
        return $stmt->fetchAll();
    }

    public function supprimer($albumId, $userId) {
        $query = "DELETE FROM albums WHERE id = :id AND user_id = :user_id";
        $stmt = $this->bdd->prepare($query);
        return $stmt->execute([
            'id' => $albumId,
            'user_id' => $userId
        ]);
    }
}