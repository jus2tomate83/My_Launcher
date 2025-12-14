import React, { useState, useEffect } from 'react';
import { getAuth, setAuth, clearAuth, fetchGameRepos, uploadGameVersion } from '../lib/github';
import { Upload, LogIn, Check, AlertCircle, Loader2, Github, Package, Calendar, Download, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin() {
    const [auth, setAuthState] = useState(getAuth());
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);

    // États pour l'upload
    const [selectedGame, setSelectedGame] = useState(null); // Objet complet du jeu sélectionné
    const [file, setFile] = useState(null);
    const [version, setVersion] = useState('');
    const [uploadStatus, setUploadStatus] = useState({ type: '', msg: '' });

    // Effet pour charger les jeux une fois connecté
    useEffect(() => {
        if (auth.token && auth.username) {
            loadGames();
        }
    }, [auth]);

    const loadGames = () => {
        setLoading(true);
        fetchGameRepos(auth.username)
            .then(setGames)
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const username = data.get('username');
        const token = data.get('token');

        setAuth(username, token);
        setAuthState({ username, token });
    };

    const handleLogout = () => {
        clearAuth();
        setAuthState({ token: null, username: null });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !selectedGame || !version) return;

        setLoading(true);
        setUploadStatus({ type: '', msg: '' });

        try {
            const result = await uploadGameVersion(selectedGame.name, version, file, "Mise à jour via Web Launcher");

            if (result.success) {
                setUploadStatus({ type: 'success', msg: `Version ${version} uploadée avec succès !` });
                setFile(null);
                setVersion('');
                loadGames(); // Recharger la liste pour mettre à jour la version affichée
            } else {
                setUploadStatus({
                    type: 'warning',
                    msg: (
                        <span>
                            Release créée, mais l'upload auto a été bloqué par le navigateur.
                            <a href={result.release.html_url} target="_blank" className="underline font-bold ml-1">
                                Cliquez ici pour ajouter le fichier ZIP manuellement.
                            </a>
                        </span>
                    )
                });
            }
        } catch (err) {
            console.error(err);
            setUploadStatus({ type: 'error', msg: "Erreur critique: " + err.message });
        } finally {
            setLoading(false);
        }
    };

    // Helper pour formater la date
    const formatDate = (dateString) => {
        if (!dateString) return 'Jamais';
        return new Date(dateString).toLocaleDateString();
    };

    if (!auth.token) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <div className="flex flex-col items-center gap-4 mb-8">
                    <div className="p-3 bg-white/10 rounded-full">
                        <Github className="w-8 h-8 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-white">Connexion Admin</h2>
                    <p className="text-sm text-gray-400 text-center">
                        Entrez votre nom d'utilisateur et un Token d'accès personnel (Classic) avec les droits `repo`.
                    </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-indigo-300 uppercase ml-1">Nom d'utilisateur GitHub</label>
                        <input name="username" placeholder="ex: jus2tomate83" required className="w-full mt-1 px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-300 uppercase ml-1">Token d'Accès (PAT)</label>
                        <input name="token" type="password" placeholder="ghp_xxxxxxxxxxxx" required className="w-full mt-1 px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                        <LogIn className="w-4 h-4" /> Se connecter
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-bold text-white">Tableau de Bord</h1>
                    <p className="text-gray-400">Gérez vos projets et publiez des mises à jours.</p>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-white font-mono bg-white/10 px-3 py-1 rounded-full text-sm">{auth.username}</span>
                    <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Déconnexion</button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Colonne de Gauche : Liste des Projets */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-400" /> Vos Projets GitHub
                    </h2>

                    <div className="grid gap-4">
                        {loading && <div className="text-center py-10 text-gray-500">Chargement des données GitHub...</div>}

                        {!loading && games.map(game => (
                            <div
                                key={game.id}
                                onClick={() => {
                                    setSelectedGame(game);
                                    setUploadStatus({ type: '', msg: '' });
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className={`p-4 rounded-xl border cursor-pointer transition-all flex items-center justify-between group ${selectedGame?.id === game.id ? 'bg-indigo-600/10 border-indigo-500' : 'bg-gray-900/40 border-white/5 hover:border-white/20'}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-xl font-bold text-white/20">
                                        {game.name.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className={`font-bold ${selectedGame?.id === game.id ? 'text-indigo-300' : 'text-white'}`}>{game.name}</h3>
                                        <p className="text-sm text-gray-500 line-clamp-1">{game.description || "Pas de description"}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-4 text-sm text-gray-400">
                                    <div className="flex items-col text-right">
                                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {formatDate(game.updated_at)}</span>
                                        <span className="flex items-center gap-1 ml-auto text-indigo-400 bg-indigo-400/10 px-2 rounded mt-1">
                                            {game.latestRelease?.tag_name || 'v0.0.0'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Colonne de Droite : Action (Upload / Détails) */}
                <div className="lg:col-span-1">
                    <div className="sticky top-24 space-y-6">

                        {selectedGame ? (
                            <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur-sm">
                                <div className="flex items-start justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">{selectedGame.name}</h3>
                                        <a href={selectedGame.html_url} target="_blank" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 mt-1">
                                            Voir sur GitHub <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                    {selectedGame.latestRelease && (
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500 uppercase font-bold">Dernière version</div>
                                            <div className="text-xl font-mono text-white">{selectedGame.latestRelease.tag_name}</div>
                                        </div>
                                    )}
                                </div>

                                <hr className="border-white/5 mb-6" />

                                <h4 className="font-bold text-white mb-4 flex items-center gap-2"><Upload className="w-4 h-4" /> Publier une mise à jour</h4>

                                <form onSubmit={handleUpload} className="space-y-4">
                                    {/* Zone de Drop Mini */}
                                    <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${file ? 'border-green-500 bg-green-500/5' : 'border-white/20 hover:border-indigo-500 hover:bg-white/5'}`}>
                                        <input type="file" id="zip-upload" className="hidden" accept=".zip" onChange={e => {
                                            if (e.target.files[0]) {
                                                setFile(e.target.files[0]);
                                                const versionMatch = e.target.files[0].name.match(/v?(\d+\.\d+\.\d+)/);
                                                if (versionMatch) setVersion('v' + versionMatch[1]);
                                            }
                                        }} />
                                        <label htmlFor="zip-upload" className="cursor-pointer block">
                                            {file ? (
                                                <div>
                                                    <p className="font-bold text-green-400 truncate">{file.name}</p>
                                                    <p className="text-xs text-gray-500">Prêt à uploader</p>
                                                </div>
                                            ) : (
                                                <div>
                                                    <span className="text-indigo-400 font-bold">Choisir un fichier .ZIP</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-gray-400 uppercase">Version</label>
                                        <input
                                            value={version}
                                            onChange={e => setVersion(e.target.value)}
                                            placeholder="v1.0.1"
                                            className="w-full mt-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-white font-mono focus:border-indigo-500 outline-none"
                                        />
                                    </div>

                                    <button
                                        disabled={loading || !file}
                                        className={`w-full py-3 rounded-lg font-bold transition-all ${loading || !file ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'}`}
                                    >
                                        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Publier la version'}
                                    </button>
                                </form>

                                {/* Status Message */}
                                {uploadStatus.msg && (
                                    <div className={`mt-4 p-3 rounded-lg text-sm border ${uploadStatus.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : uploadStatus.type === 'warning' ? 'bg-orange-500/10 border-orange-500/20 text-orange-400' : 'bg-green-500/10 border-green-500/20 text-green-400'}`}>
                                        {uploadStatus.msg}
                                    </div>
                                )}

                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 border border-dashed border-white/10 rounded-2xl text-gray-500">
                                <Package className="w-12 h-12 mb-4 opacity-50" />
                                <p>Sélectionnez un projet dans la liste pour voir les détails et uploader des fichiers.</p>
                            </div>
                        )}

                    </div>
                </div>

            </div>
        </div>
    );
}
