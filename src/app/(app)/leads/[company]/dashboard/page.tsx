"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Plus, Trash2, Activity, BarChart2, CheckCircle2, X, Pencil, RefreshCw, Settings, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
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

// Placeholder agent type for better type safety
interface Agent {
    id: string;
    nombre: string;
    status: string;
    user_id: string;
    personalidad: string;
    avatar_url?: string;
    description?: string;
    prompt?: string;
    eleven_labs_agent_id?: string;
    updated_at: string;
    created_at: string;
}


export default function DynamicLeadsDashboard() {
    const params = useParams();
    const { user } = useAuth();
    const company = params?.company as string || 'Empresa';

    // UI States
    const [view, setView] = useState<'GALLERY' | 'LEADS'>('GALLERY');
    const [editableCompany, setEditableCompany] = useState(company.charAt(0).toUpperCase() + company.slice(1));
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgentStats, setSelectedAgentStats] = useState<Agent | null>(null);
    // Custom Modals State
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, name: string } | null>(null);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

    // Load Real Agents
    React.useEffect(() => {
        if (!user?.id) return;
        async function loadAgents() {
            const { data, error } = await supabase
                .from('agentes')
                .select('*')
                .eq('user_id', user!.id);
            if (data && !error) setAgents(data);
            setIsLoading(false);
        }
        loadAgents();
    }, [user]);

    const handleDeleteAgent = (agent: Agent) => {
        setDeleteConfirmation({ id: agent.id, name: agent.nombre || 'Agente sin nombre' });
    };

    const confirmDelete = async () => {
        if (!deleteConfirmation) return;
        const { id } = deleteConfirmation;
        const { error } = await supabase.from('agentes').delete().eq('id', id);
        if (!error) {
            setAgents(agents.filter(a => a.id !== id));
            setDeleteConfirmation(null);
        } else {
            setDeleteConfirmation(null);
            setInfoModal({ isOpen: true, type: 'error', message: 'Error al eliminar el agente' });
        }
    };

    const toggleAgentStatus = async (agent: Agent) => {
        const newStatus = agent.status === 'active' ? 'inactive' : 'active';
        const { error } = await supabase
            .from('agentes')
            .update({ status: newStatus })
            .eq('id', agent.id);

        if (!error) {
            setAgents(agents.map(a => a.id === agent.id ? { ...a, status: newStatus } : a));
        } else {
            console.error('Error updating status:', error);
            // If the error is about missing column, we notify the user later
            setInfoModal({ isOpen: true, type: 'error', message: 'Error al actualizar el estado.' });
        }
    };

    const handleQuickCreate = async () => {
        if (!newAgentName.trim() || !user?.id) return;
        setIsCreating(true);

        try {
            const { data, error } = await supabase
                .from('agentes')
                .insert([{
                    nombre: newAgentName.trim(),
                    user_id: user.id,
                    status: 'active',
                    personalidad: 'Profesional y Directo'
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setAgents([data, ...agents]);
                setIsCreateModalOpen(false);
                setNewAgentName('');
                setInfoModal({ isOpen: true, type: 'success', message: '¡Agente creado con éxito! Ahora puedes configurarlo.' });
            }
        } catch (error) {
            console.error(error);
            setInfoModal({ isOpen: true, type: 'error', message: 'Error al crear el agente.' });
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto py-10 animate-in fade-in duration-500 px-6">
            {/* Header with Dynamic Company Name */}
            <div className="flex items-center justify-between mb-10">
                <div className="space-y-1">
                    <div className="flex items-center gap-3 group">
                        {isEditingTitle ? (
                            <input
                                type="text"
                                value={editableCompany}
                                onChange={(e) => setEditableCompany(e.target.value)}
                                onBlur={() => setIsEditingTitle(false)}
                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
                                autoFocus
                                className="text-3xl font-bold text-gray-900 tracking-tight bg-gray-50 border-b border-brand-primary outline-none px-1"
                            />
                        ) : (
                            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                                Panel de {editableCompany}
                            </h1>
                        )}
                        <button
                            onClick={() => setIsEditingTitle(!isEditingTitle)}
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-300 hover:text-brand-primary transition-all opacity-0 group-hover:opacity-100"
                        >
                            <Pencil size={18} />
                        </button>
                    </div>
                    <p className="text-gray-500 text-sm font-medium">Gestión de Agentes IA</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                    >
                        <Plus size={16} />
                        Crear Agente
                    </button>
                </div>
            </div>

            {view === 'GALLERY' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map(agent => (
                        <div key={agent.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-visible">
                            {/* Hover Delete Button */}
                            <button
                                onClick={(e) => { e.preventDefault(); handleDeleteAgent(agent); }}
                                className="absolute right-[-14px] top-1/2 -translate-y-1/2 w-9 h-9 bg-white border border-red-100 text-red-400 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-600 flex items-center justify-center z-10"
                                title="Eliminar Agente"
                            >
                                <Trash2 size={16} />
                            </button>

                            <div className="flex items-start justify-between mb-4">
                                <div className="w-14 h-14 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner overflow-hidden">
                                    {agent.avatar_url ? (
                                        <img src={agent.avatar_url} alt={agent.nombre} className="w-full h-full object-cover" />
                                    ) : (
                                        <Bot size={28} />
                                    )}
                                </div>
                                <div className="flex flex-col items-end gap-2 text-right">
                                    {/* Switch Toggle */}
                                    <div className="flex flex-col items-end gap-1.5">
                                        <span className={cn(
                                            "text-[9px] font-bold uppercase tracking-widest transition-colors",
                                            agent.status === 'active' ? "text-brand-primary" : "text-gray-400"
                                        )}>
                                            {agent.status === 'active' ? "Activo" : "Desactivado"}
                                        </span>
                                        <div
                                            onClick={() => toggleAgentStatus(agent)}
                                            className={cn(
                                                "w-9 h-5 rounded-full relative transition-all cursor-pointer shadow-inner",
                                                agent.status === 'active' ? "bg-brand-primary/20" : "bg-gray-100 border border-gray-200"
                                            )}
                                        >
                                            <div className={cn(
                                                "absolute top-0.5 w-3.5 h-3.5 rounded-full shadow-md transition-all duration-300",
                                                agent.status === 'active' ? "right-0.5 bg-brand-primary" : "left-0.5 bg-gray-400"
                                            )} />
                                        </div>
                                    </div>
                                    {/* Stats Icon */}
                                    <button
                                        onClick={(e) => { e.preventDefault(); setSelectedAgentStats(agent); }}
                                        className="p-1.5 hover:bg-amber-50 text-gray-400 hover:text-amber-700 rounded-lg transition-colors border border-transparent hover:border-amber-200 flex items-center gap-1.5"
                                    >
                                        <BarChart2 size={14} className="text-amber-600" />
                                        <span className="text-[9px] font-bold uppercase text-amber-700/70">Uso</span>
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 mb-1">{agent.nombre || 'Agente sin nombre'}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-6">{agent.personalidad || 'Sin especialidad'}</p>

                            <div className="flex gap-2">
                                <Link
                                    href={`/leads/agent-config?id=${agent.id}`}
                                    className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all text-center flex items-center justify-center gap-2 border border-gray-100 hover:border-brand-primary shadow-sm hover:shadow-md"
                                >
                                    <Settings size={14} />
                                    Configurar
                                </Link>
                                <button
                                    onClick={() => setView('LEADS')}
                                    className="flex-1 bg-brand-primary-darker text-white py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-brand-primary-darker/10"
                                >
                                    Ver Leads
                                </button>
                            </div>
                        </div>
                    ))}

                    {isLoading && (
                        <div className="col-span-full py-20 flex flex-col items-center justify-center space-y-4">
                            <div className="w-10 h-10 border-4 border-brand-mint border-t-transparent rounded-full animate-spin" />
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cargando Agentes...</p>
                        </div>
                    )}
                    {/* Add Agent Placeholder */}
                    <div
                        onClick={() => setIsCreateModalOpen(true)}
                        className="border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center py-10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group hover:border-brand-mint/50"
                    >
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-brand-mint group-hover:bg-brand-mint/5 transition-all mb-4">
                            <Plus size={32} />
                        </div>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-brand-mint">Nuevo Agente</span>
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
            {/* Statistics Modal */}
            {selectedAgentStats && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint">
                                    <Activity size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Estadísticas de Uso</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{selectedAgentStats.nombre}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setSelectedAgentStats(null)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Hoy</p>
                                    <p className="text-2xl font-black text-gray-900">452 <span className="text-[10px] font-bold text-gray-400">Tokens</span></p>
                                </div>
                                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Este Mes</p>
                                    <p className="text-2xl font-black text-gray-900">12.4k <span className="text-[10px] font-bold text-gray-400">Tokens</span></p>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Actividad Reciente</h4>
                                <div className="space-y-2">
                                    {[1, 2, 3].map(i => (
                                        <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-xl text-xs">
                                            <span className="text-gray-500 font-medium">0{i} Feb, 2024</span>
                                            <span className="font-bold text-brand-mint">+120 tokens</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => setSelectedAgentStats(null)}
                                className="w-full py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-gray-900/10"
                            >
                                Cerrar Ventanilla
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Quick Create Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint">
                                    <Plus size={20} />
                                </div>
                                <h3 className="font-bold text-gray-900">Nuevo Agente</h3>
                            </div>
                            <button
                                onClick={() => setIsCreateModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre del Agente</label>
                                <input
                                    type="text"
                                    value={newAgentName}
                                    onChange={(e) => setNewAgentName(e.target.value)}
                                    placeholder="Ej: Sofia de Ventas"
                                    autoFocus
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-mint/20 focus:border-brand-mint outline-none text-gray-900 font-bold placeholder:text-gray-300 transition-all font-mono"
                                />
                            </div>

                            <div className="flex gap-3">
                                <button
                                    onClick={() => setIsCreateModalOpen(false)}
                                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleQuickCreate}
                                    disabled={isCreating || !newAgentName.trim()}
                                    className="flex-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-gray-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isCreating ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                                    Crear Agente
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmation && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Agente?</h3>
                        <p className="text-sm text-gray-500 mb-8">
                            Estás a punto de eliminar a <span className="font-bold text-gray-900">{deleteConfirmation.name}</span>. Esta acción no se puede deshacer.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeleteConfirmation(null)}
                                className="flex-1 py-3 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info/Success/Error Modal */}
            {infoModal.isOpen && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
                        <div className={cn(
                            "w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4",
                            infoModal.type === 'success' ? "bg-brand-mint/10 text-brand-mint" : "bg-red-50 text-red-500"
                        )}>
                            {infoModal.type === 'success' ? <CheckCircle2 size={32} /> : <X size={32} />}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {infoModal.type === 'success' ? '¡Éxito!' : 'Ups, algo pasó'}
                        </h3>
                        <p className="text-sm text-gray-500 mb-8 font-medium">
                            {infoModal.message}
                        </p>
                        <button
                            onClick={() => setInfoModal({ ...infoModal, isOpen: false })}
                            className="w-full py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
