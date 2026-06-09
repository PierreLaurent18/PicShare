<?php
require_once __DIR__ . '/../db.php';

class SearchController {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

    public function chercher() {
        $q      = isset($_GET['q'])       ? trim($_GET['q'])           : '';
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id'])   : 0;

        if (strlen($q) < 2) {
            echo json_encode(["succes" => false, "message" => "Recherche trop courte."]);
            return;
        }

        $motif = '%' . $q . '%';

        // Recherche dans les albums de l'utilisateur
        $stmtAlbums = $this->bdd->prepare(
            "SELECT id, title, description, visibility, created_at
             FROM albums
             WHERE user_id = :user_id
             AND (title LIKE :motif OR description LIKE :motif2)
             ORDER BY created_at DESC"
        );
        $stmtAlbums->execute(['user_id' => $userId, 'motif' => $motif, 'motif2' => $motif]);
        $albums = $stmtAlbums->fetchAll();

        // Recherche dans les photos des albums de l'utilisateur
        $stmtPhotos = $this->bdd->prepare(
            "SELECT photos.id, photos.filename, photos.description, photos.album_id, albums.title AS album_title
             FROM photos
             JOIN albums ON photos.album_id = albums.id
             WHERE albums.user_id = :user_id
             AND photos.description LIKE :motif
             ORDER BY photos.uploaded_at DESC"
        );
        $stmtPhotos->execute(['user_id' => $userId, 'motif' => $motif]);
        $photos = $stmtPhotos->fetchAll();

        echo json_encode([
            "succes" => true,
            "query"  => $q,
            "albums" => $albums,
            "photos" => $photos
        ]);
    }
}
