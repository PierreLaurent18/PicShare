class AuthService {
    constructor() {
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