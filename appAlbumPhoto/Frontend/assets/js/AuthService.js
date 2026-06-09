class AuthService {
    constructor() {
        // Configuration de l'URL avec le port 81 et la majuscule à Backend
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
    }

    async inscrire(donneesFormulaire) {
        const reponse = await fetch(`${this.apiUrl}?route=register`, {
            method: 'POST',
            body: donneesFormulaire
        });
        return await reponse.json();
    }

    async connecter(donneesFormulaire) {
        const reponse = await fetch(`${this.apiUrl}?route=login`, {
            method: 'POST',
            body: donneesFormulaire
        });
        return await reponse.json();
    }
}