"use client";

import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Lock,
    ArrowRight,
    Mail,
    Loader2,
    ArrowLeft,
    KeyRound,
    Eye,
    EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [view, setView] = useState<'login' | 'recovery'>('login');
    const [resetSent, setResetSent] = useState(false);
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
            // Fetch profile to decide redirection
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', (await supabase.auth.getUser()).data.user?.id)
                .single();

            if (profile?.has_leads_access) {
                router.push('/leads');
            } else if (profile?.has_docs_access) {
                router.push('/docs');
            } else if (profile?.has_forms_access) {
                router.push('/forms');
            } else {
                router.push('/pending-approval');
            }
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

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Verify if the email exists via the secure RPC function (renamed for clarity)
        const { data: userExists, error: checkError } = await supabase
            .rpc('verify_user_email', { email_input: email });

        if (checkError) {
            console.error('Error al verificar existencia de perfil:', checkError);
            setError(`Ocurrió un error al verificar tu cuenta: ${checkError.message}. Código: ${checkError.code || 'N/A'}`);
            setLoading(false);
            return;
        }

        if (!userExists) {
            setError('Este correo electrónico no está registrado en el sistema.');
            setLoading(false);
            return;
        }

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/set-password`,
        });

        if (error) {
            setError(error.message);
        } else {
            setResetSent(true);
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

                    {view === 'login' ? (
                        <>
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
                                            type={showPassword ? "text" : "password"}
                                            placeholder="••••••••"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint transition-all"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                        >
                                            {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                        </button>
                                    </div>
                                    <div className="flex justify-end pr-1">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setView('recovery');
                                                setError(null);
                                            }}
                                            className="text-xs font-bold text-gray-400 hover:text-brand-mint transition-colors"
                                        >
                                            ¿Olvidaste tu contraseña?
                                        </button>
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
                        </>
                    ) : (
                        <>
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        setView('login');
                                        setResetSent(false);
                                        setError(null);
                                    }}
                                    className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-brand-mint transition-colors mb-6 group"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    VOLVER AL INICIO
                                </button>
                                <h3 className="text-3xl font-bold text-gray-900 tracking-tight">Recuperar Clave</h3>
                                <p className="text-gray-500">Te enviaremos un enlace seguro para restablecer tu contraseña.</p>
                            </div>

                            {!resetSent ? (
                                <form onSubmit={handleResetPassword} className="space-y-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-gray-700 ml-1">Tu correo electrónico</label>
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

                                    {error && (
                                        <div className="bg-red-50 border border-red-100 p-3 rounded-lg text-red-600 text-xs font-medium text-center">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="btn-primary w-full py-4 text-sm tracking-wide shadow-lg shadow-brand-mint/20 flex items-center justify-center gap-2 group"
                                    >
                                        {loading ? <Loader2 className="animate-spin" size={20} /> : (
                                            <>
                                                ENVIAR ENLACE
                                                <KeyRound size={18} className="group-hover:rotate-12 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            ) : (
                                <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                                    <div className="flex justify-center">
                                        <Mail className="text-brand-mint" size={60} />
                                    </div>
                                    <h4 className="text-xl font-bold text-gray-900">¡Enlace enviado!</h4>
                                    <p className="text-gray-500">Revisa tu bandeja de entrada. Te hemos enviado las instrucciones para recuperar tu acceso.</p>
                                    <button
                                        onClick={() => setView('login')}
                                        className="text-brand-mint font-bold text-sm hover:underline pt-2"
                                    >
                                        Volver al login
                                    </button>
                                </div>
                            )}
                        </>
                    )}

                    <p className="text-center text-gray-400 text-[10px] leading-relaxed">
                        Al continuar, aceptas nuestros <Link href="/legal/terms" className="text-[#003327] font-bold hover:underline">Términos de Servicio</Link> y <Link href="/legal/privacy" className="text-[#003327] font-bold hover:underline">Política de Privacidad</Link>.
                    </p>
                </div>
            </div>
        </div>
    );
}
