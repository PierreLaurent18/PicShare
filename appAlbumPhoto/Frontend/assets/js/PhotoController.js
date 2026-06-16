class PhotoController {
    constructor(photoService, commentService, shareService) {
        this.photoService   = photoService;
        this.commentService = commentService;
        this.shareService   = shareService;
        this.albumId = null;
        this.user    = null;
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            const session = localStorage.getItem('user');
            if (session) this.user = JSON.parse(session);

            const parametres = new URLSearchParams(window.location.search);
            this.albumId = parametres.get('id');

            if (!this.albumId) {
                alert("Album introuvable.");
                window.location.href = '../dashboard.html';
                return;
            }

            document.getElementById('photo-album-id').value = this.albumId;

            this.modal      = document.getElementById('modal-photo');
            this.grille     = document.getElementById('grille-photos');
            this.formulaire = document.getElementById('formulaire-photo');

            document.getElementById('bouton-ouvrir-modal-photo').addEventListener('click', () => this.basculerModal(true));
            document.getElementById('bouton-fermer-modal-photo').addEventListener('click', () => this.basculerModal(false));
            document.getElementById('bouton-annuler-modal-photo').addEventListener('click', () => this.basculerModal(false));
            this.formulaire.addEventListener('submit', (e) => this.gererDepotPhoto(e));

            const modalPartage = document.getElementById('modal-partage');
            document.getElementById('bouton-partager').addEventListener('click', () => modalPartage.style.display = 'flex');
            document.getElementById('fermer-modal-partage').addEventListener('click', () => modalPartage.style.display = 'none');
            document.getElementById('annuler-modal-partage').addEventListener('click', () => modalPartage.style.display = 'none');
            document.getElementById('form-partage').addEventListener('submit', (e) => this.gererPartage(e));

            this.lightbox = document.getElementById('lightbox');
            document.getElementById('lightbox-fermer').addEventListener('click', () => this.fermerLightbox());
            this.lightbox.addEventListener('click', (e) => { if (e.target === this.lightbox) this.fermerLightbox(); });

            this.recupererEtAfficherPhotos();
        });
    }

    basculerModal(ouvrir) {
        this.modal.style.display = ouvrir ? 'flex' : 'none';
        if (!ouvrir) this.formulaire.reset();
    }

    async recupererEtAfficherPhotos() {
        const resultat = await this.photoService.listerPhotos(this.albumId);
        const msgVide  = document.getElementById('message-photos-vide');

        if (resultat.succes && resultat.photos.length > 0) {
            if (msgVide) msgVide.style.display = 'none';
            this.grille.innerHTML = '';
            this.photos = resultat.photos;

            resultat.photos.forEach(photo => {
                const urlImage = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/uploads/${photo.filename}`;
                const carte = document.createElement('div');
                carte.className = 'carte-photo-grille';
                carte.innerHTML = `
                    <img src="${urlImage}" alt="${photo.description || ''}" style="width:100%;height:100%;object-fit:cover;display:block;">
                    <div class="overlay-photo">
                        <span>${photo.description || 'Sans titre'}</span>
                    </div>
                `;
                carte.addEventListener('click', () => this.ouvrirLightbox(photo));
                this.grille.appendChild(carte);
            });
        } else {
            if (msgVide) msgVide.style.display = 'block';
        }
    }

    ouvrirLightbox(photo) {
        const urlImage = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/uploads/${photo.filename}`;
        document.getElementById('lightbox-image').src = urlImage;
        document.getElementById('lightbox-titre').textContent = photo.description || 'Sans titre';
        document.getElementById('lightbox-photo-id').value = photo.id;
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.chargerCommentaires(photo.id);
    }

    fermerLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
    }

    async chargerCommentaires(photoId) {
        const zone = document.getElementById('lightbox-commentaires');
        zone.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem;">Chargement...</p>';

        const resultat = await this.commentService.listerCommentaires(photoId);
        if (resultat.succes && resultat.commentaires.length > 0) {
            zone.innerHTML = resultat.commentaires.map(c => `
                <div style="padding:0.6rem 0;border-bottom:1px solid #f1f5f9;">
                    <span style="font-weight:600;color:#3b82f6;font-size:0.85rem;">${c.username}</span>
                    <p style="margin:0.2rem 0 0;font-size:0.9rem;color:#334155;">${c.content}</p>
                </div>
            `).join('');
        } else {
            zone.innerHTML = '<p style="color:#94a3b8;font-size:0.85rem;">Aucun commentaire pour le moment.</p>';
        }
        zone.scrollTop = zone.scrollHeight;
    }

    async gererPartage(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('album_id', this.albumId);
        formData.append('owner_id', this.user.id);

        const resultat = await this.shareService.partager(formData);
        alert(resultat.message);
        if (resultat.succes) {
            document.getElementById('modal-partage').style.display = 'none';
            e.target.reset();
        }
    }

    async gererDepotPhoto(evenement) {
        evenement.preventDefault();
        const formData = new FormData(this.formulaire);
        const resultat = await this.photoService.ajouterPhoto(formData);

        if (resultat.succes) {
            this.basculerModal(false);
            this.recupererEtAfficherPhotos();
        } else {
            alert(resultat.message || "Une erreur est survenue.");
        }
    }
}

const photoService    = new PhotoService();
const commentService  = new CommentService();
const shareService    = new ShareService();
const photoController = new PhotoController(photoService, commentService, shareService);
