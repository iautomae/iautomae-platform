"use client";

import React from 'react';
import {
    FileArchive,
    Layers,
    MousePointer2,
    ArrowRight,
    Gauge,
    Image as ImageIcon,
    FileText
} from 'lucide-react';
import { NeuralNetworkBackground } from '@/components/NeuralNetworkBackground';
import { CompressionAnimation } from '@/components/CompressionAnimation';

export default function CompressorLanding() {
    return (
        <div className="relative w-full">
            <NeuralNetworkBackground />

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-8 overflow-hidden">
                <div className="max-w-7xl mx-auto text-center space-y-12 relative z-10">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-mint/10 border border-brand-mint/30 backdrop-blur-sm mb-4">
                            <span className="w-2 h-2 rounded-full bg-brand-mint animate-pulse" />
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-mint">Control de precisión total</span>
                        </div>

                        <h1 className="text-5xl md:text-7xl font-bold text-white tracking-tight leading-[1.1] animate-in fade-in slide-in-from-bottom-6 duration-700">
                            COMPRESIÓN <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-white/80">AL DETALLE.</span>
                        </h1>

                        <p className="max-w-2xl mx-auto text-lg text-slate-300 font-medium leading-relaxed">
                            Olvida las opciones de "Baja, Media y Alta". Nuestro compresor inteligente te permite nivelar la calidad y el peso de tus PDFs e Imágenes con precisión quirúrgica.
                        </p>
                    </div>

                    <div className="py-10">
                        <CompressionAnimation />
                    </div>

                    <div className="flex flex-col md:flex-row items-center justify-center gap-6 pt-6">
                        <button className="px-10 py-5 bg-brand-mint text-black font-black uppercase tracking-widest text-xs rounded-full shadow-2xl shadow-brand-mint/20 flex items-center gap-2">
                            Probar Compresor Gratis <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Features Grid */}
            <section className="py-24 px-8 relative z-10">
                <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="w-12 h-12 bg-brand-mint/20 text-brand-mint rounded-2xl flex items-center justify-center mb-8">
                            <Gauge size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Nivel Analógico</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Controla el porcentaje exacto de compresión. Visualiza el peso final antes de procesar el archivo.</p>
                    </div>

                    <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="w-12 h-12 bg-brand-mint/20 text-brand-mint rounded-2xl flex items-center justify-center mb-8">
                            <ImageIcon size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Optimizador Visual</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Algoritmos inteligentes que eliminan datos innecesarios sin sacrificar la nitidez de tus fotos.</p>
                    </div>

                    <div className="p-10 rounded-[40px] bg-white/5 border border-white/10 backdrop-blur-md">
                        <div className="w-12 h-12 bg-brand-mint/20 text-brand-mint rounded-2xl flex items-center justify-center mb-8">
                            <FileText size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-4 uppercase tracking-tight">Gestión de PDFs</h3>
                        <p className="text-slate-400 text-sm leading-relaxed">Reduce el peso de documentos legales y presentaciones pesadas manteniendo la legibilidad total.</p>
                    </div>
                </div>
            </section>

            {/* Trust / Call to action */}
            <section className="py-32 px-8 text-center relative z-10 border-t border-white/5">
                <div className="max-w-4xl mx-auto space-y-12">
                    <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight uppercase leading-[1.1]">
                        Únete a los profesionales que <br /> valoran su almacenamiento.
                    </h2>
                    <p className="text-slate-400 font-medium">Ideal para diseñadores, abogados y empresas con gran volumen de documentos.</p>
                    <button className="px-12 py-6 bg-white text-black font-black uppercase tracking-widest text-xs rounded-full hover:bg-brand-mint transition-all">
                        Crear Cuenta y Optimizar
                    </button>
                </div>
            </section>
        </div>
    );
}
