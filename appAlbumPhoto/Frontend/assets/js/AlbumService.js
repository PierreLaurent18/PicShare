class AlbumService {
    constructor() {
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
    }

    async listerAlbums(userId) {
        const reponse = await fetch(`${this.apiUrl}?route=albums&user_id=${userId}`);
        return await reponse.json();
    }

    async creerAlbum(donneesFormulaire) {
        const reponse = await fetch(`${this.apiUrl}?route=albums/create`, {
            method: 'POST',
            body: donneesFormulaire
        });
        return await reponse.json();
    }

    async chargerDetailsAlbum(albumId) {
        const reponse = await fetch(`${this.apiUrl}?route=albums/details&id=${albumId}`);
        return await reponse.json();
    }
}