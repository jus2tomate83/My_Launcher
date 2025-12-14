import React, { useState, useEffect } from 'react';
import { getAuth, setAuth, clearAuth, fetchGameRepos, uploadGameVersion, createGameRepo, uploadFileToRepo, fetchAllGameStats } from '../lib/github';
import { Upload, LogIn, Check, AlertCircle, Loader2, Github, Package, Calendar, ExternalLink, Plus, Image as ImageIcon, Search, Trash2, PieChart, BarChart3, TrendingUp } from 'lucide-react';

export default function Admin() {
    const [auth, setAuthState] = useState(getAuth());
    const [games, setGames] = useState([]);
    const [loading, setLoading] = useState(false);
    const [creating, setCreating] = useState(false);

    // Stats State
    const [stats, setStats] = useState([]);
    const [loadingStats, setLoadingStats] = useState(false);

    // Vue: 'list' | 'create' | 'stats'
    const [view, setView] = useState('list');

    // États Upload
    const [selectedGame, setSelectedGame] = useState(null);
    const [file, setFile] = useState(null);
    const [coverFile, setCoverFile] = useState(null);
    const [version, setVersion] = useState('');
    const [changelog, setChangelog] = useState(''); // Patch Notes
    const [customGameName, setCustomGameName] = useState('');
    const [uploadStatus, setUploadStatus] = useState({ type: '', msg: '' });

    // États Création Projet
    const [newProject, setNewProject] = useState({ name: '', description: '', cover: null });

    useEffect(() => {
        if (auth.token && auth.username) {
            loadGames();
        }
    }, [auth]);

    // Charger les stats quand on change de vue vers 'stats'
    useEffect(() => {
        if (view === 'stats' && auth.username) {
            loadStats();
        }
    }, [view]);

    const loadGames = () => {
        setLoading(true);
        fetchGameRepos(auth.username)
            .then(repos => {
                setGames(repos);
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    const loadStats = () => {
        setLoadingStats(true);
        fetchAllGameStats(auth.username)
            .then(data => setStats(data))
            .catch(err => console.error(err))
            .finally(() => setLoadingStats(false));
    };

    const handleLogin = (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const username = data.get('username').trim();
        const token = data.get('token').trim();

        if (username.toLowerCase() !== 'jus2tomate83') {
            alert("Accès Refusé. Seul l'administrateur du site (jus2tomate83) peut accéder à ce panneau.");
            return;
        }

        setAuth(username, token);
        setAuthState({ username, token });
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            // 1. Créer le repo
            const repoName = newProject.name.trim().replace(/\s+/g, '-').toLowerCase();
            const repo = await createGameRepo(repoName, newProject.description);

            // 2. Upload cover si présente
            if (newProject.cover) {
                await uploadFileToRepo(repoName, 'cover.jpg', newProject.cover, "Add cover image");
            }

            setCreating(false);
            setView('list');
            setNewProject({ name: '', description: '', cover: null });
            loadGames();

            setSelectedGame({ ...repo, name: repoName, latestRelease: null });
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error(err);
            alert("Erreur création: " + err.message);
            setCreating(false);
        }
    };

    // Utilitaire pour renommer un fichier (hack pour garder le type)
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

        // Renommage du zip
        const finalName = customGameName.trim().replace(/[^a-zA-Z0-9-_ ]/g, '') + '.zip';
        const renamedFile = renameFile(file, finalName);

        try {
            // 1. Upload de la nouvelle cover si présente
            if (coverFile) {
                await uploadFileToRepo(selectedGame.name, 'cover.jpg', coverFile, `Update cover for v${version}`);
            }

            // 2. Création Release & Upload Zip
            // On utilise le changelog (Patch Notes) comme description de la release
            const releaseBody = changelog || `Version ${version} - ${customGameName}`;
            const result = await uploadGameVersion(selectedGame.name, version, renamedFile, releaseBody);

            if (result.success) {
                setUploadStatus({ type: 'success', msg: `Version ${version} de "${customGameName}" uploadée !` });
                setFile(null);
                setCoverFile(null);
                setVersion('');
                setChangelog(''); // Reset changelog
                // setCustomGameName(''); // On garde le nom
                loadGames();
            } else {
                setUploadStatus({
                    type: 'warning',
                    msg: (
                        <span>
                            Release créée, mais CORS bloqué.
                            <a href={result.release.html_url} target="_blank" className="underline font-bold ml-1">
                                Finir l'upload manuellement
                            </a>
                        </span>
                    )
                });
            }
        } catch (err) {
            setUploadStatus({ type: 'error', msg: "Erreur: " + err.message });
        } finally {
            setLoading(false);
        }
    };

    // Login View
    if (!auth.token) {
        return (
            <div className="max-w-md mx-auto mt-20 p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
                <h2 className="text-2xl font-bold text-white mb-6 text-center">Connexion Admin</h2>
                <form onSubmit={handleLogin} className="space-y-4">
                    <input name="username" placeholder="Username GitHub" required className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white" />
                    <input name="token" type="password" placeholder="Token (ghp_...)" required className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg text-white" />
                    <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg">Connexion</button>
                </form>
            </div>
        );
    }

    return (
        <div className="flex h-[calc(100vh-80px)]">

            {/* SIDEBAR */}
            <div className="w-80 bg-gray-900/40 border-r border-white/10 flex flex-col">
                <div className="p-4 border-b border-white/10 flex items-center justify-between sticky top-0 bg-gray-900/95 backdrop-blur z-10">
                    <h2 className="font-bold text-white flex items-center gap-2"><Package className="w-5 h-5 text-indigo-400" /> Projets</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setView('stats')} className={`p-1.5 rounded-lg transition-colors ${view === 'stats' ? 'bg-indigo-600/50 text-white' : 'hover:bg-indigo-600/30 text-indigo-300'}`} title="Statistiques">
                            <BarChart3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setView('create')} className="p-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white transition-colors" title="Nouveau Projet">
                            <Plus className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {loading && <div className="text-center py-4 text-xs text-gray-500">Chargement...</div>}
                    {games.map(game => (
                        <button
                            key={game.id}
                            onClick={() => { setSelectedGame(game); setView('list'); setUploadStatus({ type: '', msg: '' }); }}
                            className={`w-full text-left p-3 rounded-lg border transition-all hover:bg-white/5 ${selectedGame?.id === game.id && view === 'list' ? 'bg-indigo-600/20 border-indigo-500/50 text-white' : 'border-transparent text-gray-400'}`}
                        >
                            <div className="font-bold truncate">{game.name}</div>
                        </button>
                    ))}
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20 text-xs text-gray-500 flex justify-between">
                    <span>{auth.username}</span>
                    <button onClick={() => { clearAuth(); setAuthState({ token: null }); }} className="text-red-400 hover:underline">LogOut</button>
                </div>
            </div>

            {/* MAIN CONTENT Area */}
            <div className="flex-1 overflow-y-auto bg-black/10 p-8">

                {/* VIEW: STATS */}
                {view === 'stats' && (
                    <div className="max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 space-y-8">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400">
                                <TrendingUp className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white">Statistiques de Téléchargement</h1>
                                <p className="text-gray-400">Suivi des performances de vos jeux</p>
                            </div>
                        </div>

                        {loadingStats ? (
                            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 text-indigo-400 animate-spin" /></div>
                        ) : (
                            <>
                                {/* Global Stats Card */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur">
                                        <div className="text-gray-400 text-sm font-bold uppercase mb-2">Total Téléchargements</div>
                                        <div className="text-4xl font-black text-white">
                                            {stats.reduce((acc, curr) => acc + curr.totalDownloads, 0)}
                                        </div>
                                    </div>
                                    <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur">
                                        <div className="text-gray-400 text-sm font-bold uppercase mb-2">Jeu le plus populaire</div>
                                        <div className="text-xl font-bold text-indigo-400 truncate">
                                            {stats[0]?.totalDownloads > 0 ? stats[0].name : 'Aucun'}
                                        </div>
                                        {stats[0] && <div className="text-xs text-gray-500 mt-1">{stats[0].totalDownloads} téléchargements</div>}
                                    </div>
                                    <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-6 backdrop-blur">
                                        <div className="text-gray-400 text-sm font-bold uppercase mb-2">Nombre de Projets</div>
                                        <div className="text-4xl font-black text-white">{stats.length}</div>
                                    </div>
                                </div>

                                {/* Table */}
                                <div className="bg-gray-900/60 border border-white/10 rounded-2xl overflow-hidden backdrop-blur">
                                    <div className="p-6 border-b border-white/5">
                                        <h3 className="font-bold text-white">Détails par jeu</h3>
                                    </div>
                                    <table className="w-full text-left">
                                        <thead className="bg-white/5 text-gray-400 text-xs uppercase font-bold">
                                            <tr>
                                                <th className="p-4">Nom du Jeu</th>
                                                <th className="p-4">Dernière Version</th>
                                                <th className="p-4">Nombre de releases</th>
                                                <th className="p-4 text-right">Téléchargements</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5">
                                            {stats.map(game => (
                                                <tr key={game.id} className="hover:bg-white/5 transition-colors">
                                                    <td className="p-4 font-medium text-white">{game.name}</td>
                                                    <td className="p-4 text-gray-400 font-mono text-sm">{game.latestVersion}</td>
                                                    <td className="p-4 text-gray-500 text-sm">{game.releaseCount}</td>
                                                    <td className="p-4 text-right">
                                                        <span className="inline-block bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-full font-bold font-mono">
                                                            {game.totalDownloads}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* VIEW: CREATE NEW PROJECT */}
                {view === 'create' && (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <h1 className="text-3xl font-bold text-white mb-6">Créer un Nouveau Projet</h1>
                        <form onSubmit={handleCreateProject} className="bg-gray-900/60 border border-white/10 rounded-2xl p-8 space-y-6">
                            {/* ... (Form Content Same as Before) ... */}
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom du Projet</label>
                                <input
                                    value={newProject.name} onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    placeholder="Ex: Super Space Game"
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Description</label>
                                <textarea
                                    value={newProject.description} onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                    placeholder="Une courte description de votre jeu..."
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 h-24 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Image de Couverture</label>
                                <div className={`border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-6 text-center cursor-pointer transition-colors ${newProject.cover ? 'bg-green-500/5 border-green-500/30' : ''}`}>
                                    <input type="file" id="cover-upload" className="hidden" accept="image/*" onChange={e => setNewProject({ ...newProject, cover: e.target.files[0] })} />
                                    <label htmlFor="cover-upload" className="cursor-pointer block">
                                        {newProject.cover ? (
                                            <div className="flex items-center justify-center gap-2 text-green-400 font-bold">
                                                <Check className="w-5 h-5" /> {newProject.cover.name}
                                            </div>
                                        ) : (
                                            <div className="text-gray-500 flex flex-col items-center">
                                                <ImageIcon className="w-8 h-8 mb-2 opacity-50" />
                                                <span>Glisser une image ou cliquer pour parcourir</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button type="button" onClick={() => setView('list')} className="px-6 py-3 rounded-xl font-bold text-gray-400 hover:bg-white/5 transition-colors">Annuler</button>
                                <button disabled={creating} className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold transition-colors flex justify-center items-center gap-2">
                                    {creating ? <Loader2 className="animate-spin" /> : <Plus className="w-5 h-5" />}
                                    Créer le Projet
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* VIEW: MANAGE PROJECT (UPLOAD) */}
                {view === 'list' && selectedGame && (
                    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold text-white">{selectedGame.name}</h1>
                                <a href={selectedGame.html_url} target="_blank" className="text-indigo-400 text-sm hover:underline flex items-center gap-1 mt-1">
                                    Voir sur GitHub <ExternalLink className="w-3 h-3" />
                                </a>
                            </div>
                        </div>

                        <div className="bg-gray-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-sm shadow-2xl">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-3">
                                <Upload className="w-5 h-5 text-indigo-400" /> Mettre à jour (Upload Build)
                            </h2>

                            <form onSubmit={handleUpload} className="space-y-6">
                                <div className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${file ? 'border-green-500/50 bg-green-500/10' : 'border-white/10 hover:border-indigo-500/50 hover:bg-white/5'}`}>
                                    <input type="file" id="zip-upload" className="hidden" accept=".zip" onChange={e => {
                                        if (e.target.files[0]) {
                                            setFile(e.target.files[0]);
                                            const versionMatch = e.target.files[0].name.match(/v?(\d+\.\d+\.\d+)/);
                                            if (versionMatch) setVersion('v' + versionMatch[1]);
                                        }
                                    }} />
                                    <label htmlFor="zip-upload" className="cursor-pointer block">
                                        {file ? (
                                            <div className="font-bold text-green-400 text-lg flex items-center justify-center gap-2"><Check className="w-6 h-6" /> {file.name}</div>
                                        ) : (
                                            <div className="text-gray-500">
                                                <Upload className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                                <div className="text-lg text-white font-medium">Glisser le ZIP du jeu</div>
                                            </div>
                                        )}
                                    </label>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Nom du Jeu</label>
                                        <input
                                            value={customGameName}
                                            onChange={e => setCustomGameName(e.target.value)}
                                            placeholder="Ex: Super Mario"
                                            className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 transition-colors"
                                            required
                                        />
                                    </div>

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

                                {/* PATCH NOTES */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Patch Notes / Nouveautés</label>
                                    <textarea
                                        value={changelog}
                                        onChange={e => setChangelog(e.target.value)}
                                        placeholder="- Ajout du niveau 3&#10;- Correction du bug de saut&#10;- Amélioration des graphismes..."
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-xl text-white outline-none focus:border-indigo-500 h-32 resize-none transition-colors"
                                    />
                                </div>

                                {/* COVER UPDATE (Optionnel) */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Changer l'image (Optionnel)</label>
                                    <div className={`border border-dashed border-white/10 hover:border-indigo-500/50 rounded-xl p-3 flex items-center gap-4 cursor-pointer transition-colors ${coverFile ? 'bg-green-500/5 border-green-500/30' : ''}`}>
                                        <input type="file" id="update-cover" className="hidden" accept="image/*" onChange={e => setCoverFile(e.target.files[0])} />
                                        <label htmlFor="update-cover" className="cursor-pointer flex items-center gap-3 w-full">
                                            <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center text-gray-400">
                                                <ImageIcon className="w-5 h-5" />
                                            </div>
                                            {coverFile ? (
                                                <div className="flex-1">
                                                    <p className="text-sm font-bold text-green-400 truncate">{coverFile.name}</p>
                                                    <p className="text-[10px] text-gray-500">Sera la nouvelle couverture</p>
                                                </div>
                                            ) : (
                                                <div className="flex-1">
                                                    <p className="text-sm text-gray-300">Cliquer pour changer l'image de fond</p>
                                                    <p className="text-[10px] text-gray-500">Laissez vide pour garder l'actuelle</p>
                                                </div>
                                            )}
                                        </label>
                                        {coverFile && <button onClick={(e) => { e.preventDefault(); setCoverFile(null); }} className="p-2 hover:text-red-400 text-gray-500"><Trash2 className="w-4 h-4" /></button>}
                                    </div>
                                </div>

                                <button disabled={loading || !file} className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${loading || !file ? 'bg-gray-700 text-gray-500' : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:scale-[1.02] text-white'}`}>
                                    {loading ? 'Envoi en cours...' : 'Publier la mise à jour'}
                                </button>
                            </form>

                            {uploadStatus.msg && (
                                <div className={`mt-6 p-4 rounded-xl flex items-start gap-3 ${uploadStatus.type === 'error' ? 'bg-red-500/10 text-red-400' : uploadStatus.type === 'warning' ? 'bg-orange-500/10 text-orange-400' : 'bg-green-500/10 text-green-400'}`}>
                                    {uploadStatus.msg}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {view === 'list' && !selectedGame && (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-50">
                        <Package className="w-20 h-20 mb-4 stroke-1" />
                        <p>Sélectionnez un projet ou créez-en un nouveau</p>
                    </div>
                )}
            </div>
        </div>
    );
}
