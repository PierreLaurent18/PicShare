class CommentService {
    constructor() {
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
    }

    async listerCommentaires(photoId) {
        const reponse = await fetch(`${this.apiUrl}?route=comments&photo_id=${photoId}`);
        return await reponse.json();
    }

    async ajouterCommentaire(formData) {
        const reponse = await fetch(`${this.apiUrl}?route=comments/add`, {
            method: 'POST',
            body: formData
        });
        return await reponse.json();
    }
}
