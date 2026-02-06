"use client";

import React from "react";
import Link from "next/link";

export default function MarketingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden">
            {/* Navbar Minimalista */}
            <nav className="fixed top-0 left-0 w-full z-[100] px-8 py-6 flex items-center justify-between backdrop-blur-md bg-black/20 border-b border-white/5">
                <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <img src="/brand/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-mint/20" />
                    <span className="text-xl font-bold tracking-tighter">IAUTOMAE</span>
                </Link>
                <div className="hidden md:flex items-center gap-10">
                    <a href="#que-hacemos" className="text-sm font-medium text-slate-400 hover:text-brand-mint transition-colors">Capacidades</a>
                    <a href="#nosotros" className="text-sm font-medium text-slate-400 hover:text-brand-mint transition-colors">Nosotros</a>
                </div>
                <div className="flex items-center gap-4">
                </div>
            </nav>

            <main>{children}</main>

            {/* Footer Minimalista */}
            <footer className="bg-black py-20 px-8 border-t border-white/5">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                    <div className="space-y-6">
                        <Link href="/home" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                            <img src="/brand/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-mint/20" />
                            <span className="text-xl font-bold tracking-tighter text-white">IAUTOMAE</span>
                        </Link>
                        <p className="text-sm text-slate-400 leading-relaxed">
                            Elevando la eficiencia empresarial mediante automatización inteligente y agentes de IA de alto rendimiento.
                        </p>
                    </div>
                    <div>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Compañía</h4>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li><a href="#" className="hover:text-brand-mint transition-all">Nosotros</a></li>
                            <li><a href="#" className="hover:text-brand-mint transition-all">Contacto</a></li>
                            <li><a href="#" className="hover:text-brand-mint transition-all">Blog</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-[0.2em] text-white mb-6">Legal</h4>
                        <ul className="space-y-4 text-sm text-slate-400">
                            <li><a href="/privacy-policy" className="hover:text-brand-mint transition-all">Políticas de Privacidad</a></li>
                            <li><a href="/terms-of-service" className="hover:text-brand-mint transition-all">Términos de Servicio</a></li>
                            <li><a href="/complaints" className="hover:text-brand-mint transition-all">Libro de Reclamaciones</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto mt-20 pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">© 2026 IAUTOMAE. TODOS LOS DERECHOS RESERVADOS.</p>
                    <div className="flex gap-6">
                        <div className="w-5 h-5 bg-white/10 rounded-full" />
                        <div className="w-5 h-5 bg-white/10 rounded-full" />
                        <div className="w-5 h-5 bg-white/10 rounded-full" />
                    </div>
                </div>
            </footer>
        </div>
    );
}
