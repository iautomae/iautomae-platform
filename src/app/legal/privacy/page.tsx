import React from 'react';

export default function PrivacyPage() {
    return (
        <div className="space-y-12">
            <header className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Política de <span className="text-brand-mint">Privacidad</span>
                </h1>
                <p className="text-slate-400 text-lg">
                    Cómo protegemos y gestionamos tus datos en Iautomae Systems.
                </p>
            </header>

            <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. Recopilación de Información</h2>
                    <p>
                        En Iautomae Systems, recopilamos información necesaria para proporcionar nuestros servicios de automatización e inteligencia artificial. Esto incluye nombres, correos electrónicos y datos operativos que decidas integrar en nuestra plataforma para optimizar tus procesos.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. Uso de Inteligencia Artificial</h2>
                    <p>
                        Utilizamos modelos de IA avanzados para el procesamiento de documentos, análisis de leads y automatización de tareas. Nos comprometemos a que el uso de estos datos sea estrictamente para la mejora de tus servicios y nunca compartiremos información sensible con terceros con fines comerciales sin tu consentimiento explícito.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Seguridad de los Datos</h2>
                    <p>
                        Implementamos capas de seguridad de grado industrial para proteger tu información de accesos no autorizados. Tu data reside en servidores seguros y cifrados utilizando los estándares actuales de la tecnología en la nube.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">4. Contacto</h2>
                    <p>
                        Para cualquier consulta sobre tus datos o para ejercer tus derechos de acceso y rectificación, puedes escribirnos directamente a:
                        <br />
                        <span className="text-brand-mint font-mono mt-2 block">admin@iautomae.com</span>
                    </p>
                </section>

                <div className="pt-10 border-t border-white/5">
                    <p className="text-xs text-slate-500 italic">
                        Iautomae Systems - Lima, Perú.
                    </p>
                </div>
            </div>
        </div>
    );
}
