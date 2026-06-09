<?php

function chargerEnv() {
    $fichierEnv = __DIR__ . '/../.env';
    if (!file_exists($fichierEnv)) return;

    $lignes = file($fichierEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lignes as $ligne) {
        if (str_starts_with(trim($ligne), '#')) continue;
        if (!str_contains($ligne, '=')) continue;

        [$cle, $valeur] = explode('=', $ligne, 2);
        $cle    = trim($cle);
        $valeur = trim($valeur);

        if (!empty($cle)) {
            $_ENV[$cle] = $valeur;
            putenv("$cle=$valeur");
        }
    }
}

chargerEnv();

class Db {
    private static $instance = null;

    public static function getConnection() {
        if (self::$instance === null) {
            $host     = $_ENV['DB_HOST']     ?? '127.0.0.1';
            $port     = $_ENV['DB_PORT']     ?? '3306';
            $dbname   = $_ENV['DB_NAME']     ?? 'photo_album_db';
            $user     = $_ENV['DB_USER']     ?? 'root';
            $password = $_ENV['DB_PASSWORD'] ?? '';

            self::$instance = new PDO(
                "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
                $user,
                $password,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
                ]
            );
        }
        return self::$instance;
    }

    public static function logAction($message) {
        $logFile = __DIR__ . '/error.log';
        file_put_contents($logFile, "[" . date('Y-m-d H:i:s') . "] " . $message . "\n", FILE_APPEND);
    }
}
