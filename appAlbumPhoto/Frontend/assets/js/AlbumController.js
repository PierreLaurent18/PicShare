class AlbumController {
    constructor() {
        this.albumService = new AlbumService();
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

            // Modal
            const modal = document.getElementById('modal-album');
            document.getElementById('bouton-ouvrir-modal').addEventListener('click', () => modal.style.display = 'flex');
            document.getElementById('bouton-fermer-modal').addEventListener('click', () => modal.style.display = 'none');
            document.getElementById('bouton-annuler-modal').addEventListener('click', () => modal.style.display = 'none');

            // Formulaire album
            const formAlbum = document.getElementById('formulaire-album');
            if (formAlbum) formAlbum.addEventListener('submit', (e) => this.gererCreationAlbum(e));

            // Recherche
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

        // Albums trouvés
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

        // Photos trouvées
        if (resultat.photos.length > 0) {
            divPhotos.innerHTML = `<h4 style="margin-bottom:0.75rem;color:#475569;">🖼️ Photos (${resultat.photos.length})</h4>`;
            const grille = document.createElement('div');
            grille.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(160px,1fr));gap:1rem;';
            resultat.photos.forEach(photo => {
                const urlImage = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/uploads/${photo.filename}`;
                const carte = document.createElement('div');
                carte.style.cssText = 'border-radius:8px;overflow:hidden;background:#f1f5f9;cursor:pointer;';
                carte.innerHTML = `
                    <img src="${urlImage}" alt="${photo.description || ''}" style="width:100%;height:130px;object-fit:cover;display:block;">
                    <div style="padding:0.5rem;font-size:0.8rem;">
                        <p style="font-weight:600;margin:0;">${photo.description || 'Sans titre'}</p>
                        <p style="color:var(--texte-attenue);margin:0.2rem 0 0;">dans <b>${photo.album_title}</b></p>
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
                    `;
                    grille.appendChild(carte);
                });
            }
        } catch (e) { console.error(e); }
    }

    async gererCreationAlbum(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        formData.append('user_id', this.user.id);

        try {
            const resultat = await this.albumService.creerAlbum(formData);
            if (resultat.succes) {
                document.getElementById('modal-album').style.display = 'none';
                e.target.reset();
                this.chargerAlbumsPrives();
            } else {
                alert(resultat.message || "Erreur lors de la création.");
            }
        } catch (err) { console.error(err); }
    }
}
new AlbumController();
