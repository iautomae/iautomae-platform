"use client";

import { useEffect, useState } from 'react';
import { Shield, Mail, Bell, LockKeyhole, LoaderCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useProfile } from '@/hooks/useProfile';

type SecuritySettingsState = {
    twoFactorEmail: string;
    twoFactorEnabled: boolean;
    allowedCountries: string[];
    notifyOnSuspicious: boolean;
    alertEmail: string;
    lastVerifiedAt: string | null;
    maskedTwoFactorEmail: string;
};

const DEFAULT_SETTINGS: SecuritySettingsState = {
    twoFactorEmail: '',
    twoFactorEnabled: false,
    allowedCountries: ['PE'],
    notifyOnSuspicious: true,
    alertEmail: '',
    lastVerifiedAt: null,
    maskedTwoFactorEmail: '',
};

export default function ProfileSecurityPage() {
    const { profile } = useProfile();
    const [settings, setSettings] = useState<SecuritySettingsState>(DEFAULT_SETTINGS);
    const [pendingEmail, setPendingEmail] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [challengeId, setChallengeId] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadSettings() {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.access_token) return;

                const res = await fetch('/api/security/settings', {
                    headers: { Authorization: `Bearer ${session.access_token}` },
                });

                const json = await res.json();
                if (!res.ok) {
                    throw new Error(json.error || 'No se pudo cargar la seguridad.');
                }

                setSettings(json.settings || DEFAULT_SETTINGS);
            } catch (err: any) {
                setError(err.message || 'No se pudo cargar la seguridad.');
            } finally {
                setLoading(false);
            }
        }

        loadSettings();
    }, []);

    async function saveBaseSettings(next: Partial<SecuritySettingsState>) {
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Tu sesión expiró.');

            const payload = {
                notifyOnSuspicious: next.notifyOnSuspicious ?? settings.notifyOnSuspicious,
                alertEmail: next.alertEmail ?? settings.alertEmail,
                twoFactorEnabled: next.twoFactorEnabled ?? settings.twoFactorEnabled,
            };

            const res = await fetch('/api/security/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json().catch(() => ({}));
            if (!res.ok) {
                throw new Error(json.error || 'No se pudo guardar la configuración.');
            }

            setSettings((prev) => ({ ...prev, ...next }));
            setMessage('Configuración guardada.');
        } catch (err: any) {
            setError(err.message || 'No se pudo guardar la configuración.');
        } finally {
            setSaving(false);
        }
    }

    async function sendVerificationCode() {
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Tu sesión expiró.');
            if (!pendingEmail.includes('@')) throw new Error('Ingresa un correo válido.');

            const res = await fetch('/api/security/settings/send-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({ email: pendingEmail }),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'No se pudo enviar el código.');
            }

            setChallengeId(json.challengeId);
            setMessage(`Te enviamos un código a ${pendingEmail}.`);
        } catch (err: any) {
            setError(err.message || 'No se pudo enviar el código.');
        } finally {
            setSaving(false);
        }
    }

    async function verifySecurityEmail() {
        setSaving(true);
        setError('');
        setMessage('');

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Tu sesión expiró.');
            if (!challengeId) throw new Error('Primero solicita el código.');
            if (verificationCode.length !== 6) throw new Error('Ingresa el código completo.');

            const res = await fetch('/api/security/settings/verify-code', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    challengeId,
                    code: verificationCode,
                }),
            });

            const json = await res.json();
            if (!res.ok) {
                throw new Error(json.error || 'No se pudo verificar el correo.');
            }

            setSettings((prev) => ({
                ...prev,
                twoFactorEmail: json.twoFactorEmail,
                maskedTwoFactorEmail: json.twoFactorEmail,
                twoFactorEnabled: true,
                lastVerifiedAt: new Date().toISOString(),
                alertEmail: json.twoFactorEmail,
            }));
            setPendingEmail('');
            setVerificationCode('');
            setChallengeId('');
            setMessage('Correo de seguridad verificado. La doble verificación quedó activa.');
        } catch (err: any) {
            setError(err.message || 'No se pudo verificar el correo.');
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="min-h-[70vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <LoaderCircle className="animate-spin" size={18} />
                    Cargando seguridad...
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            <div>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-brand-primary">Perfil</p>
                <h1 className="text-3xl font-black text-gray-900 tracking-tight mt-2">Seguridad de acceso</h1>
                <p className="text-sm text-gray-500 mt-2 max-w-2xl">
                    Tu panel es privado. El acceso se valida desde Perú y puedes activar una segunda verificación por correo antes de entrar.
                </p>
            </div>

            {(message || error) && (
                <div className={`rounded-2xl border px-4 py-3 text-sm ${error ? 'bg-red-50 border-red-200 text-red-700' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                    {error || message}
                </div>
            )}

            <div className="grid gap-6 md:grid-cols-2">
                <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">País permitido</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                En esta versión el ingreso queda limitado a <strong>Perú</strong>.
                            </p>
                        </div>
                    </div>
                    <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Política actual</p>
                        <p className="mt-2 text-sm font-semibold text-gray-800">Solo Perú ({settings.allowedCountries.join(', ')})</p>
                    </div>
                </section>

                <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                            <Mail size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Correo de doble acceso</h2>
                            <p className="text-sm text-gray-500 mt-1">
                                Cada trabajador puede elegir su correo para recibir el código de verificación al iniciar sesión.
                            </p>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <label className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Correo de seguridad</label>
                        <input
                            type="email"
                            value={pendingEmail}
                            onChange={(e) => setPendingEmail(e.target.value)}
                            placeholder={settings.twoFactorEmail || profile?.email || 'nombre@correo.com'}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                        <button
                            onClick={sendVerificationCode}
                            disabled={saving || !pendingEmail}
                            className="w-full rounded-2xl bg-brand-primary text-white font-bold px-4 py-3 disabled:opacity-50"
                        >
                            {saving ? 'Enviando...' : 'Enviar código al correo'}
                        </button>
                    </div>

                    <div className="space-y-3 border-t border-gray-100 pt-4">
                        <label className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Código recibido</label>
                        <input
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={verificationCode}
                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="000000"
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 tracking-[0.35em] text-center outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                        <button
                            onClick={verifySecurityEmail}
                            disabled={saving || !challengeId || verificationCode.length !== 6}
                            className="w-full rounded-2xl border border-gray-300 text-gray-900 font-bold px-4 py-3 disabled:opacity-50"
                        >
                            {saving ? 'Verificando...' : 'Verificar y activar'}
                        </button>
                    </div>

                    <div className="rounded-2xl bg-gray-50 border border-gray-200 px-4 py-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Estado actual</p>
                        <p className="mt-2 text-sm text-gray-700">
                            {settings.twoFactorEnabled
                                ? `Activo en ${settings.twoFactorEmail || settings.maskedTwoFactorEmail || 'correo verificado'}`
                                : 'Aún no activado'}
                        </p>
                    </div>
                </section>
            </div>

            <section className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                        <Bell size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Alertas de acceso sospechoso</h2>
                        <p className="text-sm text-gray-500 mt-1">
                            Si se detecta un intento desde un país no permitido, enviaremos una notificación al correo configurado.
                        </p>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-[0.2em] text-gray-400 font-bold">Correo de alerta</label>
                        <input
                            type="email"
                            value={settings.alertEmail}
                            onChange={(e) => setSettings((prev) => ({ ...prev, alertEmail: e.target.value }))}
                            className="w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                    </div>
                    <label className="flex items-center gap-3 rounded-2xl border border-gray-200 px-4 py-3">
                        <input
                            type="checkbox"
                            checked={settings.notifyOnSuspicious}
                            onChange={(e) => setSettings((prev) => ({ ...prev, notifyOnSuspicious: e.target.checked }))}
                        />
                        <span className="text-sm font-medium text-gray-700">Notificar por correo</span>
                    </label>
                </div>

                <div className="flex flex-wrap gap-3">
                    <button
                        onClick={() => saveBaseSettings({
                            alertEmail: settings.alertEmail,
                            notifyOnSuspicious: settings.notifyOnSuspicious,
                        })}
                        disabled={saving}
                        className="rounded-2xl bg-gray-900 text-white font-bold px-5 py-3 disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar alertas'}
                    </button>
                    <button
                        onClick={() => saveBaseSettings({ twoFactorEnabled: !settings.twoFactorEnabled })}
                        disabled={saving || !settings.twoFactorEmail}
                        className="rounded-2xl border border-gray-300 text-gray-900 font-bold px-5 py-3 disabled:opacity-50 flex items-center gap-2"
                    >
                        <LockKeyhole size={16} />
                        {settings.twoFactorEnabled ? 'Desactivar doble verificación' : 'Activar doble verificación'}
                    </button>
                </div>
            </section>
        </div>
    );
}
