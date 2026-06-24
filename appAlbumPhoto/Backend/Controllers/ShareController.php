<?php
require_once __DIR__ . '/../db.php';

class ShareController {
    private $bdd;

    public function __construct() {
        $this->bdd = Db::getConnection();
    }

    public function partager() {
        $albumId   = isset($_POST['album_id'])  ? intval($_POST['album_id'])  : 0;
        $ownerId   = isset($_POST['owner_id'])  ? intval($_POST['owner_id'])  : 0;
        $username  = isset($_POST['username'])  ? trim($_POST['username'])    : '';
        $droits    = isset($_POST['rights'])    ? trim($_POST['rights'])      : 'view';

        if (!$albumId || !$ownerId || empty($username)) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Données manquantes."]);
            return;
        }

        $stmtCheck = $this->bdd->prepare("SELECT id FROM albums WHERE id = :id AND user_id = :user_id");
        $stmtCheck->execute(['id' => $albumId, 'user_id' => $ownerId]);
        if (!$stmtCheck->fetch()) {
            http_response_code(403);
            echo json_encode(["succes" => false, "message" => "Accès refusé."]);
            return;
        }

        $stmtUser = $this->bdd->prepare("SELECT id FROM users WHERE username = :username");
        $stmtUser->execute(['username' => $username]);
        $cible = $stmtUser->fetch();

        if (!$cible) {
            echo json_encode(["succes" => false, "message" => "Utilisateur \"$username\" introuvable."]);
            return;
        }

        if ($cible['id'] === $ownerId) {
            echo json_encode(["succes" => false, "message" => "Vous ne pouvez pas partager avec vous-même."]);
            return;
        }

        $stmt = $this->bdd->prepare(
            "INSERT INTO album_shares (album_id, user_id, right_level)
             VALUES (:album_id, :user_id, :rights)
             ON DUPLICATE KEY UPDATE right_level = :rights2"
        );
        $stmt->execute([
            'album_id' => $albumId,
            'user_id'  => $cible['id'],
            'rights'   => $droits,
            'rights2'  => $droits
        ]);

        Db::logAction("Album $albumId partagé avec {$cible['id']} (droits: $droits)");
        echo json_encode(["succes" => true, "message" => "Album partagé avec \"$username\" !"]);
    }

    public function albumsPartagesAvecMoi() {
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

        if (!$userId) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Utilisateur manquant."]);
            return;
        }

        $stmt = $this->bdd->prepare(
            "SELECT albums.id, albums.title, albums.description, albums.visibility,
                    users.username AS owner_username, album_shares.right_level
             FROM album_shares
             JOIN albums ON album_shares.album_id = albums.id
             JOIN users  ON albums.user_id = users.id
             WHERE album_shares.user_id = :user_id
             ORDER BY albums.created_at DESC"
        );
        $stmt->execute(['user_id' => $userId]);
        $albums = $stmt->fetchAll();

        echo json_encode(["succes" => true, "albums" => $albums]);
    }

    public function albumsPublics() {
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

        $stmt = $this->bdd->prepare(
            "SELECT albums.id, albums.title, albums.description,
                    users.username AS owner_username
             FROM albums
             JOIN users ON albums.user_id = users.id
             WHERE albums.visibility = 'public'
             AND albums.user_id != :user_id
             ORDER BY albums.created_at DESC"
        );
        $stmt->execute(['user_id' => $userId]);
        $albums = $stmt->fetchAll();

        echo json_encode(["succes" => true, "albums" => $albums]);
    }

    public function genererLien() {
        $albumId = isset($_POST['album_id']) ? intval($_POST['album_id']) : 0;
        $ownerId = isset($_POST['owner_id']) ? intval($_POST['owner_id']) : 0;
        $droits  = isset($_POST['rights'])   ? trim($_POST['rights'])     : 'view';

        if (!$albumId || !$ownerId) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Données manquantes."]);
            return;
        }

        $check = $this->bdd->prepare("SELECT id FROM albums WHERE id = :id AND user_id = :user_id");
        $check->execute(['id' => $albumId, 'user_id' => $ownerId]);
        if (!$check->fetch()) {
            http_response_code(403);
            echo json_encode(["succes" => false, "message" => "Accès refusé."]);
            return;
        }

        $token = bin2hex(random_bytes(16));
        $this->bdd->prepare(
            "INSERT INTO share_links (token, album_id, right_level) VALUES (:token, :album_id, :rights)"
        )->execute(['token' => $token, 'album_id' => $albumId, 'rights' => $droits]);

        $base = $_ENV['APP_URL'] ?? '';
        $url  = $base . '/Frontend/views/album/album-detail.html?token=' . $token;

        Db::logAction("Lien de partage généré pour l'album $albumId (droits: $droits)");
        echo json_encode(["succes" => true, "url" => $url, "token" => $token]);
    }

    public function resoudreLien() {
        $token = isset($_GET['token']) ? trim($_GET['token']) : '';

        if ($token === '') {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Lien invalide."]);
            return;
        }

        $stmt = $this->bdd->prepare(
            "SELECT share_links.album_id, share_links.right_level,
                    albums.title, albums.description
             FROM share_links
             JOIN albums ON share_links.album_id = albums.id
             WHERE share_links.token = :token"
        );
        $stmt->execute(['token' => $token]);
        $lien = $stmt->fetch();

        if (!$lien) {
            http_response_code(404);
            echo json_encode(["succes" => false, "message" => "Lien introuvable ou expiré."]);
            return;
        }

        echo json_encode(["succes" => true, "lien" => $lien]);
    }

    public function chercherUtilisateurs() {
        $q       = isset($_GET['q'])       ? trim($_GET['q'])         : '';
        $exclure = isset($_GET['exclure']) ? intval($_GET['exclure']) : 0;

        if (strlen($q) < 1) {
            echo json_encode(["succes" => true, "utilisateurs" => []]);
            return;
        }

        $stmt = $this->bdd->prepare(
            "SELECT id, username FROM users
             WHERE username LIKE :motif AND id != :exclure
             ORDER BY username ASC
             LIMIT 8"
        );
        $stmt->execute(['motif' => $q . '%', 'exclure' => $exclure]);

        echo json_encode(["succes" => true, "utilisateurs" => $stmt->fetchAll()]);
    }

    public function revoquer() {
        $albumId = isset($_POST['album_id']) ? intval($_POST['album_id']) : 0;
        $userId  = isset($_POST['user_id'])  ? intval($_POST['user_id'])  : 0;

        if (!$albumId || !$userId) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Données manquantes."]);
            return;
        }

        $stmt = $this->bdd->prepare("DELETE FROM album_shares WHERE album_id = :album_id AND user_id = :user_id");
        $stmt->execute(['album_id' => $albumId, 'user_id' => $userId]);

        echo json_encode(["succes" => true, "message" => "Partage révoqué."]);
    }
}
