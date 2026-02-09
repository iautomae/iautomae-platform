"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Lock,
    ArrowRight,
    Mail,
    Loader2,
    ShieldCheck,
    CheckCircle2,
    History,
    Eye,
    EyeOff
} from 'lucide-react';
import Link from 'next/link';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';

export default function SetPasswordPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [alreadyOnboarded, setAlreadyOnboarded] = useState(false);
    const [isRecovery, setIsRecovery] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (error || !session) {
                router.push('/login');
                return;
            }

            // NEW LOGIC: Check metadata for onboarding status
            // This prevents the "invite link loop" by flagging users who have already set their password.
            if (session.user.user_metadata?.onboarding_completed) {
                setAlreadyOnboarded(true);
            }

            setEmail(session.user.email || '');
            setLoading(false);
        };

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsRecovery(true);
            }
        });

        checkSession();

        return () => {
            subscription.unsubscribe();
        };
    }, [router]);

    const handleSetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            setError('Las contraseñas no coinciden');
            return;
        }

        if (password.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setUpdating(true);
        setError(null);

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            setError(error.message);
            setUpdating(false);
        } else {
            // SUCCESS: Mark user as onboarded in metadata to prevent future link reuse
            await supabase.auth.updateUser({
                data: { onboarding_completed: true }
            });

            setSuccess(true);
            setUpdating(false);

            // NEW FLOW: Sign out and redirect to login
            // The user requested to be taken to login to enter credentials manually
            setTimeout(async () => {
                await supabase.auth.signOut();
                router.push('/login');
            }, 2000);
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-[#050505] flex items-center justify-center">
                <Loader2 className="text-brand-mint animate-spin" size={40} />
            </div>
        );
    }

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

            {/* Form Side */}
            <div className="w-full md:w-1/2 flex items-center justify-center p-8 bg-white">
                <div className="w-full max-w-md space-y-10">
                    <Link href="/" className="md:hidden flex flex-col items-center mb-10 text-center hover:opacity-80 transition-opacity">
                        <img src="/brand/logo_full.png" alt="Logo" className="w-48 h-auto object-contain mb-2" />
                    </Link>

                    <div className="space-y-4 text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-mint/10 border border-brand-mint/20 text-brand-mint text-xs font-bold uppercase tracking-wider mx-auto">
                            <ShieldCheck size={14} />
                            {isRecovery ? 'Recuperación de Acceso' : 'Configuración de Acceso'}
                        </div>
                        <h3 className="text-3xl font-bold text-gray-900 tracking-tight">
                            {alreadyOnboarded && !isRecovery ? 'Cuenta ya existente' : isRecovery ? 'Restablece tu clave' : 'Crea tu contraseña'}
                        </h3>
                    </div>

                    {alreadyOnboarded && !isRecovery ? (
                        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl space-y-3">
                                <p className="text-amber-800 text-sm font-medium text-center leading-relaxed">
                                    Parece que ya has configurado tu cuenta anteriormente. Para tu seguridad, no puedes crear otra contraseña desde este enlace.
                                </p>
                            </div>

                            <div className="flex flex-col gap-4">
                                <Link
                                    href="/login"
                                    className="btn-primary w-full py-4 text-sm tracking-widest font-bold shadow-lg shadow-brand-mint/20 flex items-center justify-center gap-2 group"
                                >
                                    INGRESAR AL SISTEMA
                                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </Link>

                                <button
                                    onClick={() => router.push('/login?view=recovery')}
                                    className="w-full py-4 text-xs font-bold text-gray-400 hover:text-brand-mint transition-colors flex items-center justify-center gap-2"
                                >
                                    <History size={16} />
                                    RECUPERAR CONTRASEÑA
                                </button>
                            </div>
                        </div>
                    ) : !success ? (
                        <form onSubmit={handleSetPassword} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Tu correo electrónico</label>
                                <div className="relative group opacity-60">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={20} />
                                    <input
                                        type="email"
                                        value={email}
                                        readOnly
                                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-12 pr-4 text-gray-500 cursor-not-allowed outline-none"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-widest ml-1">Nueva contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-mint transition-colors" size={20} />
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Min. 6 caracteres"
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
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-gray-700 uppercase tracking-widest ml-1">Confirmar contraseña</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-brand-mint transition-colors" size={20} />
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Repite tu contraseña"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-4 pl-12 pr-12 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint transition-all"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                                    >
                                        {showConfirmPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                                    </button>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 border border-red-100 p-4 rounded-xl text-red-600 text-sm font-medium">
                                    {error}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={updating}
                                className="btn-primary w-full py-4 text-sm tracking-widest font-bold shadow-lg shadow-brand-mint/20 flex items-center justify-center gap-2 group"
                            >
                                {updating ? <Loader2 className="animate-spin" size={20} /> : (
                                    <>
                                        {isRecovery ? 'RESTABLECER CONTRASEÑA' : 'ACTIVAR MI CUENTA'}
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    ) : (
                        <div className="bg-brand-mint/5 border border-brand-mint/20 rounded-2xl p-8 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                            <div className="flex justify-center">
                                <CheckCircle2 className="text-brand-mint" size={60} />
                            </div>
                            <h4 className="text-xl font-bold text-gray-900">{isRecovery ? '¡Clave actualizada!' : '¡Contraseña establecida!'}</h4>
                            <p className="text-gray-500">
                                {isRecovery ? 'Tu contraseña ha sido restablecida con éxito.' : 'Tu cuenta de IAUTOMAE ha sido activada correctamente.'} Redirigiendo al inicio de sesión...
                            </p>
                            <div className="flex justify-center pt-4">
                                <Loader2 className="text-brand-mint animate-spin" size={24} />
                            </div>
                        </div>
                    )}

                    <p className="text-center text-gray-400 text-[10px] uppercase tracking-[0.2em] leading-relaxed">
                        Security Layer v2.0 • Encryption Protocol Enabled
                    </p>
                </div>
            </div>
        </div>
    );
}
