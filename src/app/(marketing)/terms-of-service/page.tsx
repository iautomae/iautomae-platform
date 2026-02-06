"use client";

import React from 'react';
import { FileText } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="pt-48 pb-32 px-8 max-w-4xl mx-auto space-y-12 animate-in fade-in duration-700">
            <div className="space-y-4 text-center mb-20">
                <div className="w-16 h-16 bg-brand-mint/10 rounded-2xl flex items-center justify-center text-brand-mint mx-auto mb-6">
                    <FileText size={32} />
                </div>
                <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight uppercase">Términos de Servicio</h1>
            </div>

            <div className="space-y-10 text-slate-300 font-medium leading-relaxed">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar el sitio web y los servicios de IAUTOMAE, usted acepta cumplir y estar sujeto a los siguientes términos y condiciones. Si no está de acuerdo con alguna parte de estos términos, no podrá utilizar nuestros servicios.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">2. Descripción del Servicio</h2>
                    <p>
                        IAUTOMAE es una agencia de desarrollo de software y soluciones de inteligencia artificial. Nuestros servicios incluyen, entre otros, la creación de aplicaciones web, implementación de agentes inteligentes basados en LLMs, y herramientas de automatización de procesos empresariales.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">3. Registro y Cuentas de Usuario</h2>
                    <p>
                        Para acceder a ciertas funciones de la plataforma, es necesario crear una cuenta. Usted es responsable de mantener la confidencialidad de sus credenciales y de todas las actividades que ocurran bajo su cuenta. Nos reservamos el derecho de suspender cuentas que incumplan nuestras políticas de uso.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">4. Propiedad Intelectual</h2>
                    <p>
                        Todo el contenido, marcas, códigos de software y arquitecturas de IA presentadas en IAUTOMAE son propiedad intelectual de la empresa o de sus respectivos licenciantes. El uso de nuestros servicios no otorga propiedad sobre el software base, sino una licencia de uso según el plan contratado.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">5. Limitación de Responsabilidad</h2>
                    <p>
                        IAUTOMAE provee soluciones de IA que dependen de modelos de terceros (como Gemini). No somos responsables por errores de interpretación de la IA o indisponibilidad técnica fuera de nuestro control. El usuario es responsable de supervisar el comportamiento de sus agentes configurados.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-tight">6. Modificaciones de los Términos</h2>
                    <p>
                        Nos reservamos el derecho de actualizar estos términos en cualquier momento para reflejar cambios en nuestros servicios o legislaciones vigentes. El uso continuado de la plataforma tras dichos cambios implica la aceptación de los nuevos términos.
                    </p>
                </section>

                <div className="pt-20 border-t border-white/10 text-center">
                    <p className="text-sm text-slate-500">Para consultas sobre estos términos, escríbanos a: <span className="text-brand-mint font-bold uppercase tracking-widest text-[10px]">legal@iautomae.com</span></p>
                </div>
            </div>
        </div>
    );
}
