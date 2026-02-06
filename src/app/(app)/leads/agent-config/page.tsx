"use client";

import React, { useState } from 'react';
import {
    ArrowLeft,
    Save,
    BrainCircuit,
    BookOpen,
    Sparkles,
    Upload,
    FileText,
    X,
    Plus
} from 'lucide-react';
import Link from 'next/link';

export default function AgentConfigPage() {
    const [activeTab, setActiveTab] = useState<'behavior' | 'knowledge'>('behavior');
    const [files, setFiles] = useState<{ name: string, size: string }[]>([]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(f => ({
                name: f.name,
                size: (f.size / 1024).toFixed(1) + ' KB'
            }));
            setFiles([...files, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(files.filter((_, i) => i !== index));
    };

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
            {/* Navigation Header */}
            <div className="flex items-center justify-between">
                <Link href="/leads" className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors group">
                    <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-sm font-medium">Volver a Leads</span>
                </Link>
                <button className="btn-primary flex items-center gap-2 shadow-lg shadow-brand-mint/20">
                    <Save size={18} />
                    Guardar Cambios
                </button>
            </div>

            <div className="space-y-1">
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Configuración del Agente</h2>
                <p className="text-gray-500">Define la personalidad y el conocimiento de tu experto en IA.</p>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('behavior')}
                    className={`px-8 py-4 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2 ${activeTab === 'behavior'
                            ? 'border-brand-mint text-brand-mint'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <BrainCircuit size={18} />
                    1. Comportamiento
                </button>
                <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`px-8 py-4 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2 ${activeTab === 'knowledge'
                            ? 'border-brand-mint text-brand-mint'
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <BookOpen size={18} />
                    2. Base de Conocimiento
                </button>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                    {activeTab === 'behavior' ? (
                        <div className="card-professional p-8 space-y-8 animate-in fade-in duration-500">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900 flex items-center gap-2">
                                        <Sparkles size={16} className="text-brand-mint" />
                                        Nombre del Agente
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Sofia de Ventas"
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900">Personalidad y Tono</label>
                                    <select className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint outline-none">
                                        <option>Profesional y Directo</option>
                                        <option>Amigable y Cercano</option>
                                        <option>Persuasivo y Energético</option>
                                        <option>Formal y Serio</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-900">Instrucciones del Sistema (Prompt)</label>
                                    <textarea
                                        rows={8}
                                        placeholder="Define cómo debe responder el agente. Ej: Eres una experta en ventas de bienes raíces. Tu objetivo es agendar una visita a la propiedad. Sé amable y responde siempre en español..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint outline-none resize-none leading-relaxed text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="card-professional p-8 space-y-8 animate-in fade-in duration-500">
                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center justify-center space-y-4 hover:border-brand-mint/50 transition-colors">
                                    <div className="w-16 h-16 rounded-full bg-brand-mint/5 flex items-center justify-center text-brand-mint">
                                        <Upload size={32} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-bold text-gray-900">Haz clic para subir archivos o arrastra y suelta</p>
                                        <p className="text-xs text-gray-500 mt-1">PDF, DOCX, TXT (Max 10MB por archivo)</p>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer px-6 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                                    >
                                        Seleccionar Archivos
                                    </label>
                                </div>

                                {files.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Archivos Subidos</h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {files.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <FileText size={18} className="text-brand-mint" />
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{file.name}</p>
                                                            <p className="text-[10px] text-gray-400">{file.size}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Sidebar Info Area */}
                <div className="space-y-6">
                    <div className="card-professional p-6 bg-brand-mint/5 border-brand-mint/10">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-brand-mint" />
                            Tips de Configuración
                        </h4>
                        <ul className="space-y-4 text-xs text-gray-600 leading-relaxed">
                            <li>
                                <span className="font-bold block text-gray-900 mb-1">Sé Específico</span>
                                Cuanto más detalle des en las instrucciones, mejor será la atención del agente.
                            </li>
                            <li>
                                <span className="font-bold block text-gray-900 mb-1">Añade FAQ</span>
                                Sube un documento con las preguntas más frecuentes de tus clientes.
                            </li>
                            <li>
                                <span className="font-bold block text-gray-900 mb-1">Define un Objetivo</span>
                                Ej: "Al final de la charla, siempre intenta pedir su WhatsApp o número de teléfono."
                            </li>
                        </ul>
                    </div>

                    <div className="card-professional p-6 border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4">Estado del Agente</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Nombre configurado</span>
                                <CheckCircle2 size={16} className="text-brand-mint" />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Instrucciones listas</span>
                                <span className="w-2 h-2 rounded-full bg-gray-200" />
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Base de conocimiento</span>
                                <span className="w-2 h-2 rounded-full bg-gray-200" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
