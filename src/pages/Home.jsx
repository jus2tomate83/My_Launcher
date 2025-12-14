import React, { useEffect, useState } from 'react';
import { fetchGameRepos } from '../lib/github';
import { Download, Star, GitBranch, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // TODO: Rendre configurable via UI ou fichier de config
    const USERNAME = "jus2tomate83"; // Placeholder, devra être dynamique un jour

    useEffect(() => {
        async function loadGames() {
            try {
                setLoading(true);
                // On essaye de charger les jeux. Si l'utilisateur n'a pas configuré son username, ça plantera peut-être.
                // Pour la démo initiale on va demander à l'utilisateur son pseudo github.
                const repos = await fetchGameRepos(USERNAME).catch(() => []); // Fail safe pour l'instant
                setGames(repos);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        loadGames();
    }, []);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh]">
                <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                <p className="mt-4 text-gray-400">Chargement de la bibliothèque...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-4xl font-bold text-white tracking-tight">Bibliothèque</h1>
                <p className="text-gray-400">Découvrez et téléchargez mes derniers projets.</p>
            </div>

            {games.length === 0 ? (
                <div className="p-12 border border-dashed border-white/10 rounded-2xl bg-white/5 text-center">
                    <h3 className="text-xl font-medium text-white">Aucun jeu trouvé</h3>
                    <p className="text-gray-400 mt-2">
                        Assurez-vous d'avoir des dépôts publics sur GitHub avec des "Releases" publiées.
                        <br />
                        (Ou configurez votre nom d'utilisateur GitHub dans le code).
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {games
                        .filter(game => game.latestRelease) // On affiche seulement les jeux téléchargeables sur l'accueil
                        .map((game, i) => (
                            <GameCard key={game.id} game={game} index={i} />
                        ))}
                </div>
            )}
        </div>
    );
}

function GameCard({ game, index }) {
    const latestVersion = game.latestRelease?.tag_name || 'v0.0.0';
    const downloadUrl = game.latestRelease?.assets?.[0]?.browser_download_url;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="group relative bg-gray-900/50 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-colors"
        >
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative overflow-hidden">
                {/* Placeholder image si pas d'image détectée. Idéalement on chercherait un fichier social preview dans le repo */}
                <div className="absolute inset-0 bg-cover bg-center opacity-40 group-hover:scale-105 transition-transform duration-500" style={{ backgroundImage: `url(https://github.com/${game.owner.login}/${game.name}/raw/main/cover.jpg)` }} />
                <span className="text-4xl font-black text-white/5 uppercase select-none absolute">Game</span>
            </div>

            <div className="p-5 space-y-4">
                <div>
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors">{game.name}</h3>
                    <p className="text-sm text-gray-400 line-clamp-2 mt-1">{game.description || "Aucune description fournie."}</p>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <div className="flex items-center gap-3 text-xs text-gray-500 font-mono">
                        <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {latestVersion}</span>
                        <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {game.stargazers_count}</span>
                    </div>

                    {downloadUrl ? (
                        <a
                            href={downloadUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/20"
                        >
                            <Download className="w-4 h-4" />
                            Télécharger
                        </a>
                    ) : (
                        <span className="text-xs text-gray-600 uppercase font-bold px-2 py-1 rounded bg-white/5">Bientôt</span>
                    )}
                </div>
            </div>
        </motion.div>
    );
}
