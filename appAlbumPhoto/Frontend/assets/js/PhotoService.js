class PhotoService {
    constructor() {
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
    }

    async listerPhotos(albumId) {
        const reponse = await fetch(`${this.apiUrl}?route=photos&album_id=${albumId}`);
        return await reponse.json();
    }

    async ajouterPhoto(donneesFormulaire) {
        const reponse = await fetch(`${this.apiUrl}?route=photos/upload`, {
            method: 'POST',
            body: donneesFormulaire
        });
        return await reponse.json();
    }

    async supprimerPhoto(donneesFormulaire) {
        const reponse = await fetch(`${this.apiUrl}?route=photos/delete`, {
            method: 'POST',
            body: donneesFormulaire
        });
        return await reponse.json();
    }

    async modifierPhoto(donneesFormulaire) {
        const reponse = await fetch(`${this.apiUrl}?route=photos/update`, {
            method: 'POST',
            body: donneesFormulaire
        });
        return await reponse.json();
    }
}