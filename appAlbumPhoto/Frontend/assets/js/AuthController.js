class AuthController {
    constructor() {
        this.authService = new AuthService();
        this.init();
    }

    init() {
        document.addEventListener('DOMContentLoaded', () => {
            const formInscription = document.getElementById('form-inscription');
            const formConnexion = document.getElementById('form-connexion');

            if (formInscription) {
                formInscription.addEventListener('submit', (e) => this.gererInscription(e));
            }

            if (formConnexion) {
                formConnexion.addEventListener('submit', (e) => this.gererConnexion(e));
            }
        });
    }

    async gererInscription(e) {
        e.preventDefault();
        
        const pseudoInput = document.getElementById('pseudo');
        const emailInput = document.getElementById('email');
        const mdpInput = document.getElementById('mot-de-passe');
        const confirmInput = document.getElementById('confirmation-mot-de-passe');

        const errorPseudo = document.getElementById('erreur-pseudo');
        const errorEmail = document.getElementById('erreur-email');
        const errorMdp = document.getElementById('erreur-mdp');
        const errorConfirm = document.getElementById('erreur-confirmation');

        if(errorPseudo) errorPseudo.textContent = "";
        if(errorEmail) errorEmail.textContent = "";
        if(errorMdp) errorMdp.textContent = "";
        if(errorConfirm) errorConfirm.textContent = "";

        let formulaireValide = true;

        if (pseudoInput.value.trim().length < 3) {
            if(errorPseudo) errorPseudo.textContent = "Le nom d'utilisateur doit contenir au moins 3 caractères.";
            formulaireValide = false;
        }

        if (!emailInput.value.includes('@')) {
            if(errorEmail) errorEmail.textContent = "Veuillez entrer une adresse e-mail valide.";
            formulaireValide = false;
        }

        if (mdpInput.value.length < 8) {
            if(errorMdp) errorMdp.textContent = "Le mot de passe doit contenir au moins 8 caractères.";
            formulaireValide = false;
        }

        if (mdpInput.value !== confirmInput.value) {
            if(errorConfirm) errorConfirm.textContent = "Les deux mots de passe ne correspondent pas.";
            formulaireValide = false;
        }

        if (!formulaireValide) {
            return;
        }

        const formData = new FormData(e.target);

        try {
            const resultat = await this.authService.inscrire(formData);

            if (resultat.succes) {
                alert("Inscription réussie ! Vous allez être redirigé.");
                window.location.href = 'login.html';
            } else {
                alert(resultat.message || "Erreur renvoyée par le serveur PHP.");
            }
        } catch (erreur) {
            console.error("Erreur critique d'envoi :", erreur);
            alert("Impossible de joindre le serveur. Vérifie que MAMP est bien démarré sur le port 81.");
        }
    }

    async gererConnexion(e) {
        e.preventDefault();
        const formData = new FormData(e.target);

        try {
            const resultat = await this.authService.connecter(formData);
            if (resultat.succes) {
                localStorage.setItem('user', JSON.stringify(resultat.user));
                window.location.href = 'http://localhost:81/AlbumPhotoFinalProject/appAlbumPhoto/Frontend/views/dashboard.html';
            } else {
                alert(resultat.message || "Identifiants incorrects.");
            }
        } catch (erreur) {
            console.error("Erreur Connexion :", erreur);
            alert("Erreur de connexion au serveur.");
        }
    }
}

new AuthController();