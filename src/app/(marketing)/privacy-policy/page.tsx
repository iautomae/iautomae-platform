"use client";

import React from 'react';
import { ShieldCheck, Mail, Globe, MapPin, Briefcase } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="pt-48 pb-32 px-8 max-w-4xl mx-auto space-y-16 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-6 text-center mb-20">
                <div className="w-16 h-16 bg-brand-mint/10 rounded-2xl flex items-center justify-center text-brand-mint mx-auto mb-6">
                    <ShieldCheck size={32} />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight uppercase">POLÍTICA DE PRIVACIDAD</h1>
            </div>

            {/* Intro */}
            <div className="p-8 rounded-[32px] bg-white/5 border border-white/10 backdrop-blur-sm">
                <p className="text-slate-200 leading-relaxed font-medium">
                    En <span className="text-brand-mint">IAutomae Systems</span> (en adelante, &ldquo;la Empresa&rdquo;, &ldquo;la Plataforma&rdquo; o &ldquo;nosotros&rdquo;), nos dedicamos al desarrollo de software y soluciones tecnológicas, incluyendo plataformas SaaS, automatización de procesos, gestión de datos, APIs e integraciones. La presente Política de Privacidad describe cómo recopilamos, usamos, almacenamos y protegemos los datos personales de los usuarios que acceden o utilizan nuestros servicios.
                </p>
            </div>

            {/* Content Sections */}
            <div className="space-y-12 text-slate-300 leading-relaxed">

                {/* 1. Responsable */}
                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">1.</span> Responsable del tratamiento de los datos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                            { label: 'Nombre / Marca', value: 'IAutomae Systems', icon: Briefcase },
                            { label: 'Actividad', value: 'Desarrollo de software y automatización', icon: ShieldCheck },
                            { label: 'País', value: 'Perú', icon: MapPin },
                            { label: 'Contacto', value: 'admin@iautomae.com', icon: Mail },
                            { label: 'Sitio Web', value: 'www.iautomae.com', icon: Globe }
                        ].map((item, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5">
                                <item.icon size={16} className="text-brand-mint" />
                                <div>
                                    <p className="text-[10px] font-bold uppercase text-slate-500 tracking-widest">{item.label}</p>
                                    <p className="text-sm font-semibold text-white">{item.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* 2. Alcance */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">2.</span> Alcance de esta Política
                    </h2>
                    <p>Esta Política aplica a:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            'Usuarios del sitio web',
                            'Usuarios de nuestras plataformas y aplicaciones',
                            'Clientes que gestionan datos de terceros',
                            'Usuarios finales de soluciones desarrolladas'
                        ].map(item => (
                            <li key={item} className="flex items-center gap-3 text-sm p-3 rounded-xl bg-white/5 border border-white/5">
                                <div className="w-1.5 h-1.5 rounded-full bg-brand-mint" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                {/* 3. Información que recopilamos */}
                <section className="space-y-8">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">3.</span> Información que recopilamos
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <h3 className="text-white font-bold mb-3">3.1 Información proporcionada directamente</h3>
                            <p className="mb-4">Podemos recopilar información como:</p>
                            <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">
                                {['Nombre', 'Correo', 'Teléfono', 'Credenciales', 'Datos de formularios'].map(tag => (
                                    <span key={tag} className="px-3 py-1.5 bg-brand-mint/10 text-brand-mint rounded-lg border border-brand-mint/20">{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h3 className="text-white font-bold mb-3">3.2 Información generada por el uso del software</h3>
                            <p>Registros técnicos (logs), metadatos de uso, interacciones con la plataforma y estructuras creadas por el usuario.</p>
                        </div>

                        <div>
                            <h3 className="text-white font-bold mb-3">3.3 Información recopilada automáticamente</h3>
                            <p>Dirección IP, tipo de dispositivo, navegador, sistema operativo y datos de rendimiento.</p>
                        </div>
                    </div>
                </section>

                {/* 4. Finalidad */}
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">4.</span> Finalidad del tratamiento de los datos
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        {[
                            'Operar y mantener el software',
                            'Gestionar autenticación y cuentas',
                            'Ejecutar procesos de automatización',
                            'Facilitar integraciones externas',
                            'Brindar soporte y mantenimiento',
                            'Cumplir obligaciones legales'
                        ].map(item => (
                            <div key={item} className="flex items-center gap-3">
                                <ShieldCheck size={14} className="text-brand-mint" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">5.</span> Naturaleza del rol de la Empresa
                    </h2>
                    <p>
                        IAutomae Systems puede actuar como Responsable o Encargado del tratamiento. Cuando el usuario procesa datos de terceros, este es responsable de obtener los consentimientos y cumplir la normativa.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">6.</span> IA y Automatización
                    </h2>
                    <p>
                        Las funciones de IA se utilizan para ejecutar instrucciones del usuario. No se toman decisiones legales o significativas de forma autónoma sobre las personas.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">7.</span> Integraciones de Terceros
                    </h2>
                    <p>
                        El software se integra con APIs externas. Cada tercero está sujeto a sus propias políticas de privacidad fuera del control de IAutomae.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">8.</span> Conservación de Datos
                    </h2>
                    <p>
                        Los datos se conservan mientras exista relación activa o por exigencia legal. Luego pueden ser eliminados o anonimizados.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">9.</span> Seguridad
                    </h2>
                    <p>
                        Aplicamos encriptación, control de accesos y monitoreo. Ningún sistema es 100% infalible.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">10.</span> Derechos del Usuario
                    </h2>
                    <div className="flex flex-wrap gap-3">
                        {['Acceso', 'Rectificación', 'Eliminación', 'Oposición', 'Retiro de consentimiento'].map(right => (
                            <span key={right} className="px-4 py-2 bg-white/5 rounded-full border border-white/10 text-xs font-bold uppercase tracking-widest leading-none">
                                {right}
                            </span>
                        ))}
                    </div>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-3">
                        <span className="text-brand-mint">11.</span> Transferencias Internacionales
                    </h2>
                    <p>
                        Los datos pueden procesarse en servidores fuera del país de origen del usuario bajo medidas de protección adecuadas.
                    </p>
                </section>

                {/* Footer Section */}
                <div className="pt-20 border-t border-white/10 text-center space-y-8">
                    <div className="space-y-2">
                        <p className="text-sm text-slate-500 uppercase font-bold tracking-[0.2em]">Para consultas legales</p>
                        <p className="text-2xl font-bold text-brand-mint">admin@iautomae.com</p>
                    </div>
                    <p className="text-xs text-slate-600 font-medium">www.iautomae.com</p>
                </div>
            </div>
        </div>
    );
}
