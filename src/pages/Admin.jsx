import React, { useState, useEffect } from 'react';
import { getAuth, setAuth, clearAuth, fetchGameRepos, uploadGameVersion } from '../lib/github';
import { Upload, LogIn, Check, AlertCircle, Loader2, Github } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Admin() {
    const [auth, setAuthState] = useState(getAuth());
    const [games, setGames] = useState([]);
    const [selectedGame, setSelectedGame] = useState('');
    const [file, setFile] = useState(null);
    const [version, setVersion] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState({ type: '', msg: '' });

    // Effet pour charger les jeux une fois connecté
    useEffect(() => {
        if (auth.token && auth.username) {
            fetchGameRepos(auth.username)
                .then(setGames)
                .catch(err => setStatus({ type: 'error', msg: "Impossible de charger vos dépôts. Vérifiez votre token." }));
        }
    }, [auth]);

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
        setStatus({ type: '', msg: '' });

        try {
            await uploadGameVersion(selectedGame, version, file, "Mise à jour via Web Launcher");
            setStatus({ type: 'success', msg: `Version ${version} uploadée avec succès sur GitHub !` });
            setFile(null);
            setVersion('');
        } catch (err) {
            console.error(err);
            setStatus({ type: 'error', msg: "Erreur lors de l'upload: " + err.message });
        } finally {
            setLoading(false);
        }
    };

    const onDragOver = (e) => e.preventDefault();
    const onDrop = (e) => {
        e.preventDefault();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const droppedFile = e.dataTransfer.files[0];
            if (droppedFile.name.endsWith('.zip')) {
                setFile(droppedFile);
                // Tentative d'auto-détection de version (ex: game-v1.0.2.zip)
                const versionMatch = droppedFile.name.match(/v?(\d+\.\d+\.\d+)/);
                if (versionMatch) setVersion('v' + versionMatch[1]);
            } else {
                setStatus({ type: 'error', msg: "Seuls les fichiers .zip sont acceptés." });
            }
        }
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
                        <input name="username" placeholder="ex: LefebvreCode" required className="w-full mt-1 px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-indigo-300 uppercase ml-1">Token d'Accès (PAT)</label>
                        <input name="token" type="password" placeholder="ghp_xxxxxxxxxxxx" required className="w-full mt-1 px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white focus:outline-none focus:border-indigo-500 transition-colors" />
                        <a href="https://github.com/settings/tokens" target="_blank" className="text-xs text-gray-500 hover:text-white mt-2 inline-block">Créer un token ici →</a>
                    </div>
                    <button type="submit" className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2">
                        <LogIn className="w-4 h-4" /> Se connecter
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto space-y-8">
            <div className="flex items-center justify-between pb-6 border-b border-white/10">
                <div>
                    <h1 className="text-3xl font-bold text-white">Upload de Jeu</h1>
                    <p className="text-gray-400">Connecté en tant que <span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{auth.username}</span></p>
                </div>
                <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300">Déconnexion</button>
            </div>

            <form onSubmit={handleUpload} className="space-y-6">
                {/* Sélecteur de Jeu */}
                <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">Sélectionner le projet</label>
                    <select
                        value={selectedGame}
                        onChange={e => setSelectedGame(e.target.value)}
                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-indigo-500 appearance-none"
                        required
                    >
                        <option value="">-- Choisir un dépôt GitHub --</option>
                        {games.map(g => (
                            <option key={g.id} value={g.name}>{g.name} (Dernière: {g.latestRelease?.tag_name || 'Aucune'})</option>
                        ))}
                    </select>
                </div>

                {/* Zone de Drop */}
                <div
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    className={`border-2 border-dashed rounded-2xl p-10 text-center transition-all ${file ? 'border-green-500 bg-green-500/10' : 'border-white/20 hover:border-indigo-500 hover:bg-white/5'}`}
                >
                    <input type="file" id="zip-upload" className="hidden" accept=".zip" onChange={e => {
                        if (e.target.files[0]) {
                            setFile(e.target.files[0]);
                            const versionMatch = e.target.files[0].name.match(/v?(\d+\.\d+\.\d+)/);
                            if (versionMatch) setVersion('v' + versionMatch[1]);
                        }
                    }} />

                    <label htmlFor="zip-upload" className="cursor-pointer flex flex-col items-center gap-4">
                        {file ? (
                            <>
                                <div className="p-4 bg-green-500 rounded-full shadow-lg shadow-green-500/20">
                                    <Check className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-bold text-white">{file.name}</p>
                                    <p className="text-sm text-green-400">Prêt à uploader</p>
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="p-4 bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/20">
                                    <Upload className="w-8 h-8 text-white" />
                                </div>
                                <div>
                                    <p className="text-lg font-medium text-white">Glisser-déposer votre .zip ici</p>
                                    <p className="text-sm text-gray-500 mt-1">ou cliquez pour parcourir</p>
                                </div>
                            </>
                        )}
                    </label>
                </div>

                {/* Version Manuelle */}
                <AnimatePresence>
                    {file && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">Version du patch</label>
                                <input
                                    value={version}
                                    onChange={e => setVersion(e.target.value)}
                                    placeholder="v1.0.0"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white font-mono"
                                    required
                                />
                            </div>

                            <button
                                disabled={loading}
                                type="submit"
                                className={`w-full py-4 rounded-xl font-bold text-lg shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-3 transition-all ${loading ? 'bg-gray-600 cursor-not-allowed' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] text-white'}`}
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <Upload />}
                                {loading ? 'Publication en cours...' : 'Publier la Release'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Messages de Status */}
                {status.msg && (
                    <div className={`p-4 rounded-xl flex items-center gap-3 ${status.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                        {status.type === 'error' ? <AlertCircle /> : <Check />}
                        {status.msg}
                    </div>
                )}

            </form>
        </div>
    );
}
