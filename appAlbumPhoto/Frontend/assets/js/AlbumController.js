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

            this.initOnglets();
            this.chargerAlbumsPrives();
        });
    }

    initOnglets() {
        const onglets = document.querySelectorAll('#onglets-albums .onglet');
        onglets.forEach(onglet => {
            onglet.addEventListener('click', () => {
                onglets.forEach(o => o.classList.remove('actif'));
                onglet.classList.add('actif');

                document.querySelectorAll('.panneau-onglet').forEach(p => p.style.display = 'none');
                document.getElementById(onglet.dataset.cible).style.display = 'block';
            });
        });
    }

    async gererRecherche(e) {
        e.preventDefault();

        const criteres = {
            q:     document.getElementById('critere-q').value.trim(),
            tag:   document.getElementById('critere-tag').value.trim(),
            album: document.getElementById('critere-album').value.trim(),
            date:  document.getElementById('critere-date').value
        };

        if (!criteres.q && !criteres.tag && !criteres.album && !criteres.date) {
            alert("Renseignez au moins un critère.");
            return;
        }

        const resultat = await this.searchService.rechercherPhotos(this.user.id, criteres);

        const sectionResultats = document.getElementById('section-resultats');
        const zoneAlbums       = document.getElementById('zone-albums');
        const titreResultats   = document.getElementById('titre-resultats');
        const divPhotos        = document.getElementById('resultats-photos');
        const msgAucun         = document.getElementById('message-aucun-resultat');

        sectionResultats.style.display = 'block';
        zoneAlbums.style.display       = 'none';
        divPhotos.innerHTML = '';

        const photos = resultat.photos || [];
        titreResultats.textContent = `${photos.length} photo(s) trouvée(s)`;
        msgAucun.style.display = photos.length === 0 ? 'block' : 'none';

        if (photos.length > 0) {
            const grille = document.createElement('div');
            grille.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;';
            photos.forEach(photo => {
                const urlImage = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/uploads/${photo.filename}`;
                const carte = document.createElement('div');
                carte.style.cssText = 'border:1px solid var(--bordure);border-radius:var(--arrondi-md);overflow:hidden;cursor:pointer;';
                const tagsHtml = photo.etiquettes
                    ? '<div style="margin-top:0.35rem;display:flex;flex-wrap:wrap;gap:0.25rem;">' +
                        photo.etiquettes.split(',').map(t =>
                            `<span style="font-size:0.7rem;background:#f4f4f5;color:var(--texte-attenue);padding:0.1rem 0.45rem;border-radius:99px;">#${t}</span>`
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
                    carte.className = 'carte-album';
                    const badge = { view: '👁️ Lecture', comment: '💬 Commentaires', contribute: '✏️ Contribution' }[album.right_level] || album.right_level;
                    carte.innerHTML = `
                        <div class="carte-album-haut">
                            <div class="carte-album-icone">📁</div>
                            <span class="badge-visibilite">${badge}</span>
                        </div>
                        <h3 class="carte-album-titre">${album.title}</h3>
                        <p class="carte-album-desc">Par ${album.owner_username}</p>
                        <div class="carte-album-actions">
                            <a href="http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${album.id}" class="lien-ouvrir">Ouvrir</a>
                        </div>
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
                    carte.className = 'carte-album';
                    carte.innerHTML = `
                        <div class="carte-album-haut">
                            <div class="carte-album-icone">🌍</div>
                            <span class="badge-visibilite">Public</span>
                        </div>
                        <h3 class="carte-album-titre">${album.title}</h3>
                        <p class="carte-album-desc">Par ${album.owner_username}</p>
                        <div class="carte-album-actions">
                            <a href="http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${album.id}" class="lien-ouvrir">Voir</a>
                        </div>
                    `;
                    grille.appendChild(carte);
                });
            }
        } catch(e) { console.error(e); }
    }

    effacerRecherche() {
        document.getElementById('critere-q').value     = '';
        document.getElementById('critere-tag').value   = '';
        document.getElementById('critere-album').value = '';
        document.getElementById('critere-date').value  = '';
        document.getElementById('section-resultats').style.display = 'none';
        document.getElementById('zone-albums').style.display        = 'block';
    }

    libelleVisibilite(v) {
        return { private: '🔒 Privé', public: '🌍 Public', restricted: '👥 Restreint' }[v] || v;
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
                    carte.className = 'carte-album';
                    carte.innerHTML = `
                        <div class="carte-album-haut">
                            <div class="carte-album-icone">📁</div>
                            <span class="badge-visibilite">${this.libelleVisibilite(album.visibility)}</span>
                        </div>
                        <h3 class="carte-album-titre">${album.title}</h3>
                        <div class="carte-album-actions">
                            <a href="http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/album/album-detail.html?id=${album.id}" class="lien-ouvrir">Ouvrir</a>
                            <button class="btn-icone btn-modifier-album">✏️ Modifier</button>
                        </div>
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
        document.getElementById('titre-album').value      = album.title;
        document.getElementById('visibilite-album').value = album.visibility;
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
