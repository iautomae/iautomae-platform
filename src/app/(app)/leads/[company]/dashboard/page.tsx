"use client";

import React, { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import {
    Search,
    UserPlus,
    Download,
    Mail,
    Phone,
    Calendar,
    ChevronLeft,
    ChevronRight,
    TrendingUp,
    UserCheck,
    UserX,
    MessageSquareText,
    X,
    Sparkles,
    Trash2,
    Copy,
    Settings2,
    LayoutDashboard,
    MessageSquare,
    Plus,
    Bot,
    ChevronDown,
    Activity,
    Info,
    Check,
    Camera,
    Upload,
    BarChart3,
    FileText,
    Package,
    AlertTriangle,
    Headphones,
    Volume2,
    Play
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Simplified Mock Data for UI-Only ---
const MOCK_LEADS = Array.from({ length: 15 }).map((_, i) => ({
    id: String(i + 1),
    name: `Lead Usuario ${i + 1}`,
    email: `usuario${i + 1}@ejemplo.com`,
    phone: `+51 900 000 ${String(100 + i)}`,
    date: '2024-02-06',
    status: i % 2 === 0 ? 'POTENCIAL' : 'NO POTENCIAL',
    summary: "Interesado en servicios generales. Perfil calificado visualmente.",
    score: 85
}));

const MOCK_AGENTS = [
    { id: '1', name: 'Sofia', specialty: 'Ventas Inmobiliarias', status: 'active', tokenUsage: 45 },
    { id: '2', name: 'Marcos', specialty: 'Soporte Técnico', status: 'active', tokenUsage: 12 }
];

export default function DynamicLeadsDashboard() {
    const params = useParams();
    const company = params?.company as string || 'Empresa';

    // UI States
    const [view, setView] = useState<'GALLERY' | 'LEADS'>('GALLERY');
    const [filter, setFilter] = useState<'TOTAL' | 'POTENCIAL' | 'NO POTENCIAL'>('TOTAL');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="max-w-[1200px] mx-auto py-10 animate-in fade-in duration-500">
            {/* Header with Dynamic Company Name */}
            <div className="flex items-center justify-between mb-10">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
                        Panel de {company.charAt(0).toUpperCase() + company.slice(1)}
                    </h1>
                    <p className="text-gray-500 text-sm">Gestiona tus agentes e interacciones de IA.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setView('GALLERY')}
                        className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", view === 'GALLERY' ? "bg-brand-mint text-white shadow-lg" : "bg-white text-gray-500 border border-gray-100")}
                    >
                        Mis Agentes
                    </button>
                    <button
                        onClick={() => setView('LEADS')}
                        className={cn("px-4 py-2 rounded-xl text-xs font-bold transition-all", view === 'LEADS' ? "bg-brand-mint text-white shadow-lg" : "bg-white text-gray-500 border border-gray-100")}
                    >
                        Vista Leads
                    </button>
                </div>
            </div>

            {view === 'GALLERY' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {MOCK_AGENTS.map(agent => (
                        <div key={agent.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-brand-mint/10 rounded-2xl flex items-center justify-center text-brand-mint">
                                    <Bot size={28} />
                                </div>
                                <div className="text-right">
                                    <span className="text-[10px] font-bold text-brand-mint bg-brand-mint/5 px-2 py-1 rounded-full uppercase tracking-widest">
                                        Activo
                                    </span>
                                </div>
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-1">{agent.name}</h3>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-6">{agent.specialty}</p>

                            <div className="flex gap-2">
                                <button className="flex-1 bg-gray-50 text-gray-600 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-mint/5 hover:text-brand-mint transition-all">
                                    Configurar
                                </button>
                                <button
                                    onClick={() => setView('LEADS')}
                                    className="flex-1 bg-brand-primary-darker text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                                >
                                    Ver Leads
                                </button>
                            </div>
                        </div>
                    ))}
                    {/* Add Agent Placeholder */}
                    <div className="border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center py-10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                        <Plus className="text-gray-300 mb-2" size={32} />
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Nuevo Agente</span>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Nombre</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Email</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {MOCK_LEADS.map(lead => (
                                    <tr key={lead.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-bold text-gray-900 text-sm">{lead.name}</td>
                                        <td className="px-6 py-4 text-gray-500 text-xs">{lead.email}</td>
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                lead.status === 'POTENCIAL' ? "bg-brand-mint/10 text-brand-mint" : "bg-red-50 text-red-500"
                                            )}>
                                                {lead.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-brand-mint font-bold text-[10px] uppercase tracking-widest hover:underline">
                                                Ver Chat
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
