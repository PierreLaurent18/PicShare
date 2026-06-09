class HomeViewController {
    constructor() {
        this.apiUrl = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/routeur.php';
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.gererMenuNavigation();
            this.chargerPhotosPublices();
            this.chargerAlbumsPublics();
        });
    }

    gererMenuNavigation() {
        const menu = document.getElementById('menu-navigation');
        const heroActions = document.getElementById('hero-actions');
        const sessionUtilisateur = localStorage.getItem('user');

        if (sessionUtilisateur) {
            menu.innerHTML = `
                <li><a href="views/dashboard.html" class="lien-navigation" style="font-weight: 600;">📁 Mon Espace</a></li>
                <li><button id="bouton-quitter" class="bouton-secondaire">Déconnexion</button></li>
            `;
            if (heroActions) {
                heroActions.innerHTML = `<a href="views/dashboard.html" class="bouton-principal" style="padding: 0.75rem 2rem; font-size: 1.1rem;">Accéder à mon tableau de bord</a>`;
            }
            document.getElementById('bouton-quitter').addEventListener('click', () => {
                localStorage.removeItem('user');
                window.location.reload();
            });
        }
    }

    async chargerPhotosPublices() {
        try {
            const reponse = await fetch(`${this.apiUrl}?route=photos/public`);
            const resultat = await reponse.json();
            const grille = document.getElementById('grille-photos-publics');

            if (resultat.succes && resultat.photos.length > 0) {
                document.getElementById('message-photos-vide').style.display = 'none';
                grille.innerHTML = '';
                resultat.photos.forEach(photo => {
                    const div = document.createElement('div');
                    div.style.cssText = "background: white; border-radius: var(--arrondi-md); box-shadow: var(--ombre-sm); overflow: hidden; border: 1px solid #e2e8f0; display: flex; flex-direction: column;";
                    const urlImage = `http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Backend/uploads/${photo.filename}`;
                    div.innerHTML = `
                        <div style="width: 100%; height: 220px; overflow: hidden; background: #f1f5f9;">
                            <img src="${urlImage}" alt="${photo.title}" style="width: 100%; height: 100%; object-fit: cover;">
                        </div>
                        <div style="padding: 1rem;">
                            <h3 style="font-size: 1rem; font-weight: 600;">${photo.title}</h3>
                            <p style="font-size: 0.8rem; color: var(--texte-attenue);">Dans : <span style="color: #3b82f6;">${photo.album_title}</span></p>
                        </div>
                    `;
                    grille.appendChild(div);
                });
            }
        } catch (e) { console.error(e); }
    }

    async chargerAlbumsPublics() {
        try {
            const reponse = await fetch(`${this.apiUrl}?route=albums/public`);
            const resultat = await reponse.json();
            const grille = document.getElementById('grille-albums-publics');

            if (resultat.succes && resultat.albums.length > 0) {
                document.getElementById('message-public-vide').style.display = 'none';
                grille.innerHTML = '';
                resultat.albums.forEach(album => {
                    const carte = document.createElement('div');
                    carte.className = 'carte-fonctionnalite';
                    carte.innerHTML = `
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📁</div>
                        <h3>${album.title}</h3>
                        <p style="font-size: 0.9rem; color: var(--texte-attenue); margin-bottom: 1rem;">${album.description || ''}</p>
                        <div style="display: flex; justify-content: space-between; width: 100%; border-top: 1px solid #f1f5f9; padding-top: 0.75rem;">
                            <span style="font-size: 0.8rem;">Par : <b>${album.username}</b></span>
                            <a href="views/album-details.html?id=${album.id}" style="font-weight: 600; color: #3b82f6;">Voir →</a>
                        </div>
                    `;
                    grille.appendChild(carte);
                });
            }
        } catch (e) { console.error(e); }
    }
}
new HomeViewController();