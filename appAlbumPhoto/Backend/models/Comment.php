<?php
require_once __DIR__ . '/../db.php';

class Comment {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

    public function ajouter($photoId, $userId, $contenu) {
        $stmt = $this->bdd->prepare(
            "INSERT INTO comments (photo_id, user_id, content) VALUES (:photo_id, :user_id, :content)"
        );
        return $stmt->execute([
            'photo_id' => $photoId,
            'user_id'  => $userId,
            'content'  => $contenu
        ]);
    }

    public function listerParPhoto($photoId) {
        $stmt = $this->bdd->prepare(
            "SELECT comments.*, users.username
             FROM comments
             JOIN users ON comments.user_id = users.id
             WHERE comments.photo_id = :photo_id
             ORDER BY comments.created_at ASC"
        );
        $stmt->execute(['photo_id' => $photoId]);
        return $stmt->fetchAll();
    }
}
