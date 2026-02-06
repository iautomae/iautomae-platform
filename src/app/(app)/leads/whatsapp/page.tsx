"use client";

import React from 'react';
import {
    ArrowLeft,
    MessageSquare,
    ExternalLink,
    ShieldCheck,
    CheckCircle2,
    Lock,
    Globe
} from 'lucide-react';
import Link from 'next/link';

export default function WhatsAppPage() {
    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Navigation Header */}
            <div>
                <Link href="/leads" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group inline-flex mb-6">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Volver a Leads</span>
                </Link>
                <div className="space-y-2">
                    <h2 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                        <MessageSquare className="text-[#25D366]" size={32} />
                        Conectar WhatsApp Business
                    </h2>
                    <p className="text-gray-500 text-lg">Integra tu número oficial de Meta para automatizar tus conversaciones.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Core Content */}
                <div className="md:col-span-2 space-y-6">
                    <div className="card-professional p-8 space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-bold text-gray-900">¿Cómo conectar tu número?</h3>
                            <p className="text-sm text-gray-600 leading-relaxed">
                                Necesitarás una cuenta verificada en <strong>Meta Business Suite</strong>. El proceso es rápido y seguro a través del inicio de sesión oficial de Facebook.
                            </p>
                        </div>

                        <div className="space-y-6">
                            {[
                                { step: '1', title: 'Prepara tu número', desc: 'Asegúrate de que el número no tenga una cuenta personal activa.' },
                                { step: '2', title: 'Vincula con Facebook', desc: 'Inicia sesión en Meta y otorga los permisos necesarios.' },
                                { step: '3', title: 'Configura el Webhook', desc: 'Nosotros nos encargamos de recibir tus mensajes automáticamente.' },
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4">
                                    <div className="w-8 h-8 rounded-full bg-brand-mint/10 text-brand-mint flex items-center justify-center font-bold text-sm shrink-0">
                                        {item.step}
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900">{item.title}</h4>
                                        <p className="text-xs text-gray-500">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button className="w-full py-4 bg-brand-mint text-white rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-brand-mint-dark transition-all shadow-lg shadow-brand-mint/20">
                            <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                            </svg>
                            Conectar con Facebook
                        </button>
                        <p className="text-[10px] text-center text-gray-400">
                            Al hacer clic, serás redirigido a Facebook para otorgar permisos. No guardamos tus contraseñas.
                        </p>
                    </div>
                </div>

                {/* Sidebar Features */}
                <div className="space-y-6">
                    <div className="card-professional p-6 space-y-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Beneficios de la API</h4>
                        <div className="space-y-3">
                            {[
                                { icon: ShieldCheck, text: 'Seguridad Empresarial' },
                                { icon: CheckCircle2, text: 'Sin Riesgo de Bloqueo' },
                                { icon: Lock, text: 'Cifrado Extremo a Extremo' },
                                { icon: Globe, text: 'Escalabilidad Global' },
                            ].map((item, i) => (
                                <div key={i} className="flex items-center gap-3 text-xs text-gray-700">
                                    <item.icon size={16} className="text-brand-mint" />
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 space-y-3">
                        <div className="flex items-center gap-2 text-gray-900 font-bold text-sm">
                            <ExternalLink size={16} className="text-gray-400" />
                            Documentación
                        </div>
                        <p className="text-[11px] text-gray-500 leading-relaxed">
                            Aprende más sobre cómo configurar tus plantillas de mensajes y reglas de Meta.
                        </p>
                        <button className="text-xs font-bold text-brand-mint hover:underline">Ver guía oficial</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
