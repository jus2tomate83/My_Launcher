import React, { useState, useEffect } from 'react';
import { getAuth, setAuth, clearAuth, fetchGameRepos, uploadGameVersion } from '../lib/github';
import { Upload, LogIn, Check, AlertCircle, Loader2, Github, Package, Calendar, Download, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin() {
    const [auth, setAuthState] = useState(getAuth());
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);

    // États pour l'upload
    const [selectedGame, setSelectedGame] = useState(null);
    const [file, setFile] = useState(null);
    const [version, setVersion] = useState('');
    const [customGameName, setCustomGameName] = useState(''); // Nouveau state pour le nom
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

    // Utilitaire pour renommer un fichier
    const renameFile = (originalFile, newName) => {
        return new File([originalFile], newName, {
            type: originalFile.type,
            lastModified: originalFile.lastModified,
        });
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !selectedGame || !version || !customGameName) return;

        setLoading(true);
        setUploadStatus({ type: '', msg: '' });

        // Renommage du fichier avec le nom choisi par l'utilisateur
        // On s'assure qu'il finit par .zip
        const finalName = customGameName.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') + '.zip';
        const renamedFile = renameFile(file, finalName);

        try {
            const result = await uploadGameVersion(selectedGame.name, version, renamedFile, `Version ${version} - ${customGameName}`);

            if (result.success) {
                setUploadStatus({ type: 'success', msg: `Version ${version} de "${customGameName}" uploadée !` });
                setFile(null);
                setVersion('');
                loadGames();
            } else {
                setUploadStatus({
                    type: 'warning',
                    msg: (
                        <span>
                            Release créée, mais l'upload auto bloqué.
                            <a href={result.release.html_url} target="_blank" className="underline font-bold ml-1">
                                Cliquez ici pour mettre le ZIP ({finalName}) manuellement.
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
        <div className="flex h-[calc(100vh-80px)]">
            {/* Sidebar Compacte */}
            <div className="w-80 border-r border-white/10 flex flex-col bg-gray-900/40">
                <div className="p-4 border-b border-white/10">
                    <h2 className="text-lg font-bold text-white flex items-center gap-2">
                        <Package className="w-5 h-5 text-indigo-400" /> Projets
                    </h2>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                    {loading && <div className="text-center py-4 text-xs text-gray-500">Chargement...</div>}
                    {games.map(game => (
                        <button
                            key={game.id}
                            onClick={() => {
                                setSelectedGame(game);
                                setCustomGameName(game.name); // Pré-remplir avec le nom du repo
                                setUploadStatus({ type: '', msg: '' });
                            }}
                            className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-white/5 ${selectedGame?.id === game.id ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'border-transparent text-gray-400'}`}
                        >
                            <div className="font-bold truncate">{game.name}</div>
                            <div className="text-xs opacity-50 flex justify-between mt-1">
                                <span>{game.latestRelease?.tag_name || 'v0.0.0'}</span>
                                <span>{new Date(game.updated_at).toLocaleDateString()}</span>
                            </div>
                        </button>
                    ))}
                </div>
                <div className="p-4 border-t border-white/10 bg-black/20">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{auth.username}</span>
                        <button onClick={() => { clearAuth(); setAuthState({ token: null }); }} className="text-red-400 hover:underline">Déconnexion</button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto p-8 bg-black/10">
                {!selectedGame ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <Package className="w-24 h-24 mb-4 stroke-1" />
                        <p className="text-xl">Sélectionnez un projet à gauche pour commencer</p>
                    </div>
                ) : (
                    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-3xl font-bold text-white mb-2">{selectedGame.name}</h1>
                                <a href={selectedGame.html_url} target="_blank" className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 text-sm">
                                    <ExternalLink className="w-3 h-3" /> Voir le dépôt GitHub
                                </a>
                            </div>
                        </div>

                        <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Upload className="w-5 h-5 text-indigo-400" /> Nouvelle Version
                            </h2>

                            <form onSubmit={handleUpload} className="space-y-6">

                                {/* 1. Sélection Fichier */}
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5'}`}>
                                    <input type="file" id="zip-upload" className="hidden" accept=".zip" onChange={e => {
                                        if (e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                            // Auto detection version
                                            const versionMatch = e.target.files[0].name.match(/v?(\d+\.\d+\.\d+)/);
                                            if (versionMatch) setVersion('v' + versionMatch[1]);
                                        }
                                    }} />
                                    <label htmlFor="zip-upload" className="cursor-pointer block">
                                        {file ? (
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 text-white">
                                                    <Check className="w-6 h-6" />
                                                </div>
                                                <p className="font-bold text-green-400 text-lg">{file.name}</p>
                                                <p className="text-sm text-gray-500">Cliquez pour changer</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-2 text-indigo-400">
                                                    <Upload className="w-6 h-6" />
                                                </div>
                                                <div className="text-lg font-medium text-white">Glisser un fichier .ZIP</div>
                                                <div className="text-sm text-gray-500">ou cliquez pour parcourir</div>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    {/* 2. Nom du Jeu (Affichage) */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom du Jeu (Affichage)</label>
                                        <input
                                            value={customGameName}
                                            onChange={e => setCustomGameName(e.target.value)}
                                            placeholder="Ex: Super Mario"
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                            required
                                        />
                                        <p className="text-[10px] text-gray-500 mt-1">C'est ce nom qui s'affichera sur l'accueil.</p>
                                    </div>

                                    {/* 3. Version */}
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Version</label>
                                        <input
                                            value={version}
                                            onChange={e => setVersion(e.target.value)}
                                            placeholder="v1.0.0"
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono outline-none focus:border-indigo-500 transition-colors"
                                            required
                                        />
                                    </div>
                                </div>

                                <button
                                    disabled={loading || !file}
                                    className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all ${loading || !file ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] text-white'}`}
                                >
                                    {loading ? <Loader2 className="animate-spin" /> : <Upload className="w-5 h-5" />}
                                    {loading ? 'Publication...' : 'Publier'}
                                </button>
                            </form>

                            {uploadStatus.msg && (
                                <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${uploadStatus.type === 'error' ? 'bg-red-500/10 text-red-400' : uploadStatus.type === 'warning' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                                    {uploadStatus.type === 'warning' ? <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /> : null}
                                    <div className="text-sm">{uploadStatus.msg}</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
