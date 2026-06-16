<?php
header("Content-Type: application/json");
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE, PUT");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once __DIR__ . '/db.php';
require_once __DIR__ . '/Controllers/AuthController.php';
require_once __DIR__ . '/Controllers/AlbumController.php';
require_once __DIR__ . '/Controllers/PhotoController.php';
require_once __DIR__ . '/Controllers/CommentController.php';
require_once __DIR__ . '/Controllers/SearchController.php';
require_once __DIR__ . '/Controllers/ShareController.php';

$route = isset($_GET['route']) ? $_GET['route'] : '';

$authController    = new AuthController();
$albumController   = new AlbumController();
$photoController   = new PhotoController();
$commentController  = new CommentController();
$searchController   = new SearchController();
$shareController    = new ShareController();

switch ($route) {
    case 'register':
        $authController->inscription();
        break;
    case 'login':
        $authController->connexion();
        break;
    case 'albums':
        $albumController->lister();
        break;
    case 'albums/create':
        $albumController->creer();
        break;
    case 'photos':
        $photoController->lister();
        break;
    case 'photos/upload':
        $photoController->ajouter();
        break;
    case 'comments':
        $commentController->lister();
        break;
    case 'comments/add':
        $commentController->ajouter();
        break;
    case 'search':
        $searchController->chercher();
        break;
    case 'share':
        $shareController->partager();
        break;
    case 'share/partages':
        $shareController->albumsPartagesAvecMoi();
        break;
    case 'share/publics':
        $shareController->albumsPublics();
        break;
    case 'share/revoquer':
        $shareController->revoquer();
        break;
    default:
        http_response_code(404);
        echo json_encode(["succes" => false, "message" => "Route non trouvee"]);
        break;
}
