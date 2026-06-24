class ShareService {
    constructor() {
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
    }

    async partager(formData) {
        const r = await fetch(`${this.apiUrl}?route=share`, { method: 'POST', body: formData });
        return await r.json();
    }

    async albumsPartagesAvecMoi(userId) {
        const r = await fetch(`${this.apiUrl}?route=share/partages&user_id=${userId}`);
        return await r.json();
    }

    async albumsPublics(userId) {
        const r = await fetch(`${this.apiUrl}?route=share/publics&user_id=${userId}`);
        return await r.json();
    }

    async genererLien(formData) {
        const r = await fetch(`${this.apiUrl}?route=share/link`, { method: 'POST', body: formData });
        return await r.json();
    }

    async resoudreLien(token) {
        const r = await fetch(`${this.apiUrl}?route=share/resolve&token=${encodeURIComponent(token)}`);
        return await r.json();
    }

    async chercherUtilisateurs(q, exclure) {
        const r = await fetch(`${this.apiUrl}?route=users/search&q=${encodeURIComponent(q)}&exclure=${exclure}`);
        return await r.json();
    }

    async revoquer(formData) {
        const r = await fetch(`${this.apiUrl}?route=share/revoquer`, { method: 'POST', body: formData });
        return await r.json();
    }
}
