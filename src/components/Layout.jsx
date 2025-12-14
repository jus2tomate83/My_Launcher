import React from 'react';
import { Link } from 'react-router-dom';
import { Gamepad2, Upload } from 'lucide-react';

export default function Layout({ children }) {
    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary selection:text-primary-foreground overflow-x-hidden">
            {/* Background avec effet de dégradé/bruit */}
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-[#0a0a0a] to-black"></div>

            <nav className="border-b border-white/10 bg-black/20 backdrop-blur-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-600 group-hover:scale-105 transition-transform">
                                <Gamepad2 className="w-5 h-5 text-white" />
                            </div>
                            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                                MyLauncher
                            </span>
                        </Link>

                        <div className="flex items-center gap-4">
                            <Link
                                to="/admin"
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-300 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <Upload className="w-4 h-4" />
                                Admin / Upload
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>

            <footer className="border-t border-white/5 mt-auto py-8 text-center text-sm text-gray-500">
                <p>Propulsé par GitHub API • Hébergé gratuitement</p>
            </footer>
        </div>
    );
}
