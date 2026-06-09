<?php
require_once __DIR__ . '/../db.php';

class Photo {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

    // 1. Ajouter une nouvelle photo dans un album
    public function ajouter($nomFichier, $description, $albumId) {
        $query = "INSERT INTO photos (filename, description, album_id) VALUES (:filename, :description, :album_id)";
        $stmt = $this->bdd->prepare($query);
        return $stmt->execute([
            'filename' => $nomFichier,
            'description' => $description,
            'album_id' => $albumId
        ]);
    }

    // 2. Récupérer toutes les photos d'un album précis
    public function listerParAlbum($albumId) {
        $query = "SELECT * FROM photos WHERE album_id = :album_id ORDER BY uploaded_at DESC";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute(['album_id' => $albumId]);
        return $stmt->fetchAll();
    }
}