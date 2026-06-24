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

        $stmtAlbums = $this->bdd->prepare(
            "SELECT id, title, description, visibility, created_at
             FROM albums
             WHERE user_id = :user_id
             AND (title LIKE :motif OR description LIKE :motif2)
             ORDER BY created_at DESC"
        );
        $stmtAlbums->execute(['user_id' => $userId, 'motif' => $motif, 'motif2' => $motif]);
        $albums = $stmtAlbums->fetchAll();

        $stmtPhotos = $this->bdd->prepare(
            "SELECT photos.id, photos.filename, photos.description, photos.album_id, albums.title AS album_title,
                    GROUP_CONCAT(DISTINCT tags.name ORDER BY tags.name SEPARATOR ',') AS etiquettes
             FROM photos
             JOIN albums ON photos.album_id = albums.id
             LEFT JOIN photo_tags ON photos.id = photo_tags.photo_id
             LEFT JOIN tags ON photo_tags.tag_id = tags.id
             WHERE albums.user_id = :user_id
             AND photos.id IN (
                 SELECT p.id FROM photos p
                 LEFT JOIN photo_tags pt ON p.id = pt.photo_id
                 LEFT JOIN tags t ON pt.tag_id = t.id
                 WHERE p.description LIKE :motif OR t.name LIKE :motif2
             )
             GROUP BY photos.id
             ORDER BY photos.uploaded_at DESC"
        );
        $stmtPhotos->execute(['user_id' => $userId, 'motif' => $motif, 'motif2' => $motif]);
        $photos = $stmtPhotos->fetchAll();

        echo json_encode([
            "succes" => true,
            "query"  => $q,
            "albums" => $albums,
            "photos" => $photos
        ]);
    }

    public function rechercherPhotos() {
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;
        $motCle = isset($_GET['q'])       ? trim($_GET['q'])         : '';
        $tag    = isset($_GET['tag'])     ? trim($_GET['tag'])       : '';
        $album  = isset($_GET['album'])   ? trim($_GET['album'])     : '';
        $date   = isset($_GET['date'])    ? trim($_GET['date'])      : '';

        if (!$userId) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Utilisateur manquant."]);
            return;
        }

        $conditions = ["albums.user_id = :user_id"];
        $params = ['user_id' => $userId];

        if ($motCle !== '') {
            $conditions[] = "photos.description LIKE :motcle";
            $params['motcle'] = '%' . $motCle . '%';
        }
        if ($album !== '') {
            $conditions[] = "albums.title LIKE :album";
            $params['album'] = '%' . $album . '%';
        }
        if ($date !== '') {
            $conditions[] = "photos.taken_at = :date";
            $params['date'] = $date;
        }
        if ($tag !== '') {
            $conditions[] = "photos.id IN (
                SELECT pt.photo_id FROM photo_tags pt
                JOIN tags t ON pt.tag_id = t.id
                WHERE t.name LIKE :tag
            )";
            $params['tag'] = '%' . $tag . '%';
        }

        $sql = "SELECT photos.id, photos.filename, photos.description, photos.album_id,
                       albums.title AS album_title,
                       GROUP_CONCAT(DISTINCT tags.name ORDER BY tags.name SEPARATOR ',') AS etiquettes
                FROM photos
                JOIN albums ON photos.album_id = albums.id
                LEFT JOIN photo_tags ON photos.id = photo_tags.photo_id
                LEFT JOIN tags ON photo_tags.tag_id = tags.id
                WHERE " . implode(' AND ', $conditions) . "
                GROUP BY photos.id
                ORDER BY photos.uploaded_at DESC";

        $stmt = $this->bdd->prepare($sql);
        $stmt->execute($params);

        echo json_encode(["succes" => true, "photos" => $stmt->fetchAll()]);
    }
}
