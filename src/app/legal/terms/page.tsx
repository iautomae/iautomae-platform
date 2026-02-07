import React from 'react';

export default function TermsPage() {
    return (
        <div className="space-y-12">
            <header className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white">
                    Términos y <span className="text-brand-mint">Condiciones</span>
                </h1>
                <p className="text-slate-400 text-lg">
                    Reglas y responsabilidades para el uso de nuestra tecnología.
                </p>
            </header>

            <div className="prose prose-invert max-w-none space-y-8 text-slate-300">
                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">1. Aceptación de los Términos</h2>
                    <p>
                        Al acceder y utilizar los servicios de Iautomae Systems, aceptas estar sujeto a estos términos. Nuestra plataforma ofrece soluciones de automatización y desarrollo de software basadas en Inteligencia Artificial y otras tecnologías modernas.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">2. Propiedad Intelectual</h2>
                    <p>
                        Todo el software, algoritmos y procesos desarrollados por Iautomae Systems son propiedad exclusiva de la empresa. El cliente recibe una licencia de uso de acuerdo con el plan contratado, sin derecho a la redistribución o ingeniería inversa del código fuente.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">3. Responsabilidad de la IA</h2>
                    <p>
                        Nuestras herramientas de IA están diseñadas para asistir y automatizar procesos humanos. Aunque buscamos la máxima precisión, Iautomae Systems no se hace responsable por decisiones comerciales tomadas basadas exclusivamente en el output de la IA sin supervisión humana.
                    </p>
                </section>

                <section className="space-y-4">
                    <h2 className="text-xl font-bold text-white uppercase tracking-wider">4. Ley Aplicable</h2>
                    <p>
                        Estos términos se rigen por las leyes de la República del Perú. Cualquier controversia será resuelta en las jurisdicciones competentes de la ciudad de Lima.
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
