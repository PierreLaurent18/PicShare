class AlbumController {
    constructor() {
        this.albumService = new AlbumService();
        this.shareService = new ShareService();
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            const sessionUtilisateur = localStorage.getItem('user');
            if (!sessionUtilisateur) {
                alert("Accès refusé.");
                window.location.href = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/auth/login.html';
                return;
            }

            this.user = JSON.parse(sessionUtilisateur);

            const zonePseudo = document.getElementById('souhait-utilisateur');
            if (zonePseudo) zonePseudo.textContent = 'Bonjour, ' + this.user.username + ' !';

            const btnDeconnexion = document.getElementById('bouton-deconnexion');
            if (btnDeconnexion) btnDeconnexion.addEventListener('click', () => {
                localStorage.removeItem('user');
                window.location.href = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/auth/login.html';
            });

            this.albumEnEdition = null;
            const modal = document.getElementById('modal-album');
            document.getElementById('bouton-ouvrir-modal').addEventListener('click', () => this.ouvrirModalCreation());
            document.getElementById('bouton-fermer-modal').addEventListener('click', () => modal.style.display = 'none');
            document.getElementById('bouton-annuler-modal').addEventListener('click', () => modal.style.display = 'none');

            const formAlbum = document.getElementById('formulaire-album');
            if (formAlbum) formAlbum.addEventListener('submit', (e) => this.gererSoumissionAlbum(e));

            this.chargerAlbumsPartages();
            this.chargerAlbumsPublics();

            this.searchService = new SearchService();
            const formRecherche = document.getElementById('form-recherche');
            const btnEffacer    = document.getElementById('btn-effacer-recherche');
            if (formRecherche) formRecherche.addEventListener('submit', (e) => this.gererRecherche(e));
            if (btnEffacer) btnEffacer.addEventListener('click', () => this.effacerRecherche());

            this.chargerAlbumsPrives();
        });
    }

    async gererRecherche(e) {
        e.preventDefault();
        const q = document.getElementById('input-recherche').value.trim();
        if (q.length < 2) { alert("Entrez au moins 2 caractères."); return; }

        const resultat = await this.searchService.chercher(q, this.user.id);

        const sectionResultats = document.getElementById('section-resultats');
        const sectionAlbums    = document.getElementById('section-albums');
        const titreResultats   = document.getElementById('titre-resultats');
        const divAlbums        = document.getElementById('resultats-albums');
        const divPhotos        = document.getElementById('resultats-photos');
        const msgAucun         = document.getElementById('message-aucun-resultat');
        const btnEffacer       = document.getElementById('btn-effacer-recherche');

        sectionResultats.style.display = 'block';
        sectionAlbums.style.display    = 'none';
        btnEffacer.style.display       = 'inline-block';
        titreResultats.textContent     = `Résultats pour "${q}"`;
        divAlbums.innerHTML = '';
        divPhotos.innerHTML = '';

        const aucunResultat = resultat.albums.length === 0 && resultat.photos.length === 0;
        msgAucun.style.display = aucunResultat ? 'block' : 'none';

        if (resultat.albums.length > 0) {
            divAlbums.innerHTML = `<h4 style="margin-bottom:0.75rem;color:#475569;">📁 Albums (${resultat.albums.length})</h4>`;
            const grille = document.createElement('div');
            grille.className = 'grille-fonctionnalites';
            resultat.albums.forEach(album => {
                const carte = document.createElement('div');
                carte.className = 'carte-fonctionnalite';
                carte.innerHTML = `
                    <div style="font-size:2.5rem;margin-bottom:0.75rem;">📁</div>
                    <h3>${album.title}</h3>
                    <p style="font-size:0.85rem;color:var(--texte-attenue);margin-bottom:1rem;">${album.description || ''}</p>
                    <a href="http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${album.id}"
                       class="bouton-principal" style="display:block;text-align:center;">Ouvrir →</a>
                `;
                grille.appendChild(carte);
            });
            divAlbums.appendChild(grille);
        }

        if (resultat.photos.length > 0) {
            divPhotos.innerHTML = `<h4 style="margin-bottom:0.75rem;color:#475569;">🖼️ Photos (${resultat.photos.length})</h4>`;
            const grille = document.createElement('div');
            grille.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;';
            resultat.photos.forEach(photo => {
                const urlImage = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/uploads/${photo.filename}`;
                const carte = document.createElement('div');
                carte.style.cssText = 'border-radius:8px;overflow:hidden;background:#f1f5f9;cursor:pointer;';
                const tagsHtml = photo.etiquettes
                    ? '<div style="margin-top:0.35rem;display:flex;flex-wrap:wrap;gap:0.25rem;">' +
                        photo.etiquettes.split(',').map(t =>
                            `<span style="font-size:0.7rem;background:#eff6ff;color:#3b82f6;padding:0.1rem 0.45rem;border-radius:99px;">#${t}</span>`
                        ).join('') +
                      '</div>'
                    : '';
                carte.innerHTML = `
                    <img src="${urlImage}" alt="${photo.description || ''}" style="width:100%;height:130px;object-fit:cover;display:block;">
                    <div style="padding:0.5rem;font-size:0.8rem;">
                        <p style="font-weight:600;margin:0;">${photo.description || 'Sans titre'}</p>
                        <p style="color:var(--texte-attenue);margin:0.2rem 0 0;">dans <b>${photo.album_title}</b></p>
                        ${tagsHtml}
                    </div>
                `;
                carte.addEventListener('click', () => {
                    window.location.href = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${photo.album_id}`;
                });
                grille.appendChild(carte);
            });
            divPhotos.appendChild(grille);
        }
    }

    async chargerAlbumsPartages() {
        try {
            const res = await this.shareService.albumsPartagesAvecMoi(this.user.id);
            const grille = document.getElementById('grille-partages');
            if (!grille) return;
            if (res.succes && res.albums.length > 0) {
                document.getElementById('message-partages-vide').style.display = 'none';
                grille.innerHTML = '';
                res.albums.forEach(album => {
                    const carte = document.createElement('div');
                    carte.className = 'carte-fonctionnalite';
                    const badge = { view: '👁️ Lecture', comment: '💬 Commentaires', contribute: '✏️ Contribution' }[album.right_level] || album.right_level;
                    carte.innerHTML = `
                        <div style="font-size:2.5rem;margin-bottom:0.75rem;">📁</div>
                        <h3>${album.title}</h3>
                        <p style="font-size:0.8rem;color:var(--texte-attenue);margin-bottom:0.5rem;">Par <b>${album.owner_username}</b></p>
                        <span style="font-size:0.75rem;background:#eff6ff;color:#3b82f6;padding:0.2rem 0.6rem;border-radius:99px;">${badge}</span>
                        <a href="http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${album.id}"
                           class="bouton-principal" style="display:block;text-align:center;margin-top:1rem;">Ouvrir →</a>
                    `;
                    grille.appendChild(carte);
                });
            }
        } catch(e) { console.error(e); }
    }

    async chargerAlbumsPublics() {
        try {
            const res = await this.shareService.albumsPublics(this.user.id);
            const grille = document.getElementById('grille-publics');
            if (!grille) return;
            if (res.succes && res.albums.length > 0) {
                document.getElementById('message-publics-vide').style.display = 'none';
                grille.innerHTML = '';
                res.albums.forEach(album => {
                    const carte = document.createElement('div');
                    carte.className = 'carte-fonctionnalite';
                    carte.innerHTML = `
                        <div style="font-size:2.5rem;margin-bottom:0.75rem;">🌍</div>
                        <h3>${album.title}</h3>
                        <p style="font-size:0.85rem;color:var(--texte-attenue);margin-bottom:1rem;">${album.description || ''}</p>
                        <p style="font-size:0.8rem;color:var(--texte-attenue);margin-bottom:1rem;">Par <b>${album.owner_username}</b></p>
                        <a href="http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${album.id}"
                           class="bouton-secondaire" style="display:block;text-align:center;">Voir →</a>
                    `;
                    grille.appendChild(carte);
                });
            }
        } catch(e) { console.error(e); }
    }

    effacerRecherche() {
        document.getElementById('input-recherche').value = '';
        document.getElementById('section-resultats').style.display = 'none';
        document.getElementById('section-albums').style.display    = 'block';
        document.getElementById('btn-effacer-recherche').style.display = 'none';
    }

    async chargerAlbumsPrives() {
        try {
            const resultat = await this.albumService.listerAlbums(this.user.id);
            const grille = document.getElementById('grille-albums');

            if (resultat.succes && resultat.albums.length > 0) {
                const msgVide = document.getElementById('message-vide');
                if (msgVide) msgVide.style.display = 'none';
                grille.innerHTML = '';
                resultat.albums.forEach(album => {
                    const carte = document.createElement('div');
                    carte.className = 'carte-fonctionnalite';
                    carte.innerHTML = `
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                        <h3>${album.title}</h3>
                        <p style="font-size: 0.9rem; color: var(--texte-attenue); margin-bottom: 1rem;">
                            Statut : <b>${album.visibility}</b>
                        </p>
                        <a href="http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${album.id}" class="bouton-principal" style="display:block; text-align:center;">Ouvrir →</a>
                        <button class="bouton-secondaire btn-modifier-album" style="display:block;width:100%;margin-top:0.5rem;">✏️ Modifier</button>
                    `;
                    carte.querySelector('.btn-modifier-album').addEventListener('click', () => this.ouvrirModalEdition(album));
                    grille.appendChild(carte);
                });
            }
        } catch (e) { console.error(e); }
    }

    ouvrirModalCreation() {
        this.albumEnEdition = null;
        document.getElementById('formulaire-album').reset();
        document.getElementById('titre-modal-album').textContent = "Nouveau dossier d'album";
        document.getElementById('bouton-soumettre-album').textContent = "Créer l'album";
        document.getElementById('modal-album').style.display = 'flex';
    }

    ouvrirModalEdition(album) {
        this.albumEnEdition = album.id;
        document.getElementById('titre-album').value       = album.title;
        document.getElementById('description-album').value = album.description || '';
        document.getElementById('visibilite-album').value  = album.visibility;
        document.getElementById('titre-modal-album').textContent = "Modifier l'album";
        document.getElementById('bouton-soumettre-album').textContent = "Enregistrer";
        document.getElementById('modal-album').style.display = 'flex';
    }

    async gererSoumissionAlbum(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('user_id', this.user.id);

        try {
            let resultat;
            if (this.albumEnEdition) {
                formData.append('album_id', this.albumEnEdition);
                resultat = await this.albumService.modifierAlbum(formData);
            } else {
                resultat = await this.albumService.creerAlbum(formData);
            }

            if (resultat.succes) {
                document.getElementById('modal-album').style.display = 'none';
                e.target.reset();
                this.albumEnEdition = null;
                this.chargerAlbumsPrives();
            } else {
                alert(resultat.message || "Une erreur est survenue.");
            }
        } catch (err) { console.error(err); }
    }
}
new AlbumController();
