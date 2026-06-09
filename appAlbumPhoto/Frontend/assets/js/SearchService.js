class SearchService {
    constructor() {
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
    }

    async chercher(q, userId) {
        const reponse = await fetch(`${this.apiUrl}?route=search&q=${encodeURIComponent(q)}&user_id=${userId}`);
        return await reponse.json();
    }
}
