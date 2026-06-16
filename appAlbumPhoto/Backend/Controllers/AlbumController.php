<?php
require_once __DIR__ . '/../models/Album.php';

class AlbumController {
    private $albumModel;

    public function __construct() {
        $this->albumModel = new Album();
    }

    public function creer() {
        $title       = isset($_POST['title'])       ? trim($_POST['title'])       : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : null;
        $visibility  = isset($_POST['visibility'])  ? $_POST['visibility']         : 'private';
        $userId      = isset($_POST['user_id'])     ? intval($_POST['user_id'])    : 0;

        if (empty($title) || $userId === 0) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Le titre et l'utilisateur sont obligatoires."]);
            return;
        }

        $succes = $this->albumModel->creer($title, $description, $visibility, $userId);

        if ($succes) {
            Db::logAction("Utilisateur $userId a créé l'album : $title");
            http_response_code(201);
            echo json_encode(["succes" => true, "message" => "Album créé avec succès !"]);
        } else {
            http_response_code(500);
            echo json_encode(["succes" => false, "message" => "Erreur lors de la création de l'album."]);
        }
    }

    public function modifier() {
        $albumId     = isset($_POST['album_id'])    ? intval($_POST['album_id'])  : 0;
        $title       = isset($_POST['title'])       ? trim($_POST['title'])       : '';
        $description = isset($_POST['description']) ? trim($_POST['description']) : null;
        $visibility  = isset($_POST['visibility'])  ? $_POST['visibility']         : 'private';
        $userId      = isset($_POST['user_id'])     ? intval($_POST['user_id'])    : 0;

        if (!$albumId || empty($title) || !$userId) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Données manquantes."]);
            return;
        }

        $succes = $this->albumModel->modifier($albumId, $title, $description, $visibility, $userId);

        if ($succes) {
            Db::logAction("Album $albumId modifié par l'utilisateur $userId");
            echo json_encode(["succes" => true, "message" => "Album modifié !"]);
        } else {
            http_response_code(403);
            echo json_encode(["succes" => false, "message" => "Modification non autorisée."]);
        }
    }

    public function lister() {
        $userId = isset($_GET['user_id']) ? intval($_GET['user_id']) : 0;

        if ($userId === 0) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Identifiant utilisateur manquant."]);
            return;
        }

        $albums = $this->albumModel->listerParUtilisateur($userId);
        echo json_encode(["succes" => true, "albums" => $albums]);
    }
}
