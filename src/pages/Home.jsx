import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchGameRepos } from '../lib/github';
import { Download, Star, Info, X, Calendar, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Home() {
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedGame, setSelectedGame] = useState(null); // Pour la modale

    const USERNAME = "jus2tomate83";

    useEffect(() => {
        async function loadGames() {
            try {
                const data = await fetchGameRepos(USERNAME);
                setGames(data);
            } catch (err) {
                setError("Impossible de charger les jeux.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
        loadGames();
    }, []);

    if (loading) return <div className="min-h-screen text-white flex items-center justify-center"><div className="animate-pulse">Chargement de la bibliothèque...</div></div>;
    if (error) return <div className="min-h-screen text-red-500 flex items-center justify-center">{error}</div>;

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-20">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <h1 className="text-4xl font-black text-white tracking-tighter">BIBLIOTHÈQUE</h1>
                <div className="text-sm font-mono text-gray-500">{games.length} JEUX DISPONIBLES</div>
            </div>

            {games.length === 0 ? (
                <div className="text-center py-20 bg-white/5 rounded-3xl border border-white/5">
                    <p className="text-gray-400 text-lg">Aucun jeu disponible pour le moment.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {games
                        .filter(game => game.latestRelease)
                        .map((game, i) => (
                            <GameCard key={game.id} game={game} index={i} onClick={() => setSelectedGame(game)} />
                        ))}
                </div>
            )}

            {/* MODALE DÉTAILS / PATCH NOTES */}
            <AnimatePresence>
                {selectedGame && (
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
                        onClick={() => setSelectedGame(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-gray-900 border border-white/10 w-full max-w-2xl max-h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header Image */}
                            <div className="h-48 relative shrink-0">
                                <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(https://raw.githubusercontent.com/${selectedGame.owner.login}/${selectedGame.name}/main/cover.jpg?t=${new Date(selectedGame.updated_at).getTime()})` }} />
                                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
                                <button onClick={() => setSelectedGame(null)} className="absolute top-4 right-4 p-2 bg-black/50 rounded-full text-white hover:bg-white/20 transition-colors">
                                    <X className="w-5 h-5" />
                                </button>
                                <div className="absolute bottom-4 left-6">
                                    <h2 className="text-3xl font-bold text-white shadow-black drop-shadow-lg">{getDisplayName(selectedGame)}</h2>
                                </div>
                            </div>

                            {/* Content Scrollable */}
                            <div className="p-6 overflow-y-auto space-y-6 flex-1">

                                {/* Téléchargement & Info Rapide */}
                                <div className="flex flex-wrap gap-4 items-center justify-between bg-white/5 p-4 rounded-xl border border-white/5">
                                    <div className="flex items-center gap-3">
                                        <div className="font-mono text-indigo-400 bg-indigo-400/10 px-3 py-1 rounded-lg border border-indigo-400/20">
                                            {selectedGame.latestRelease?.tag_name}
                                        </div>
                                        <div className="text-sm text-gray-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {new Date(selectedGame.latestRelease?.published_at).toLocaleDateString()}
                                        </div>
                                    </div>

                                    {selectedGame.latestRelease?.assets?.[0] ? (
                                        <a
                                            href={selectedGame.latestRelease.assets[0].browser_download_url}
                                            className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-lg shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all hover:scale-105"
                                        >
                                            <Download className="w-4 h-4" /> Télécharger
                                        </a>
                                    ) : (
                                        <span className="text-gray-500 text-sm">Téléchargement indisponible</span>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-2">Description</h3>
                                    <p className="text-gray-300 leading-relaxed">
                                        {selectedGame.description || "Aucune description."}
                                    </p>
                                </div>

                                {/* Patch Notes */}
                                <div>
                                    <h3 className="text-sm font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                        Patch Notes <span className="text-xs bg-white/10 px-2 rounded-full text-gray-500">v{selectedGame.latestRelease?.tag_name?.replace('v', '')}</span>
                                    </h3>
                                    <div className="bg-black/30 p-4 rounded-xl border border-white/5 text-sm text-gray-300 font-mono whitespace-pre-wrap">
                                        {selectedGame.latestRelease?.body || "Aucune note de mise à jour pour cette version."}
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Logic extracted for reuse
function getDisplayName(game) {
    let displayName = game.name;
    if (game.latestRelease?.assets?.[0]?.name) {
        displayName = game.latestRelease.assets[0].name.replace(/\.[^/.]+$/, "");
    }
    return displayName.replace(/[-_]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function GameCard({ game, index, onClick }) {
    const displayName = getDisplayName(game);
    // Cache bust image with updated_at timestamp
    const coverUrl = `https://raw.githubusercontent.com/${game.owner.login}/${game.name}/main/cover.jpg?t=${new Date(game.updated_at).getTime()}`;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={onClick}
            className="group relative bg-gray-900 border border-white/10 rounded-2xl overflow-hidden hover:border-indigo-500/50 transition-all cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-1"
        >
            <div className="aspect-video bg-gray-800 relative overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${coverUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-80" />

                <div className="absolute bottom-4 left-4 right-4">
                    <h3 className="text-xl font-bold text-white group-hover:text-indigo-400 transition-colors truncate">{displayName}</h3>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs font-mono bg-white/10 text-white px-2 py-0.5 rounded">
                            {game.latestRelease?.tag_name || 'v0.0'}
                        </span>
                        <p className="text-xs text-gray-400 line-clamp-1">{game.description}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 bg-gray-900 border-t border-white/5 flex items-center justify-between group-hover:bg-gray-800 transition-colors">
                <span className="text-xs font-bold text-gray-500 flex items-center gap-1 group-hover:text-indigo-400">
                    <Info className="w-3 h-3" /> DÉTAILS & PATCH NOTES
                </span>
                <Download className="w-4 h-4 text-gray-600 group-hover:text-white transition-colors" />
            </div>
        </motion.div>
    );
}
