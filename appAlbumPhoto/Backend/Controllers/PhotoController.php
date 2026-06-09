<?php
require_once __DIR__ . '/../models/Photo.php';

class PhotoController {
    private $photoModel;

    public function __construct() {
        $this->photoModel = new Photo();
    }

    public function ajouter() {
        // Vérification des champs obligatoires
        if (empty($_POST['album_id']) || empty($_FILES['image'])) {
            http_response_code(400);
            echo json_encode(["message" => "Données du formulaire incomplètes."]);
            return;
        }

        $albumId = intval($_POST['album_id']);
        $titre = !empty($_POST['title']) ? $_POST['title'] : "";
        $fichier = $_FILES['image'];

        // 1. Sécurité : Vérifier s'il n'y a pas d'erreur d'upload
        if ($fichier['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(["message" => "Erreur lors du transfert du fichier."]);
            return;
        }

        // 2. Sécurité : Limiter la taille (Ex: 5 Mo max)
        if ($fichier['size'] > 5 * 1024 * 1024) {
            http_response_code(400);
            echo json_encode(["message" => "Le fichier est trop lourd (5 Mo maximum)."]);
            return;
        }

        // 3. Sécurité : Vérifier l'extension (Uniquement des images)
        $extensionsAutorisees = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $extensionFichier = strtolower(pathinfo($fichier['name'], PATHINFO_EXTENSION));

        if (!in_array($extensionFichier, $extensionsAutorisees)) {
            http_response_code(400);
            echo json_encode(["message" => "Format de fichier non autorisé (uniquement JPG, PNG, GIF, WEBP)."]);
            return;
        }

        // 4. Sécurité : Renommer le fichier pour éviter les doublons et nettoyer le nom
        $nouveauNomFichier = uniqid('img_', true) . '.' . $extensionFichier;

        // 5. Déplacement du fichier temporaire vers notre dossier final
        $dossierDestination = __DIR__ . '/../uploads/' . $nouveauNomFichier;

        if (move_uploaded_file($fichier['tmp_name'], $dossierDestination)) {
            // Enregistrement en Base de données
            $succes = $this->photoModel->ajouter($nouveauNomFichier, $titre, $albumId);

            if ($succes) {
                Db::logAction("Nouvelle photo ajoutée à l'album ID " . $albumId);
                http_response_code(201);
                echo json_encode(["succes" => true, "message" => "Photo ajoutée avec succès !"]);
            } else {
                http_response_code(500);
                echo json_encode(["succes" => false, "message" => "Erreur SQL lors de l'enregistrement."]);
            }
        } else {
            http_response_code(500);
            echo json_encode(["message" => "Impossible de sauvegarder l'image sur le serveur."]);
        }
    }

    public function lister() {
        $albumId = isset($_GET['album_id']) ? intval($_GET['album_id']) : 0;

        if ($albumId === 0) {
            http_response_code(400);
            echo json_encode(["message" => "Identifiant d'album manquant."]);
            return;
        }

        $photos = $this->photoModel->listerParAlbum($albumId);
        http_response_code(200);
        echo json_encode(["succes" => true, "photos" => $photos]);
    }
}