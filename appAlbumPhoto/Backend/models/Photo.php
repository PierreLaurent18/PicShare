<?php
require_once __DIR__ . '/../db.php';

class Photo {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

    public function ajouter($nomFichier, $description, $albumId, $dateePrise = null) {
        $query = "INSERT INTO photos (filename, description, album_id, taken_at)
                  VALUES (:filename, :description, :album_id, :taken_at)";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute([
            'filename'    => $nomFichier,
            'description' => $description,
            'album_id'    => $albumId,
            'taken_at'    => !empty($dateePrise) ? $dateePrise : null
        ]);
        return $this->bdd->lastInsertId();
    }

    public function attacherEtiquettes($photoId, $etiquettes) {
        foreach ($etiquettes as $nom) {
            $nom = trim($nom);
            if ($nom === '') continue;

            $this->bdd->prepare("INSERT IGNORE INTO tags (name) VALUES (:name)")
                      ->execute(['name' => $nom]);

            $stmtId = $this->bdd->prepare("SELECT id FROM tags WHERE name = :name");
            $stmtId->execute(['name' => $nom]);
            $tagId = $stmtId->fetchColumn();

            if ($tagId) {
                $this->bdd->prepare("INSERT IGNORE INTO photo_tags (photo_id, tag_id) VALUES (:photo_id, :tag_id)")
                          ->execute(['photo_id' => $photoId, 'tag_id' => $tagId]);
            }
        }
    }

    public function modifier($photoId, $description, $datePrise, $etiquettes, $userId) {
        $check = $this->bdd->prepare(
            "SELECT photos.id
             FROM photos
             JOIN albums ON photos.album_id = albums.id
             WHERE photos.id = :id AND albums.user_id = :user_id"
        );
        $check->execute(['id' => $photoId, 'user_id' => $userId]);
        if (!$check->fetch()) {
            return false;
        }

        $this->bdd->prepare(
            "UPDATE photos SET description = :description, taken_at = :taken_at WHERE id = :id"
        )->execute([
            'description' => $description,
            'taken_at'    => !empty($datePrise) ? $datePrise : null,
            'id'          => $photoId
        ]);

        $this->bdd->prepare("DELETE FROM photo_tags WHERE photo_id = :id")
                  ->execute(['id' => $photoId]);
        $this->attacherEtiquettes($photoId, $etiquettes);

        return true;
    }

    public function supprimer($photoId, $userId) {
        $stmt = $this->bdd->prepare(
            "SELECT photos.filename
             FROM photos
             JOIN albums ON photos.album_id = albums.id
             WHERE photos.id = :id AND albums.user_id = :user_id"
        );
        $stmt->execute(['id' => $photoId, 'user_id' => $userId]);
        $filename = $stmt->fetchColumn();

        if (!$filename) {
            return false;
        }

        $this->bdd->prepare("DELETE FROM photos WHERE id = :id")
                  ->execute(['id' => $photoId]);

        return $filename;
    }

    public function listerParAlbum($albumId) {
        $query = "SELECT photos.*,
                         GROUP_CONCAT(tags.name ORDER BY tags.name SEPARATOR ',') AS etiquettes
                  FROM photos
                  LEFT JOIN photo_tags ON photos.id = photo_tags.photo_id
                  LEFT JOIN tags ON photo_tags.tag_id = tags.id
                  WHERE photos.album_id = :album_id
                  GROUP BY photos.id
                  ORDER BY photos.uploaded_at DESC";
        $stmt = $this->bdd->prepare($query);
        $stmt->execute(['album_id' => $albumId]);
        return $stmt->fetchAll();
    }
}
