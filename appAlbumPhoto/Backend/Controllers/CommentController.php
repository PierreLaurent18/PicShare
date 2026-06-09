<?php
require_once __DIR__ . '/../models/Comment.php';

class CommentController {
    private $commentModel;

    public function __construct() {
        $this->commentModel = new Comment();
    }

    public function ajouter() {
        $photoId = isset($_POST['photo_id']) ? intval($_POST['photo_id']) : 0;
        $userId  = isset($_POST['user_id'])  ? intval($_POST['user_id'])  : 0;
        $contenu = isset($_POST['content'])  ? trim($_POST['content'])    : '';

        if (!$photoId || !$userId || empty($contenu)) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "Données manquantes."]);
            return;
        }

        $succes = $this->commentModel->ajouter($photoId, $userId, $contenu);

        if ($succes) {
            echo json_encode(["succes" => true, "message" => "Commentaire ajouté !"]);
        } else {
            http_response_code(500);
            echo json_encode(["succes" => false, "message" => "Erreur lors de l'ajout."]);
        }
    }

    public function lister() {
        $photoId = isset($_GET['photo_id']) ? intval($_GET['photo_id']) : 0;

        if (!$photoId) {
            http_response_code(400);
            echo json_encode(["succes" => false, "message" => "ID photo manquant."]);
            return;
        }

        $commentaires = $this->commentModel->listerParPhoto($photoId);
        echo json_encode(["succes" => true, "commentaires" => $commentaires]);
    }
}
