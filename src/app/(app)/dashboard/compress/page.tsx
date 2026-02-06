"use client";

import React, { useState, useEffect } from 'react';
import {
    FileUp,
    Settings2,
    Download,
    RefreshCcw,
    CheckCircle2,
    AlertCircle,
    Gauge,
    Image as ImageIcon,
    Minus,
    Plus,
    Infinity,
    Zap,
    ArrowRight,
    FileText,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export default function CompressorTool() {
    // States
    const [file, setFile] = useState<File | null>(null);
    const [quality, setQuality] = useState(70);
    const [dpi, setDpi] = useState(150);
    const [grayscale, setGrayscale] = useState(false);
    const [removeMetadata, setRemoveMetadata] = useState(true);
    const [optimizationLevel, setOptimizationLevel] = useState(1);
    const [isCompressing, setIsCompressing] = useState(false);
    const [result, setResult] = useState<{ url: string; size: number } | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [estimatedSize, setEstimatedSize] = useState<number | null>(null);

    // Live Simulator Logic
    useEffect(() => {
        if (!file) {
            setEstimatedSize(null);
            return;
        }

        const formatMultipliers = [0.95, 0.75, 0.55]; // Original, JPG, WebP
        const qFactor = (quality / 100) * 0.8 + 0.2;
        const dFactor = Math.pow(dpi / 150, 0.4);
        const sFactor = formatMultipliers[optimizationLevel];

        let est = file.size * qFactor * dFactor * sFactor;
        if (grayscale) est *= 0.85;
        if (removeMetadata) est *= 0.98;

        setEstimatedSize(Math.min(file.size * 0.98, est));
    }, [file, quality, dpi, optimizationLevel, grayscale, removeMetadata]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const f = e.target.files[0];
            setFile(f);
            setResult(null);
            setPreviewUrl(URL.createObjectURL(f));
        }
    };

    const handleCompress = async () => {
        if (!file) return;

        setIsCompressing(true);
        const formData = new FormData();
        formData.append('file', file);
        const format = ['original', 'jpg', 'webp'][optimizationLevel];
        formData.append('quality', quality.toString());
        formData.append('dpi', dpi.toString());
        formData.append('grayscale', grayscale.toString());
        formData.append('removeMetadata', removeMetadata.toString());
        formData.append('forceFormat', format);
        if (estimatedSize) {
            formData.append('targetWeight', Math.round(estimatedSize / 1024).toString());
        }

        try {
            const res = await fetch('/api/compress', {
                method: 'POST',
                body: formData,
            });

            if (!res.ok) throw new Error('Compression failed');

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            setResult({ url, size: blob.size });
        } catch (err) {
            console.error(err);
            alert('Error comprimiendo el archivo');
        } finally {
            setIsCompressing(false);
        }
    };

    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500 p-4 md:p-6">
            {/* Minimal Header */}
            <div className="flex justify-between items-center py-2">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-black text-gray-900 tracking-tight uppercase">Control de Compresión</h2>
                    <div className="bg-brand-mint/10 px-3 py-1 rounded-full border border-brand-mint/20">
                        <span className="text-[10px] font-bold text-brand-mint uppercase tracking-widest flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-brand-mint animate-pulse" /> v1.1 Professional
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                {/* LEFT SIDE: Inputs (Col 1-7) */}
                <div className="lg:col-span-7 flex flex-col gap-6 h-full">
                    {/* Compact Upload Box */}
                    <div className="card-professional p-6 border-dashed border-2 bg-gray-50/50 hover:bg-white hover:border-brand-mint/50 transition-all group flex items-center justify-between">
                        {file ? (
                            <div className="flex items-center gap-4 w-full">
                                <div className="w-12 h-12 bg-brand-mint text-white rounded-2xl flex items-center justify-center shrink-0 shadow-lg shadow-brand-mint/20">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-gray-900 text-base truncate">{file.name}</p>
                                    <p className="text-xs text-gray-500 font-medium">{formatSize(file.size)}</p>
                                </div>
                                <button
                                    onClick={() => { setFile(null); setResult(null); setPreviewUrl(null); }}
                                    className="text-xs font-bold text-red-500 uppercase tracking-tight hover:bg-red-50 px-4 py-2.5 rounded-xl transition-colors"
                                >
                                    Cambiar Archivo
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-5">
                                    <div className="w-12 h-12 bg-gray-200 text-gray-400 rounded-2xl flex items-center justify-center">
                                        <FileUp size={24} />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-gray-900 text-base">Carga tu archivo</h3>
                                        <p className="text-[10px] text-gray-500 font-medium">Selecciona el tipo de documento</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 w-full max-w-sm">
                                    <label className="flex-1 px-4 py-2.5 bg-red-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer hover:bg-red-700 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                                        <FileText size={14} /> PDF
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept=".pdf" />
                                    </label>
                                    <label className="flex-1 px-4 py-2.5 bg-sky-400 text-white text-[10px] font-black uppercase tracking-widest rounded-xl cursor-pointer hover:bg-sky-500 transition-all shadow-md active:scale-95 flex items-center justify-center gap-2">
                                        <ImageIcon size={14} /> Imagen
                                        <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*" />
                                    </label>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Compact Lab View */}
                    <div className="card-professional p-8 space-y-8 flex-1 flex flex-col justify-between">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Settings2 size={20} className="text-brand-mint" />
                                    <h3 className="font-black text-gray-900 uppercase tracking-tight text-sm">Laboratorio de Calibración</h3>
                                </div>
                            </div>

                            {/* Middle Calibration Row: 2 Columns Grid for sliders */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* 1. QUALITY */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <Gauge size={14} className="text-gray-300" /> Nivel de Calidad
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setQuality(Math.max(1, quality - 5))} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><Minus size={14} /></button>
                                            <span className="text-sm font-black text-brand-mint w-8 text-center">{quality}%</span>
                                            <button onClick={() => setQuality(Math.min(100, quality + 5))} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <input type="range" min="1" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-full accent-brand-mint h-1.5" />
                                </div>

                                {/* 2. RESOLUTION */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            <ImageIcon size={14} className="text-gray-300" /> Definición (DPI)
                                        </label>
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setDpi(Math.max(72, dpi - 10))} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><Minus size={14} /></button>
                                            <span className="text-sm font-black text-brand-mint w-10 text-center">{dpi}</span>
                                            <button onClick={() => setDpi(Math.min(600, dpi + 10))} className="p-1 hover:bg-gray-100 rounded-lg text-gray-400"><Plus size={14} /></button>
                                        </div>
                                    </div>
                                    <input type="range" min="72" max="600" value={dpi} onChange={(e) => setDpi(parseInt(e.target.value))} className="w-full accent-brand-mint h-1.5" />
                                </div>
                            </div>

                            {/* 3. STRATEGY (Now below sliders) */}
                            <div className="space-y-4 pt-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Zap size={14} className="text-gray-300" /> Algoritmo de Optimización
                                </label>
                                <div className="grid grid-cols-3 gap-3">
                                    {[
                                        { l: 'Original', t: 'Sin cambios', d: 'Mantiene estructura' },
                                        { l: 'Equilibrado', t: 'JPG Opt.', d: 'Mejor relación peso/calidad' },
                                        { l: 'Máximo', t: 'WebP IA', d: 'Compresión extrema' }
                                    ].map((opt, i) => (
                                        <button
                                            key={opt.l}
                                            onClick={() => setOptimizationLevel(i)}
                                            title={opt.d}
                                            className={cn(
                                                "flex flex-col items-center justify-center p-4 rounded-2xl border transition-all leading-tight group/btn text-center",
                                                optimizationLevel === i
                                                    ? "bg-brand-mint text-black border-brand-mint shadow-lg shadow-brand-mint/20"
                                                    : "bg-gray-50 text-gray-400 border-gray-100 hover:border-gray-200"
                                            )}
                                        >
                                            <span className="text-xs font-black uppercase tracking-tight">{opt.l}</span>
                                            <span className="text-[9px] opacity-60 font-bold mt-1">{opt.t}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Bottom Row: Enhanced Toggles */}
                            <div className="pt-8 border-t border-gray-100">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <label className="flex items-center gap-4 cursor-pointer group bg-gray-50/50 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                        <div className="flex-1">
                                            <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-tight">Modo Blanco y Negro</h4>
                                            <p className="text-[9px] text-gray-500 font-bold leading-tight mt-0.5">Perfecto para imprimir o ahorrar espacio extremo.</p>
                                        </div>
                                        <div onClick={(e) => { e.preventDefault(); setGrayscale(!grayscale); }} className={cn("relative w-12 h-6 rounded-full transition-all flex items-center px-1 shrink-0", grayscale ? 'bg-brand-mint' : 'bg-gray-200')}>
                                            <div className={cn("w-4 h-4 bg-white rounded-full transition-transform shadow-sm", grayscale ? 'translate-x-6' : 'translate-x-0')} />
                                        </div>
                                        <input type="checkbox" className="sr-only" checked={grayscale} readOnly />
                                    </label>

                                    <label className="flex items-center gap-4 cursor-pointer group bg-gray-50/50 p-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                                        <div className="flex-1">
                                            <h4 className="text-[11px] font-black text-gray-800 uppercase tracking-tight">Eliminar Metadatos</h4>
                                            <p className="text-[9px] text-gray-500 font-bold leading-tight mt-0.5">Elimina información técnica e invisible para aligerar el archivo.</p>
                                        </div>
                                        <div onClick={(e) => { e.preventDefault(); setRemoveMetadata(!removeMetadata); }} className={cn("relative w-12 h-6 rounded-full transition-all flex items-center px-1 shrink-0", removeMetadata ? 'bg-brand-mint' : 'bg-gray-200')}>
                                            <div className={cn("w-4 h-4 bg-white rounded-full transition-transform shadow-sm", removeMetadata ? 'translate-x-6' : 'translate-x-0')} />
                                        </div>
                                        <input type="checkbox" className="sr-only" checked={removeMetadata} readOnly />
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RIGHT SIDE: Monitor (Col 8-12) */}
                <div className="lg:col-span-5 flex flex-col gap-6">
                    <div className="card-professional bg-black text-white p-6 flex flex-col h-full relative overflow-hidden group/monitor shadow-2xl">
                        <div className="flex justify-between items-center mb-4 px-2">
                            <h4 className="font-black uppercase tracking-widest text-[11px] text-brand-mint flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-brand-mint animate-pulse" /> Monitor Quirúrgico
                            </h4>
                            {result ? (
                                <div className="flex items-center gap-2 bg-brand-mint/20 px-3 py-1 rounded-full border border-brand-mint/30 animate-pulse">
                                    <CheckCircle2 size={12} className="text-brand-mint" />
                                    <span className="text-[9px] font-black text-brand-mint uppercase">Optimizado</span>
                                </div>
                            ) : (
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Live Preview</span>
                            )}
                        </div>

                        {/* PDF PREVIEW BOX - MAX COMPACT */}
                        <div className="flex-1 rounded-2xl bg-white/5 border border-white/10 overflow-hidden relative group/frame p-12 flex items-center justify-center">
                            {previewUrl ? (
                                <div
                                    className="w-full h-full flex items-center justify-center transition-all duration-500 overflow-hidden"
                                    style={{
                                        filter: `
                                            grayscale(${grayscale ? 1 : 0}) 
                                            blur(${(100 - quality) / 100 * 0.8}px)
                                            contrast(${100 + (quality - 70) * 0.1}%)
                                            brightness(${100 - (100 - quality) * 0.05}%)
                                        `,
                                        msOverflowStyle: 'none',
                                        scrollbarWidth: 'none'
                                    }}
                                >
                                    {file?.type.startsWith('image/') ? (
                                        <img
                                            src={previewUrl}
                                            alt="Preview"
                                            className="max-w-full max-h-full object-contain animate-in fade-in zoom-in-95 duration-700 select-none"
                                        />
                                    ) : (
                                        <iframe
                                            src={`${previewUrl}#view=Fit&toolbar=0&navpanes=0&scrollbar=0`}
                                            className="w-full h-full border-none pointer-events-none animate-in fade-in zoom-in-95 duration-700 overflow-hidden"
                                            style={{ scrollbarWidth: 'none' }}
                                            scrolling="no"
                                        />
                                    )}
                                </div>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20 group-hover/frame:opacity-40 transition-opacity">
                                    <div className="w-20 h-20 border-2 border-dashed border-white/40 rounded-3xl flex items-center justify-center mb-4">
                                        <ImageIcon size={40} />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]">Esperando Datos...</p>
                                </div>
                            )}
                        </div>

                        {/* Compact Action Area */}
                        <div className="mt-6 space-y-4">
                            {result ? (
                                <div className="space-y-4 animate-in zoom-in-95 duration-500">
                                    <div className="flex items-center justify-between p-5 bg-brand-mint/10 border border-brand-mint/20 rounded-2xl backdrop-blur-sm">
                                        <div className="space-y-1">
                                            <p className="text-[10px] font-bold text-brand-mint uppercase tracking-widest">Compresión Final</p>
                                            <p className="text-3xl font-black text-white">{formatSize(result.size)}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-gray-500 line-through mb-1">{formatSize(file?.size || 0)}</p>
                                            <span className="px-3 py-1 bg-brand-mint text-black text-xs font-black rounded-full shadow-lg">
                                                -{Math.round((1 - result.size / (file?.size || 1)) * 100)}%
                                            </span>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <a href={result.url} download={`IA_OPT_${file?.name.toUpperCase()}`} className="py-4 bg-brand-mint text-black font-black uppercase tracking-widest text-xs rounded-xl flex items-center justify-center gap-2 hover:bg-white hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-brand-mint/20">
                                            Descargar <Download size={18} />
                                        </a>
                                        <button onClick={() => { setResult(null); setPreviewUrl(URL.createObjectURL(file!)); }} className="py-4 border-2 border-white/20 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/5 transition-all active:scale-95 flex items-center justify-center gap-2">
                                            Re-Calibrar <RefreshCcw size={16} />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {/* LIVE WEIGHT ANALYSIS (Relocated here) */}
                                    {file && estimatedSize && (
                                        <div className="flex items-center justify-between px-2 animate-in fade-in slide-in-from-bottom-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Análisis en tiempo real</span>
                                            </div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-[10px] font-bold text-gray-500 uppercase">Peso Estimado:</span>
                                                <span className="text-lg font-black text-orange-500 tracking-tight">{formatSize(estimatedSize)}</span>
                                            </div>
                                        </div>
                                    )}
                                    <button
                                        onClick={handleCompress}
                                        disabled={!file || isCompressing}
                                        className="w-full py-5 bg-brand-mint text-black font-black uppercase tracking-widest text-sm rounded-2xl flex items-center justify-center gap-3 hover:bg-orange-500 hover:text-white hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 shadow-[0_0_30px_rgba(44,219,155,0.2)] group hover:shadow-[0_0_30px_rgba(249,115,22,0.4)]"
                                    >
                                        {isCompressing ? (
                                            <>Procesando Algoritmos... <RefreshCcw size={24} className="animate-spin" /></>
                                        ) : (
                                            <>Ejecutar Optimización <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" /></>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Integrated Footer */}
                        <div className="mt-auto text-center border-t border-white/5 pt-6">
                            <p className="text-[9px] text-gray-500 leading-tight uppercase font-black tracking-widest opacity-40">
                                * Procesamiento local encriptado. Privacidad de iAutomate Labs.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
