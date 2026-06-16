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
            this.initAutocompletion();

            this.lightbox = document.getElementById('lightbox');
            document.getElementById('lightbox-fermer').addEventListener('click', () => this.fermerLightbox());
            this.lightbox.addEventListener('click', (e) => { if (e.target === this.lightbox) this.fermerLightbox(); });
            document.getElementById('lightbox-supprimer').addEventListener('click', () => this.gererSuppression());
            document.getElementById('lightbox-modifier').addEventListener('click', () => this.ouvrirEditionPhoto());
            document.getElementById('edit-annuler').addEventListener('click', () => this.fermerEditionPhoto());
            document.getElementById('form-modifier-photo').addEventListener('submit', (e) => this.gererModificationPhoto(e));

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
        this.photoCourante = photo;
        const urlImage = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/uploads/${photo.filename}`;
        document.getElementById('lightbox-image').src = urlImage;
        document.getElementById('lightbox-titre').textContent = photo.description || 'Sans titre';
        document.getElementById('lightbox-photo-id').value = photo.id;

        const zoneDate = document.getElementById('lightbox-date');
        if (photo.taken_at) {
            const d = new Date(photo.taken_at);
            zoneDate.textContent = '📅 Prise le ' + d.toLocaleDateString('fr-FR');
        } else {
            zoneDate.textContent = '';
        }

        const zoneTags = document.getElementById('lightbox-etiquettes');
        zoneTags.innerHTML = '';
        if (photo.etiquettes) {
            photo.etiquettes.split(',').forEach(tag => {
                const span = document.createElement('span');
                span.textContent = '#' + tag;
                span.style.cssText = 'font-size:0.75rem;background:#eff6ff;color:#3b82f6;padding:0.2rem 0.6rem;border-radius:99px;';
                zoneTags.appendChild(span);
            });
        }
        this.lightbox.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        this.chargerCommentaires(photo.id);
    }

    fermerLightbox() {
        this.lightbox.style.display = 'none';
        document.body.style.overflow = '';
        document.getElementById('form-modifier-photo').style.display = 'none';
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

    initAutocompletion() {
        const input  = document.getElementById('input-username-partage');
        const liste  = document.getElementById('suggestions-utilisateurs');
        let timer = null;

        const fermer = () => { liste.style.display = 'none'; liste.innerHTML = ''; };

        input.addEventListener('input', () => {
            const q = input.value.trim();
            clearTimeout(timer);
            if (q.length < 1) { fermer(); return; }

            timer = setTimeout(async () => {
                const res = await this.shareService.chercherUtilisateurs(q, this.user.id);
                if (!res.succes || res.utilisateurs.length === 0) { fermer(); return; }

                liste.innerHTML = '';
                res.utilisateurs.forEach(u => {
                    const li = document.createElement('li');
                    li.textContent = u.username;
                    li.style.cssText = 'padding:0.6rem 0.75rem;cursor:pointer;font-size:0.9rem;';
                    li.addEventListener('mouseenter', () => li.style.background = '#f1f5f9');
                    li.addEventListener('mouseleave', () => li.style.background = '#fff');
                    li.addEventListener('click', () => { input.value = u.username; fermer(); });
                    liste.appendChild(li);
                });
                liste.style.display = 'block';
            }, 200);
        });

        // Fermer la liste si on clique ailleurs
        document.addEventListener('click', (e) => {
            if (e.target !== input && !liste.contains(e.target)) fermer();
        });
    }

    async gererSuppression() {
        if (!this.photoCourante) return;
        if (!this.user) { alert("Vous devez être connecté."); return; }
        if (!confirm("Supprimer définitivement cette photo ?")) return;

        const formData = new FormData();
        formData.append('photo_id', this.photoCourante.id);
        formData.append('user_id', this.user.id);

        const resultat = await this.photoService.supprimerPhoto(formData);
        if (resultat.succes) {
            this.fermerLightbox();
            this.recupererEtAfficherPhotos();
        } else {
            alert(resultat.message || "Suppression impossible.");
        }
    }

    ouvrirEditionPhoto() {
        if (!this.photoCourante) return;
        document.getElementById('edit-description').value = this.photoCourante.description || '';
        document.getElementById('edit-date').value        = this.photoCourante.taken_at ? this.photoCourante.taken_at.substring(0, 10) : '';
        document.getElementById('edit-tags').value        = this.photoCourante.etiquettes || '';
        document.getElementById('form-modifier-photo').style.display = 'flex';
    }

    fermerEditionPhoto() {
        document.getElementById('form-modifier-photo').style.display = 'none';
    }

    async gererModificationPhoto(e) {
        e.preventDefault();
        if (!this.photoCourante || !this.user) return;

        const formData = new FormData();
        formData.append('photo_id', this.photoCourante.id);
        formData.append('user_id', this.user.id);
        formData.append('title', document.getElementById('edit-description').value);
        formData.append('taken_at', document.getElementById('edit-date').value);
        formData.append('tags', document.getElementById('edit-tags').value);

        const resultat = await this.photoService.modifierPhoto(formData);
        if (resultat.succes) {
            this.fermerLightbox();
            this.recupererEtAfficherPhotos();
        } else {
            alert(resultat.message || "Modification impossible.");
        }
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
