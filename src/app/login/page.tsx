"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Loader2, ArrowRight, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            router.push('/');
        }
    };

    const handleSignUp = async () => {
        setLoading(true);
        setError(null);

        // Track if user came from the compressor landing
        const isFromCompressor = window.location.pathname.includes('/compress');

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    signup_origin: isFromCompressor ? 'compressor' : 'general',
                    has_compressor_access: isFromCompressor,
                    is_trial: isFromCompressor
                }
            }
        });

        if (error) {
            setError(error.message);
        } else {
            setError('Verifica tu correo electrónico para confirmar tu cuenta.');
        }
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[100] bg-[#F9FAFB] flex flex-col md:flex-row">
            {/* Branding Side (Elegant Dark) */}
            <div className="hidden md:flex md:w-1/2 bg-[#0a0a0a] p-12 flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-brand-mint/5 blur-[120px] pointer-events-none" />

                <Link href="/home" className="relative z-10 flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
                    <img src="/brand/logo.jpg" alt="Logo" className="w-10 h-10 rounded-xl object-cover shadow-lg shadow-brand-mint/20" />
                    <h1 className="text-white text-2xl font-bold tracking-tight">IAUTOMAE</h1>
                </Link>

                <div className="relative z-10">
                    <h2 className="text-4xl lg:text-5xl font-bold text-white leading-tight mb-6">
                        La plataforma definitiva para escalar tus <span className="text-brand-mint">servicios SaaS</span>.
                    </h2>
                    <p className="text-white/50 text-lg max-w-md">
                        Gestiona leads con IA, automatiza documentos y crea formularios inteligentes en un solo lugar.
                    </p>
                </div>

                <div className="relative z-10 text-white/30 text-xs tracking-widest uppercase">
                    © 2026 IAUTOMAE • Secure Platform
                </div>
            </div>

            {/* Login Form Side */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-10">
                    <Link href="/home" className="md:hidden flex flex-col items-center mb-10 text-center hover:opacity-80 transition-opacity">
                        <img src="/brand/logo.jpg" alt="Logo" className="w-14 h-14 rounded-xl object-cover shadow-lg shadow-brand-mint/20 mb-4" />
                        <h1 className="text-3xl font-bold text-gray-900">IAUTOMAE</h1>
                    </Link>

                    <div className="space-y-4">
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Bienvenido</h3>
                        <p className="text-gray-500">Ingresa tus credenciales para acceder a tu panel.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-3">
                            <label className="text-sm font-semibold text-gray-700 ml-1">Correo electrónico</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-mint transition-colors" size={20} />
                                <input
                                    type="email"
                                    placeholder="ejemplo@correo.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center ml-1">
                                <label className="text-sm font-semibold text-gray-700">Contraseña</label>
                                <button type="button" className="text-xs font-bold text-brand-mint hover:underline">¿Olvidaste tu contraseña?</button>
                            </div>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-mint transition-colors" size={20} />
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-4 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint transition-all"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-600 text-xs font-medium text-center">
                                {error}
                            </div>
                        )}

                        <div className="flex flex-col gap-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn-primary w-full py-4 text-sm tracking-wide shadow-lg shadow-brand-mint/20 flex items-center justify-center gap-2 group"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        INICIAR SESIÓN
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>

                            <div className="relative py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-2 text-gray-400">¿No tienes cuenta?</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={handleSignUp}
                                disabled={loading}
                                className="w-full py-4 text-sm font-bold text-gray-900 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all"
                            >
                                CREAR UNA CUENTA GRATIS
                            </button>
                        </div>
                    </form>

                    <p className="text-center text-gray-400 text-xs">
                        Al continuar, aceptas nuestros Términos de Servicio y Política de Privacidad.
                    </p>
                </div>
            </div>
        </div>
    );
}
