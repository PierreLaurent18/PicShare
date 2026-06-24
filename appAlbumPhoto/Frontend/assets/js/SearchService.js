class SearchService {
    constructor() {
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
    }

    async chercher(q, userId) {
        const reponse = await fetch(`${this.apiUrl}?route=search&q=${encodeURIComponent(q)}&user_id=${userId}`);
        return await reponse.json();
    }

    async rechercherPhotos(userId, criteres) {
        const params = new URLSearchParams({ user_id: userId });
        if (criteres.q)     params.append('q', criteres.q);
        if (criteres.tag)   params.append('tag', criteres.tag);
        if (criteres.album) params.append('album', criteres.album);
        if (criteres.date)  params.append('date', criteres.date);
        const reponse = await fetch(`${this.apiUrl}?route=search/photos&${params.toString()}`);
        return await reponse.json();
    }
}
