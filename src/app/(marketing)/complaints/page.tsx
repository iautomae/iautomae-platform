"use client";

import React, { useState } from 'react';
import {
    ClipboardList,
    User,
    Mail,
    Phone,
    Home,
    AlertCircle,
    CheckCircle2,
    ArrowRight,
    Search,
    FileText
} from 'lucide-react';

export default function ComplaintsPage() {
    const [formData, setFormData] = useState({
        full_name: '',
        document_type: 'DNI',
        document_number: '',
        email: '',
        phone: '',
        address: '',
        complaint_type: 'RECLAMO', // RECLAMO o QUEJA
        detail: '',
        request: '',
    });

    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        // Simulamos envío
        setTimeout(() => {
            setLoading(false);
            setSubmitted(true);
        }, 1500);
    };

    if (submitted) {
        return (
            <div className="min-h-screen pt-32 pb-20 px-8 flex items-center justify-center">
                <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-[40px] p-10 text-center space-y-6 backdrop-blur-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-brand-mint/10 blur-[60px] -mr-16 -mt-16" />
                    <div className="w-20 h-20 bg-brand-mint/20 rounded-2xl flex items-center justify-center text-brand-mint mx-auto">
                        <CheckCircle2 size={40} />
                    </div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">¡REGISTRO EXITOSO!</h1>
                    <p className="text-slate-400 text-sm leading-relaxed">
                        Tu {formData.complaint_type.toLowerCase()} ha sido registrada correctamente. Hemos enviado una copia del detalle a tu correo electrónico: <strong>{formData.email}</strong>.
                    </p>
                    <button
                        onClick={() => window.location.href = '/home'}
                        className="w-full py-4 bg-brand-mint text-black font-black uppercase tracking-widest text-xs rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-brand-mint/20"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-32 pb-24 px-8 relative overflow-hidden">
            {/* Background Decorative */}
            <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-mint/5 blur-[120px] rounded-full -z-10" />

            <div className="max-w-4xl mx-auto space-y-12 relative z-10">
                {/* Header */}
                <div className="space-y-4 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-mint/10 border border-brand-mint/30 backdrop-blur-sm mb-4">
                        <ClipboardList size={14} className="text-brand-mint" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-brand-mint">Atención al cliente</span>
                    </div>
                    <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                        Libro de <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-mint to-white/80">Reclamaciones</span>
                    </h1>
                    <p className="max-w-xl text-slate-400 font-medium leading-relaxed">
                        Conforme a lo establecido en el Código de Protección y Defensa del Consumidor, ponemos a su disposición nuestro libro virtual para registrar sus quejas o reclamos.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Sección 1: Identificación */}
                    <div className="space-y-8 bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-md">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <User size={18} className="text-brand-mint" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">1. Datos Personales</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Nombre Completo</label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm"
                                    placeholder="Juan Perez..."
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Doc.</label>
                                    <select
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm appearance-none cursor-pointer"
                                        value={formData.document_type}
                                        onChange={e => setFormData({ ...formData, document_type: e.target.value })}
                                    >
                                        <option value="DNI" className="bg-slate-900">DNI</option>
                                        <option value="CE" className="bg-slate-900">CE</option>
                                        <option value="PASS" className="bg-slate-900">PASS</option>
                                    </select>
                                </div>
                                <div className="col-span-2 space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Número de Documento</label>
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm"
                                        placeholder="00000000"
                                        value={formData.document_number}
                                        onChange={e => setFormData({ ...formData, document_number: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Email</label>
                                    <div className="relative">
                                        <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            required
                                            type="email"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm"
                                            placeholder="correo@ejemplo.com"
                                            value={formData.email}
                                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Teléfono</label>
                                    <div className="relative">
                                        <Phone size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                        <input
                                            required
                                            type="tel"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm"
                                            placeholder="999 999 999"
                                            value={formData.phone}
                                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Dirección</label>
                                <div className="relative">
                                    <Home size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input
                                        required
                                        type="text"
                                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm"
                                        placeholder="Av. Las Camelias 123..."
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Sección 2: Detalle */}
                    <div className="space-y-8 bg-white/5 border border-white/10 rounded-[40px] p-8 backdrop-blur-md">
                        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                            <FileText size={18} className="text-brand-mint" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">2. Detalle del Reclamo</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Tipo de Incidencia</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, complaint_type: 'RECLAMO' })}
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.complaint_type === 'RECLAMO' ? 'bg-brand-mint text-black border-brand-mint' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'}`}
                                    >
                                        Reclamo
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, complaint_type: 'QUEJA' })}
                                        className={`py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border ${formData.complaint_type === 'QUEJA' ? 'bg-brand-mint text-black border-brand-mint' : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/30'}`}
                                    >
                                        Queja
                                    </button>
                                </div>
                                <p className="text-[9px] text-slate-500 italic mt-2 px-1">
                                    {formData.complaint_type === 'RECLAMO'
                                        ? '* Reclamo: Insatisfacción ante el producto o servicio contratado.'
                                        : '* Queja: Malestar o descontento respecto a la atención recibida.'}
                                </p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Detalle del {formData.complaint_type.toLowerCase()}</label>
                                <textarea
                                    required
                                    rows={4}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm resize-none"
                                    placeholder="Describa lo sucedido de forma breve y clara..."
                                    value={formData.detail}
                                    onChange={e => setFormData({ ...formData, detail: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1">Pedido del Consumidor</label>
                                <textarea
                                    required
                                    rows={3}
                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white/10 transition-all font-medium text-sm resize-none"
                                    placeholder="¿Qué solución espera recibir?..."
                                    value={formData.request}
                                    onChange={e => setFormData({ ...formData, request: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="md:col-span-2 text-center pt-8">
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative px-16 py-6 bg-brand-mint text-black font-black uppercase tracking-[0.2em] text-sm rounded-full overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-2xl shadow-brand-mint/40 disabled:opacity-50 disabled:grayscale"
                        >
                            <span className="relative z-10 flex items-center justify-center gap-3">
                                {loading ? 'Enviando...' : 'Registrar Reclamación'}
                                {!loading && <ArrowRight size={18} className="translate-y-[-1px] transition-transform group-hover:translate-x-1" />}
                            </span>
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                        </button>
                        <p className="mt-6 text-[10px] text-slate-500 font-bold uppercase tracking-widest opacity-60">
                            IAUTOMAE gestionará su respuesta en un plazo máximo de 15 días hábiles.
                        </p>
                    </div>
                </form>
            </div>
        </div>
    );
}
