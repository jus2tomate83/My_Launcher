import { Octokit } from "octokit";

// Gestion du token via localStorage pour persister la connexion
const TOKEN_KEY = "gh_launcher_token";
const USERNAME_KEY = "gh_launcher_username";

export const getAuth = () => {
    return {
        token: localStorage.getItem(TOKEN_KEY),
        username: localStorage.getItem(USERNAME_KEY)
    };
};

export const setAuth = (username, token) => {
    localStorage.setItem(USERNAME_KEY, username);
    if (token) localStorage.setItem(TOKEN_KEY, token);
};

export const clearAuth = () => {
    localStorage.removeItem(TOKEN_KEY);
    // On garde le username pour le mode "visiteur" si besoin, ou on supprime tout :
    // localStorage.removeItem(USERNAME_KEY);
};

// Initialisation du client Octokit
const getOctokit = () => {
    const { token } = getAuth();
    return new Octokit({
        auth: token,
        userAgent: 'MyGameLauncher/1.0.0'
    });
};

/**
 * Récupère tous les dépôts publics de l'utilisateur qui ont des releases.
 */
export const fetchGameRepos = async (username) => {
    const octokit = getOctokit();
    try {
        const { data: repos } = await octokit.request('GET /users/{username}/repos', {
            username,
            sort: 'updated',
            per_page: 100
        });

        // Filtrer pour ne garder que ceux qui ont des releases ?
        // Pour optimisation, on peut le faire en lazy loading ou juste afficher tous les repos
        // Pour l'instant, on renvoie une liste enrichie

        const games = await Promise.all(repos.map(async (repo) => {
            try {
                const { data: latestRelease } = await octokit.request('GET /repos/{owner}/{repo}/releases/latest', {
                    owner: username,
                    repo: repo.name
                });
                return { ...repo, latestRelease };
            } catch (e) {
                // Pas de release trouvée, on retourne quand même le repo
                return { ...repo, latestRelease: null };
            }
        }));

        return games;
    } catch (error) {
        console.error("Erreur fetch repos:", error);
        throw error;
    }
};

/**
 * Upload une nouvelle version (Release)
 */
export const uploadGameVersion = async (repoName, versionTag, file, description) => {
    const { username, token } = getAuth();
    if (!token) throw new Error("Authentification requise pour l'upload");

    const octokit = getOctokit();

    // 1. Créer la Release (ou récupérer l'existante si elle a déjà été créée lors d'un essai précédent)
    let release;
    try {
        const { data } = await octokit.request('POST /repos/{owner}/{repo}/releases', {
            owner: username,
            repo: repoName,
            tag_name: versionTag,
            name: `Version ${versionTag}`,
            body: description || "Nouvelle version uploadée via Game Launcher",
            draft: false,
            prerelease: false
        });
        release = data;
    } catch (error) {
        // Si la release existe déjà (erreur 422), on la récupère pour uploader le fichier dedans
        if (error.status === 422) {
            const { data } = await octokit.request('GET /repos/{owner}/{repo}/releases/tags/{tag}', {
                owner: username,
                repo: repoName,
                tag: versionTag
            });
            release = data;
        } else {
            throw error;
        }
    }

    // 2. Upload l'asset (le .zip)
    // On utilise fetch direct pour éviter les soucis de CORS que Octokit peut provoquer dans le navigateur
    // L'upload direct depuis le navigateur vers uploads.github.com est souvent bloqué par CORS.
    // On tente le coup, et si ça échoue, on renverra la release créée pour que l'utilisateur puisse finir manuellement.

    const uploadUrl = release.upload_url.split('{')[0] + `?name=${encodeURIComponent(file.name)}&label=Game%20Build`;

    try {
        const fileData = await file.arrayBuffer();
        const response = await fetch(uploadUrl, {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/zip',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: fileData
        });

        if (!response.ok) {
            // Si c'est une 404 ou 400+, on considère ça comme une erreur, mais on garde la release
            console.warn("Echec upload auto:", response.status);
            return { success: false, release, error: `Erreur ${response.status}` };
        }

        return { success: true, release };

    } catch (uploadError) {
        console.warn("Blocage CORS ou réseau sur l'upload:", uploadError);
        // C'est ici que l'erreur CORS atterrit (NetworkError)
        return { success: false, release, error: "Upload bloqué par le navigateur (CORS)" };
    }
};
