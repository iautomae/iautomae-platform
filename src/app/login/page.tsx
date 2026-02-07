"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Lock,
    ArrowRight,
    Mail,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';

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

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    signup_origin: 'general',
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
            <div className="hidden md:flex md:w-1/2 bg-[#050505] p-12 flex-col items-center justify-center relative overflow-hidden">
                <NeuralNetworkBackground
                    particleCount={120}
                    connectionDistance={130}
                    mouseRadius={150}
                />
                <div className="absolute top-0 left-0 w-full h-full bg-white/2 blur-[120px] pointer-events-none" />

                <Link href="/" className="relative z-10 hover:opacity-90 transition-opacity">
                    <img
                        src="/brand/logo_transparent.png"
                        alt="IAUTOMAE AI SYSTEMS"
                        className="w-full max-w-[520px] h-auto object-contain"
                    />
                </Link>

                <div className="absolute bottom-12 left-12 z-10 text-white/20 text-[10px] tracking-[0.3em] uppercase">
                    © 2026 IAUTOMAE • Intelligence Infrastructure
                </div>
            </div>

            {/* Login Form Side */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-10">
                    <Link href="/" className="md:hidden flex flex-col items-center mb-10 text-center hover:opacity-80 transition-opacity">
                        <img src="/brand/logo_full.png" alt="Logo" className="w-48 h-auto object-contain mb-2" />
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
                            <label className="text-sm font-semibold text-gray-700 ml-1">Contraseña</label>
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
                            <div className="flex justify-end pr-1">
                                <button type="button" className="text-xs font-bold text-gray-400 hover:text-brand-mint transition-colors">¿Olvidaste tu contraseña?</button>
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

                            <div className="pt-4">
                                <p className="text-center text-gray-500 text-xs">
                                    ¿Problemas de acceso? Contacta con el administrador en <span className="text-brand-mint font-semibold">admin@iautomae.com</span>
                                </p>
                            </div>
                        </div>
                    </form>

                    <p className="text-center text-gray-400 text-[10px] leading-relaxed">
                        Al continuar, aceptas nuestros <Link href="/legal/terms" className="text-[#003327] font-bold hover:underline">Términos de Servicio</Link> y <Link href="/legal/privacy" className="text-[#003327] font-bold hover:underline">Política de Privacidad</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
