"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { Plus, Trash2, Activity, BarChart2, CheckCircle2, X, Pencil, RefreshCw, Settings, Bot, Download, Lock, Check, ArrowLeft, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight, Bell, RotateCcw, Shield, ShieldCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Lead Interface for Real Data ---
interface Lead {
    id: string;
    name: string;
    phone: string;
    date: string;
    time: string;
    status: 'POTENCIAL' | 'NO_POTENCIAL';
    summary: string;
    score: number;
    transcript: { role: string; message?: string; text?: string; time?: string }[];
    created_at: string;
}

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
    pushover_user_key?: string;
    pushover_api_token?: string;
    pushover_template?: string;
    pushover_title?: string;
    pushover_notification_filter?: 'ALL' | 'POTENTIAL_ONLY' | 'NO_POTENTIAL_ONLY';
    make_webhook_url?: string;
    updated_at: string;
    created_at: string;
}


export default function DynamicLeadsDashboard() {
    const params = useParams();
    const searchParams = useSearchParams();
    const { user } = useAuth();
    const { profile } = useProfile();
    const company = params?.company as string || 'Empresa';

    // Admin View Login: Check if viewing as another user
    const viewAsUid = searchParams.get('view_as');
    const isAdmin = profile?.role === 'admin';
    const targetUid = (isAdmin && viewAsUid) ? viewAsUid : user?.id;

    // UI States
    const [view, setView] = useState<'GALLERY' | 'LEADS'>('GALLERY');
    const [editableCompany, setEditableCompany] = useState(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem(`panel_name_${company}`);
            if (saved) return saved;
        }
        return company.charAt(0).toUpperCase() + company.slice(1);
    });
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newAgentName, setNewAgentName] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedAgentStats, setSelectedAgentStats] = useState<Agent | null>(null);
    const [activeAgentId, setActiveAgentId] = useState<string | null>(null);



    // Lead Stats
    const [realLeads, setRealLeads] = useState<Lead[]>([]);

    const fetchLeads = React.useCallback(async () => {
        if (!targetUid || !activeAgentId) {
            if (view === 'LEADS' && !activeAgentId) setView('GALLERY');
            return;
        }

        // setIsLoadingLeads(true);
        const { data: leadData, error } = await supabase
            .from('leads')
            .select('*')
            .eq('agent_id', activeAgentId) // Filter by active agent
            .eq('user_id', targetUid)         // STRICT: Filter by target user
            .order('created_at', { ascending: false });

        if (leadData && !error) {
            const formattedLeads: Lead[] = leadData.map((l: {
                id: string;
                created_at: string;
                nombre?: string;
                phone?: string;
                status?: string;
                summary?: string;
                transcript?: { role: string; message?: string; text?: string; time?: string }[];
                score?: number
            }) => {
                const dateObj = new Date(l.created_at);
                return {
                    id: l.id,
                    phone: l.phone || 'No proveído',
                    transcript: l.transcript || [],
                    created_at: l.created_at,
                    name: l.nombre || 'Lead Desconocido',
                    date: dateObj.toLocaleDateString('es-ES'),
                    time: dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
                    status: (l.status as 'POTENCIAL' | 'NO_POTENCIAL') || 'POTENCIAL',
                    summary: l.summary || 'Sin resumen',
                    score: l.score || 0
                };
            });
            setRealLeads(formattedLeads);
        } else if (error) {
            console.error('Error fetching leads:', error);
        }
        // setIsLoadingLeads(false);
    }, [user, activeAgentId, view]);

    // Side Panel State
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
    const [panelTab, setPanelTab] = useState<'SUMMARY' | 'CHAT'>('SUMMARY');
    const [messages, setMessages] = useState<{ role: 'user' | 'assistant', text: string }[]>([]);

    // Filter State
    const [filterStatus, setFilterStatus] = useState<'ALL' | 'POTENCIAL' | 'NO_POTENCIAL'>('ALL');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(15);

    // Lead filtering and pagination logic
    const filteredLeads = realLeads.filter(lead => {
        if (filterStatus === 'ALL') return true;
        return lead.status === filterStatus;
    });

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const paginatedLeads = filteredLeads.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredLeads.length / itemsPerPage);

    // Modal States
    const [deleteConfirmation, setDeleteConfirmation] = useState<{ id: string, name: string } | null>(null);
    const [deleteInput, setDeleteInput] = useState('');
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

    // Safety check: ensure activeAgentId belongs to the current user
    React.useEffect(() => {
        if (activeAgentId && agents.length > 0 && !isLoading) {
            const isOwned = agents.some(a => a.id === activeAgentId);
            if (!isOwned) {
                console.warn('❌ Attempted access to unowned agent:', activeAgentId);
                setActiveAgentId(null);
                setView('GALLERY');
            }
        }
    }, [activeAgentId, agents, isLoading]);

    // Fetch leads effect with realtime subscription
    React.useEffect(() => {
        if (view === 'LEADS' && user?.id) {
            fetchLeads();

            const channel = supabase
                .channel('realtime-leads-dashboard')
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'leads' },
                    () => fetchLeads()
                )
                .on(
                    'postgres_changes',
                    { event: 'DELETE', schema: 'public', table: 'leads' },
                    () => fetchLeads()
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [view, user, fetchLeads]);

    // Load Real Agents
    React.useEffect(() => {
        if (!targetUid) {
            setAgents([]);
            return;
        }
        async function loadAgents() {
            setIsLoading(true);
            const { data, error } = await supabase
                .from('agentes')
                .select('*')
                .eq('user_id', targetUid)
                .order('created_at', { ascending: true });
            if (data && !error) {
                setAgents(data);
            } else {
                setAgents([]);
            }
            setIsLoading(false);
        }
        loadAgents();
    }, [targetUid]);

    // Import Modal States
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importKey, setImportKey] = useState('');
    const [importKeyError, setImportKeyError] = useState('');
    const [importStep, setImportStep] = useState<'key' | 'select'>('key');
    const [importableAgents, setImportableAgents] = useState<{ agent_id: string; name?: string }[]>([]);
    const [selectedImports, setSelectedImports] = useState<Set<string>>(new Set());
    const [isLoadingImports, setIsLoadingImports] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    // Pushover States
    const [isPushoverModalOpen, setIsPushoverModalOpen] = useState(false);
    const [configuringAgent, setConfiguringAgent] = useState<Agent | null>(null);
    const [pushoverUserKey, setPushoverUserKey] = useState('');
    const [pushoverApiToken, setPushoverApiToken] = useState('');
    const [pushoverReplyMessage, setPushoverReplyMessage] = useState('');
    const [pushoverTitle, setPushoverTitle] = useState('');
    const [pushoverFilter, setPushoverFilter] = useState<'ALL' | 'POTENTIAL_ONLY' | 'NO_POTENTIAL_ONLY'>('ALL');
    const [makeWebhookUrl, setMakeWebhookUrl] = useState('');
    const [isSavingPushover, setIsSavingPushover] = useState(false);
    const [isPushoverSectionOpen, setIsPushoverSectionOpen] = useState(false);

    // Derived: Final template generated from components
    const generatedPushoverTemplate = `Nombre: {nombre}\nResumen: {resumen}\n\n👉 Responder:\nhttps://wa.me/+{telefono}?text=${encodeURIComponent(pushoverReplyMessage)}`;

    // Derived state for unsaved changes in Pushover modal
    const hasUnsavedNotificationChanges = configuringAgent && (
        pushoverUserKey !== (configuringAgent.pushover_user_key || '') ||
        pushoverApiToken !== (configuringAgent.pushover_api_token || '') ||
        pushoverReplyMessage !== (configuringAgent.pushover_template?.match(/text=(.*)/)?.[1] ? decodeURIComponent(configuringAgent.pushover_template.match(/text=(.*)/)![1]) : '') ||
        pushoverTitle !== (configuringAgent.pushover_title || '') ||
        pushoverFilter !== (configuringAgent.pushover_notification_filter || 'ALL') ||
        makeWebhookUrl !== (configuringAgent.make_webhook_url || '')
    );

    const handleOpenPushover = (agent: Agent) => {
        setConfiguringAgent(agent);
        setPushoverUserKey(agent.pushover_user_key || '');
        setPushoverApiToken(agent.pushover_api_token || '');

        // Extract message from existing template if it has a wa.me URL
        const msgMatch = agent.pushover_template?.match(/text=(.*)/);
        const initialMsg = msgMatch ? decodeURIComponent(msgMatch[1]) : `Hola {nombre}, bienvenido, recibimos tu solicitud e info, cuéntanos en qué podemos ayudarte.`;

        setPushoverReplyMessage(initialMsg);
        setPushoverTitle(agent.pushover_title || '');
        setPushoverFilter(agent.pushover_notification_filter || 'ALL');
        setMakeWebhookUrl(agent.make_webhook_url || '');
        setIsPushoverSectionOpen(false);
        setIsPushoverModalOpen(true);
    };

    const handleSavePushover = async () => {
        if (!configuringAgent) return;
        setIsSavingPushover(true);
        try {
            const { error } = await supabase
                .from('agentes')
                .update({
                    pushover_user_key: pushoverUserKey,
                    pushover_api_token: pushoverApiToken,
                    pushover_template: generatedPushoverTemplate,
                    pushover_title: pushoverTitle,
                    pushover_notification_filter: pushoverFilter,
                    make_webhook_url: makeWebhookUrl
                })
                .eq('id', configuringAgent.id);

            if (error) throw error;

            setAgents(prevAgents => prevAgents.map(a =>
                a.id === configuringAgent.id
                    ? {
                        ...a,
                        pushover_user_key: pushoverUserKey,
                        pushover_api_token: pushoverApiToken,
                        pushover_template: generatedPushoverTemplate,
                        pushover_title: pushoverTitle,
                        pushover_notification_filter: pushoverFilter,
                        make_webhook_url: makeWebhookUrl
                    }
                    : a
            ));
            setInfoModal({ isOpen: true, type: 'success', message: 'Configuración de notificaciones guardada.' });
            setIsPushoverModalOpen(false);
        } catch (error) {
            console.error('Error saving Pushover settings:', error);
            setInfoModal({ isOpen: true, type: 'error', message: 'Error al guardar la configuración de notificaciones.' });
        } finally {
            setIsSavingPushover(false);
        }
    };

    const handleDeleteAgent = (agent: Agent) => {
        setDeleteConfirmation({ id: agent.id, name: agent.nombre || 'Agente sin nombre' });
        setDeleteInput(''); // Reset word check
    };

    const fetchMessages = React.useCallback(async (leadId: string) => {
        if (!targetUid) return;
        const { data, error } = await supabase
            .from('leads')
            .select('chat_history')
            .eq('id', leadId)
            .eq('user_id', targetUid)
            .single();

        if (error) {
            console.error('Error fetching chat history:', error);
            return;
        }

        if (data?.chat_history) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const history = data.chat_history as any[];
            setMessages(history.map(msg => ({
                role: msg.role === 'user' ? 'user' : 'assistant',
                text: msg.message || msg.text || ''
            })));
        }
    }, [targetUid]);

    const confirmDelete = async () => {
        if (!deleteConfirmation || deleteInput !== 'ELIMINAR') return;
        const { id, name: nombre } = deleteConfirmation;

        try {
            console.log(`🗑️ Starting deletion for agent ${nombre} (${id})...`);

            // 1. Manually delete associated leads first
            const { error: leadsError, count: leadsCount } = await supabase
                .from('leads')
                .delete({ count: 'exact' })
                .eq('agent_id', id)
                .eq('user_id', targetUid);

            if (leadsError) {
                console.error('Error deleting leads:', leadsError);
                throw new Error('No se pudieron eliminar los leads asociados.');
            }
            console.log(`✅ Leads deleted: ${leadsCount}`);

            // 2. Delete the agent
            const { error: agentError } = await supabase
                .from('agentes')
                .delete()
                .eq('id', id)
                .eq('user_id', targetUid);

            if (agentError) {
                console.error('Error deleting agent:', agentError);
                throw new Error('No se pudo eliminar el registro del agente.');
            }

            // 3. Double check deletion (Verification step)
            const { data: verifyAgent } = await supabase
                .from('agentes')
                .select('id')
                .eq('id', id)
                .single();

            if (verifyAgent) {
                throw new Error('Error crítico: El agente aún aparece en la base de datos tras el borrado.');
            }

            console.log(`✅ Agent ${nombre} successfully deleted from backend.`);

            setAgents(agents.filter(a => a.id !== id));
            setDeleteConfirmation(null);
            setDeleteInput('');
            setInfoModal({ isOpen: true, type: 'success', message: 'Agente y sus datos eliminados correctamente.' });
        } catch (error: unknown) {
            console.error('Detailed deletion error:', error);
            setDeleteConfirmation(null);
            setDeleteInput('');
            const errorMessage = error instanceof Error ? error.message : 'Error al eliminar el agente. Puede que tenga datos protegidos.';
            setInfoModal({
                isOpen: true,
                type: 'error',
                message: errorMessage
            });
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
        if (!newAgentName.trim() || !targetUid) return;
        setIsCreating(true);

        try {
            const { data, error } = await supabase
                .from('agentes')
                .insert([{
                    nombre: newAgentName.trim(),
                    user_id: targetUid,
                    status: 'active',
                    personalidad: 'Asesor de ventas / Asistente Comercial'
                }])
                .select()
                .single();

            if (error) throw error;

            if (data) {
                setAgents([...agents, data]);
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

    const handleFetchAvailableAgents = async () => {
        setIsLoadingImports(true);
        setImportStep('select');

        try {
            const res = await fetch('/api/elevenlabs/agents');
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error from ElevenLabs');
            }

            // ElevenLabs may return { agents: [...] } or just [...]
            let elAgents: Array<{ agent_id: string; name: string }> = [];
            if (Array.isArray(data)) {
                elAgents = data;
            } else if (data && Array.isArray(data.agents)) {
                elAgents = data.agents;
            }

            // NEW: The API already filters assigned agents and returns only one random available one.
            if (elAgents.length > 0) {
                setSelectedImports(new Set([elAgents[0].agent_id]));
            }
            setImportableAgents(elAgents);
        } catch (err) {
            console.error('Error fetching ElevenLabs agents:', err);
            setInfoModal({ isOpen: true, type: 'error', message: 'Error al conectar con ElevenLabs.' });
            setIsImportModalOpen(false);
        } finally {
            setIsLoadingImports(false);
        }
    };

    const handleOpenCreateModal = () => {
        setIsImportModalOpen(true);
        setImportStep('select');
        setImportKey('');
        setImportKeyError('');
        setNewAgentName('');
        handleFetchAvailableAgents();
    };

    const handleVerifyImportKey = async () => {
        const correctKey = process.env.NEXT_PUBLIC_IMPORT_KEY || 'iautomae2025';
        if (importKey !== correctKey) {
            setImportKeyError('Clave incorrecta. Inténtalo de nuevo.');
            return;
        }
        setImportKeyError('');
        handleFetchAvailableAgents();
    };

    const toggleImportSelection = (agentId: string) => {
        setSelectedImports(prev => {
            const next = new Set(prev);
            if (next.has(agentId)) next.delete(agentId);
            else next.add(agentId);
            return next;
        });
    };

    const confirmImport = async () => {
        if (!user?.id || selectedImports.size === 0) return;
        setIsImporting(true);

        try {
            const toImport = importableAgents.filter(a => selectedImports.has(a.agent_id));
            const newAgents: Agent[] = [];

            for (const elAgent of toImport) {
                // Fetch full agent details (prompt, knowledge base, phone, etc.)
                let agentPrompt = '';
                const agentPersonality = 'Asesor de ventas / Asistente Comercial';
                let knowledgeFiles: { name: string; size: string }[] = [];
                let phoneNumber: string | undefined;
                let phoneNumberId: string | undefined;

                try {
                    const detailRes = await fetch(`/api/elevenlabs/agents/${elAgent.agent_id}`);
                    if (detailRes.ok) {
                        const detail = await detailRes.json();

                        // Extract system prompt from conversation_config
                        const convConfig = detail.conversation_config || {};
                        const agentConfig = convConfig.agent || {};
                        agentPrompt = agentConfig.prompt?.prompt || '';

                        // Extract knowledge base files
                        const kb = agentConfig.prompt?.knowledge_base || [];
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        knowledgeFiles = kb.map((item: any) => ({
                            name: item.name || item.file_name || 'documento',
                            size: item.size ? `${(item.size / 1024).toFixed(1)} KB` : 'N/A',
                        }));

                        // Extract WhatsApp phone number from whatsapp_accounts
                        const waAccounts = detail.whatsapp_accounts || [];
                        if (waAccounts.length > 0) {
                            phoneNumber = waAccounts[0].phone_number || '';
                            phoneNumberId = waAccounts[0].phone_number_id || '';
                        }

                        // Fallback: check phone_numbers array too
                        if (!phoneNumber) {
                            const phoneNums = detail.phone_numbers || [];
                            if (phoneNums.length > 0) {
                                phoneNumber = phoneNums[0].phone_number || '';
                                phoneNumberId = phoneNums[0].phone_number_id || '';
                            }
                        }
                    }
                } catch { /* detail fetch is optional, agent still gets imported */ }

                const importResponse = await fetch('/api/agents/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: targetUid,
                        agent: {
                            name: newAgentName.trim() || elAgent.name || 'Agente Importado',
                            status: 'active',
                            personalidad: agentPersonality,
                            eleven_labs_agent_id: elAgent.agent_id,
                            prompt: agentPrompt || undefined,
                            knowledge_files: knowledgeFiles.length > 0 ? knowledgeFiles : undefined,
                            phone_number: phoneNumber || undefined,
                            phone_number_id: phoneNumberId || undefined,
                        }
                    })
                });

                if (importResponse.ok) {
                    const { agent: importedAgent } = await importResponse.json();
                    if (importedAgent) {
                        // Check if we already have this agent in state to avoid duplicates if updating
                        const exists = newAgents.find(a => a.id === importedAgent.id);
                        if (!exists) {
                            newAgents.push(importedAgent);
                        }
                    }
                } else {
                    console.error('Failed to import agent via API');
                }


            }

            setAgents(prev => [...prev, ...newAgents]);
            setIsImportModalOpen(false);
            setImportStep('key');
            setImportKey('');
            setSelectedImports(new Set());
            setImportableAgents([]);
            setInfoModal({ isOpen: true, type: 'success', message: `¡${newAgents.length} agente(s) importado(s) con su configuración completa!` });
        } catch (err) {
            console.error('Import error:', err);
            setInfoModal({ isOpen: true, type: 'error', message: 'Error al importar agentes.' });
        } finally {
            setIsImporting(false);
        }
    };



    return (
        <div className="w-full flex flex-col animate-in fade-in duration-500 h-[calc(100vh-2rem)] overflow-hidden">
            {/* Admin Impersonation Banner */}
            {viewAsUid && isAdmin && (
                <div className="bg-slate-900 py-2 px-8 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 text-brand-primary text-[10px] font-bold uppercase tracking-widest">
                        <Shield size={14} />
                        Modo Administrador: Viendo como usuario ({viewAsUid.slice(0, 8)}...)
                    </div>
                    <Link
                        href="/admin"
                        className="text-[10px] font-bold text-slate-400 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-1"
                    >
                        <ArrowLeft size={12} />
                        Volver al Panel Maestro
                    </Link>
                </div>
            )}

            <div className="flex flex-col pt-6 pb-6 px-8 flex-1 overflow-hidden">
                {/* Header with Dynamic Company Name */}
                <div className="flex items-center justify-between mb-8 shrink-0">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            {/* Back Button - Only show in LEADS view */}
                            {view === 'LEADS' && (
                                <button
                                    onClick={() => setView('GALLERY')}
                                    className="mr-2 p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-gray-900 transition-colors"
                                >
                                    <ArrowLeft size={20} />
                                </button>
                            )}

                            <div className="flex items-center gap-3 group">
                                {isEditingTitle ? (
                                    <input
                                        type="text"
                                        value={editableCompany}
                                        onChange={(e) => setEditableCompany(e.target.value)}
                                        onBlur={() => {
                                            setIsEditingTitle(false);
                                            localStorage.setItem(`panel_name_${company}`, editableCompany);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                setIsEditingTitle(false);
                                                localStorage.setItem(`panel_name_${company}`, editableCompany);
                                            }
                                        }}
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
                        </div>
                        <p className="text-gray-500 text-sm font-medium ml-1">
                            {view === 'GALLERY' ? "Gestión de Agentes de IA" : "Gestión de Leads"}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {view === 'GALLERY' ? (
                            <>
                                <button
                                    onClick={handleOpenCreateModal}
                                    className="px-6 py-2.5 bg-brand-primary text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-brand-primary/20 hover:-translate-y-0.5 active:scale-95 flex items-center gap-2"
                                >
                                    <Plus size={16} />
                                    Crear Agente
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    // Select active agent
                                    const agentToConfig = agents.find(a => a.id === activeAgentId);
                                    if (agentToConfig) {
                                        handleOpenPushover(agentToConfig);
                                    } else {
                                        setInfoModal({ isOpen: true, type: 'error', message: 'No hay agentes para configurar.' });
                                    }
                                }}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all hover:-translate-y-0.5 active:scale-95 flex items-center gap-2 hover:border-brand-primary hover:text-brand-primary shadow-sm"
                            >
                                <Bell size={16} />
                                Configurar Notificaciones
                            </button>
                        )}
                    </div>
                </div>

                {
                    view === 'GALLERY' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                            {agents.map(agent => (
                                <div key={agent.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative overflow-visible flex flex-col justify-between min-h-[220px]">
                                    {/* Hover Action Buttons */}
                                    <div className="absolute right-[-10px] top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all z-10">
                                        <button
                                            onClick={(e) => { e.preventDefault(); handleDeleteAgent(agent); }}
                                            className="w-8 h-8 bg-white border border-red-100 text-red-400 rounded-full shadow-lg hover:bg-red-50 hover:text-red-600 flex items-center justify-center"
                                            title="Eliminar Agente"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div>
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="w-12 h-12 bg-brand-primary/10 rounded-2xl flex items-center justify-center text-brand-primary shadow-inner overflow-hidden">
                                                {agent.avatar_url ? (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img src={agent.avatar_url} alt={agent.nombre} className="w-full h-full object-cover" />
                                                ) : (
                                                    <Bot size={24} />
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-1 text-right">
                                                {/* Switch Toggle */}
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={cn(
                                                        "text-[8px] font-bold uppercase tracking-widest transition-colors",
                                                        agent.status === 'active' ? "text-brand-primary" : "text-gray-400"
                                                    )}>
                                                        {agent.status === 'active' ? "Activo" : "Desactivado"}
                                                    </span>
                                                    <div
                                                        onClick={() => toggleAgentStatus(agent)}
                                                        className={cn(
                                                            "w-11 h-6 rounded-full relative transition-all cursor-pointer shadow-inner flex items-center px-1",
                                                            agent.status === 'active' ? "bg-brand-primary/20" : "bg-gray-100 border border-gray-200"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-4 h-4 rounded-full shadow-md transition-all duration-300",
                                                            agent.status === 'active' ? "translate-x-5 bg-brand-primary" : "translate-x-0 bg-gray-400"
                                                        )} />
                                                    </div>
                                                </div>
                                                {/* Empty space where stats used to be */}
                                                <div className="h-8" />
                                            </div>
                                        </div>

                                        <h3 className="text-lg font-bold text-gray-900 mb-0.5 leading-tight truncate" title={agent.nombre}>{agent.nombre || 'Agente sin nombre'}</h3>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-4 truncate" title={agent.personalidad}>{agent.personalidad || 'Sin especialidad'}</p>
                                    </div>

                                    <div className="flex gap-1.5 mt-auto">
                                        <Link
                                            href={`/leads/agent-config?id=${agent.id}`}
                                            className="flex-[0.8] bg-gray-50 text-gray-600 py-3 rounded-xl text-[8px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all text-center flex flex-col items-center justify-center gap-1 border border-gray-100 hover:border-brand-primary shadow-sm"
                                        >
                                            <Settings size={14} />
                                            <span>Config</span>
                                        </Link>
                                        <button
                                            onClick={() => {
                                                setActiveAgentId(agent.id);
                                                setView('LEADS');
                                            }}
                                            className="flex-[1.2] bg-brand-primary-darker text-white py-3 rounded-xl text-[8px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-md shadow-brand-primary-darker/10 flex flex-col items-center justify-center gap-1"
                                        >
                                            <Bot size={14} />
                                            <span>Ver Leads</span>
                                        </button>
                                        <button
                                            onClick={(e) => { e.preventDefault(); setSelectedAgentStats(agent); }}
                                            className="flex-[0.8] bg-amber-50 text-amber-700 py-3 rounded-xl text-[8px] font-bold uppercase tracking-widest hover:bg-amber-100 transition-all text-center flex flex-col items-center justify-center gap-1 border border-amber-100 shadow-sm"
                                        >
                                            <BarChart2 size={14} />
                                            <span>Uso</span>
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
                                onClick={handleOpenCreateModal}
                                className="border-2 border-dashed border-gray-100 rounded-2xl flex flex-col items-center justify-center py-6 opacity-60 hover:opacity-100 transition-opacity cursor-pointer group hover:border-brand-mint/50 min-h-[220px]"
                            >
                                <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 group-hover:text-brand-mint group-hover:bg-brand-mint/5 transition-all mb-3">
                                    <Plus size={24} />
                                </div>
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest group-hover:text-brand-mint">Nuevo Agente</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full overflow-hidden">
                            {/* Filter Buttons */}
                            <div className="flex items-center justify-between mb-4 shrink-0">
                                {/* Filter Tabs with Counts - Defined Container */}
                                <div className="flex bg-gray-200/50 p-1 rounded-xl shadow-sm border border-gray-100/50">
                                    <button
                                        onClick={() => { setFilterStatus('ALL'); setCurrentPage(1); }}
                                        className={cn(
                                            "px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                            filterStatus === 'ALL' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-900"
                                        )}
                                    >
                                        Todos ({realLeads.length})
                                    </button>
                                    <button
                                        onClick={() => { setFilterStatus('NO_POTENCIAL'); setCurrentPage(1); }}
                                        className={cn(
                                            "px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                            filterStatus === 'NO_POTENCIAL' ? "bg-white text-red-600 shadow-sm" : "text-gray-500 hover:text-red-500"
                                        )}
                                    >
                                        No Aptos ({realLeads.filter(l => l.status === 'NO_POTENCIAL').length})
                                    </button>
                                    <button
                                        onClick={() => { setFilterStatus('POTENCIAL'); setCurrentPage(1); }}
                                        className={cn(
                                            "px-6 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                            filterStatus === 'POTENCIAL' ? "bg-white text-emerald-700 shadow-sm" : "text-gray-500 hover:text-emerald-600"
                                        )}
                                    >
                                        Aptos ({realLeads.filter(l => l.status === 'POTENCIAL').length})
                                    </button>
                                </div>

                                {/* Placeholder Buttons */}
                                <div className="flex bg-gray-100/50 p-1 rounded-xl">
                                    {[1, 2, 3].map((num) => (
                                        <button
                                            key={num}
                                            className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-all"
                                        >
                                            Botón {num}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="flex-1 overflow-auto bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-xl relative flex flex-col">
                                <div className="flex-1 overflow-auto">
                                    <table className="w-full text-left border-collapse table-fixed">
                                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                                            <tr>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-900 border-b border-gray-200 uppercase tracking-tight bg-gray-50/50 w-[100px]">Fecha</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 border-b border-l border-gray-100 uppercase tracking-tight bg-gray-50/50 w-[150px]">Nombre</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 border-b border-l border-gray-100 uppercase tracking-tight bg-gray-50/50 w-[130px]">Teléfono</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 border-b border-l border-gray-100 uppercase tracking-tight bg-gray-50/50">Resumen Llamada</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 border-b border-l border-gray-100 uppercase tracking-tight bg-gray-50/50 w-[70px] text-center">Ver Chat</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 border-b border-l border-gray-100 uppercase tracking-tight bg-gray-50/50 w-[120px] text-center">Calificación</th>
                                                <th className="px-4 py-3 text-[10px] font-bold text-gray-500 border-b border-l border-gray-100 text-center uppercase tracking-tight bg-gray-50/50 w-[80px]">Acciones</th>
                                            </tr >
                                        </thead >
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedLeads.map((lead) => (
                                                <tr
                                                    key={lead.id}
                                                    className="bg-white hover:bg-gray-100 transition-colors group"
                                                >
                                                    <td className="px-4 py-1.5 border-b border-gray-100">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-medium text-gray-700">
                                                                {new Date(lead.date).toLocaleDateString()}
                                                            </span>
                                                            <span className="text-[9px] text-gray-400">
                                                                {lead.time}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-1.5 border-b border-l border-gray-100">
                                                        <span className="text-xs font-medium text-gray-700 block truncate max-w-[150px]" title={lead.name}>
                                                            {lead.name}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-1.5 border-b border-l border-gray-100">
                                                        <span className="text-[10px] text-gray-500 font-medium">{lead.phone}</span>
                                                    </td>
                                                    <td className="px-4 py-1.5 border-b border-l border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors" onClick={() => { setSelectedLead(lead); setPanelTab('SUMMARY'); }}>
                                                        <p className="text-[10px] text-gray-500 line-clamp-2 leading-tight max-w-[250px]" title="Ver resumen completo">
                                                            {lead.summary}
                                                        </p>
                                                    </td>
                                                    <td className="px-4 py-1.5 border-b border-l border-gray-100 text-center">
                                                        <button
                                                            onClick={() => { setSelectedLead(lead); setPanelTab('CHAT'); }}
                                                            className="p-1 hover:bg-green-50 text-gray-400 hover:text-green-600 rounded-md transition-colors group/chat"
                                                            title="Ver Chat WhatsApp"
                                                        >
                                                            <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] fill-[#25D366] group-hover/chat:scale-110 transition-transform">
                                                                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                            </svg>
                                                        </button>
                                                    </td>
                                                    <td className="px-4 py-1.5 border-b border-l border-gray-100 text-center">
                                                        <span className={cn(
                                                            "w-24 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wide inline-flex justify-center",
                                                            lead.status === 'POTENCIAL'
                                                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                                : "bg-red-100 text-red-700 border border-red-200"
                                                        )}>
                                                            {lead.status === 'POTENCIAL' ? 'POTENCIAL' : 'NO POTENCIAL'}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-1.5 border-b border-l border-gray-100 text-center">
                                                        <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-1 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-colors" title="Eliminar">
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Pagination Footer - Inside Container */}
                                <div className="px-4 py-2 bg-gray-50/80 border-t border-gray-200 flex items-center justify-between shrink-0 backdrop-blur-md">
                                    <div className="flex items-center gap-2">
                                        <select
                                            value={itemsPerPage}
                                            onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                                            className="bg-white border border-gray-300 rounded-md text-[10px] font-bold text-gray-700 py-0.5 pl-2 pr-6 outline-none focus:border-brand-primary h-6 cursor-pointer hover:border-brand-primary transition-colors"
                                        >
                                            <option value={15}>15 Filas</option>
                                            <option value={50}>50 Filas</option>
                                            <option value={100}>100 Filas</option>
                                        </select>
                                        <p className="text-[10px] text-gray-400 font-medium ml-2">
                                            {Math.min(indexOfLastItem, filteredLeads.length)} de {filteredLeads.length}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setCurrentPage(1)}
                                            disabled={currentPage === 1}
                                            className="p-1 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                                        >
                                            <ChevronsLeft size={14} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                            disabled={currentPage === 1}
                                            className="p-1 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                                        >
                                            <ChevronLeft size={14} />
                                        </button>

                                        <div className="px-2 text-[10px] font-bold text-gray-600">
                                            {currentPage} / {totalPages}
                                        </div>

                                        <button
                                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                            disabled={currentPage === totalPages}
                                            className="p-1 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                                        >
                                            <ChevronRight size={14} />
                                        </button>
                                        <button
                                            onClick={() => setCurrentPage(totalPages)}
                                            disabled={currentPage === totalPages}
                                            className="p-1 rounded-md hover:bg-white hover:shadow-sm text-gray-400 hover:text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all"
                                        >
                                            <ChevronsRight size={14} />
                                        </button>
                                    </div>
                                </div >
                            </div >
                        </div >
                    )
                }
                {/* Statistics Modal */}
                {
                    selectedAgentStats && (
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
                    )
                }
                {/* Quick Create Modal */}
                {
                    isCreateModalOpen && (
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
                    )
                }

                {/* Delete Confirmation Modal */}
                {
                    deleteConfirmation && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center border-2 border-red-100">
                                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-4">¡Cuidado! Acción de alto riesgo</h3>

                                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 mb-6 text-left">
                                    <p className="text-[11px] font-bold text-amber-800 uppercase tracking-widest mb-2 flex items-center gap-2">
                                        <Activity size={14} />
                                        ¿Qué se eliminará?
                                    </p>
                                    <ul className="text-xs text-amber-700/80 space-y-1 ml-4 list-disc font-medium">
                                        <li>Todos los leads capturados por <span className="font-bold text-amber-900">{deleteConfirmation.name}</span>.</li>
                                        <li>Historial de chats y registros de actividad.</li>
                                        <li>Configuración personalizada del agente.</li>
                                    </ul>
                                </div>

                                <p className="text-sm text-gray-500 mb-6 font-medium">
                                    Para confirmar la eliminación permanente, escribe <span className="font-bold text-red-600">ELIMINAR</span> a continuación:
                                </p>

                                <input
                                    type="text"
                                    value={deleteInput}
                                    onChange={(e) => setDeleteInput(e.target.value.toUpperCase())}
                                    placeholder="Escribe ELIMINAR"
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl py-3 px-4 text-center font-bold text-red-600 placeholder:text-gray-300 focus:ring-2 focus:ring-red-500/20 focus:border-red-500 outline-none mb-6 transition-all"
                                    autoFocus
                                />

                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setDeleteConfirmation(null)}
                                        className="flex-1 py-3 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all border border-gray-100"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        disabled={deleteInput !== 'ELIMINAR'}
                                        className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-30 disabled:shadow-none"
                                    >
                                        Eliminar Agente
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Info/Success/Error Modal */}
                {
                    infoModal.isOpen && (
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
                    )
                }

                {/* Import Agents Modal */}
                {
                    isImportModalOpen && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-mint/10 flex items-center justify-center text-brand-mint">
                                            {importStep === 'key' ? <Lock size={20} /> : <Download size={20} />}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">
                                                {importStep === 'key' ? 'Verificar Acceso' : 'Crea tu Nuevo Agente'}
                                            </h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                {importStep === 'key' ? 'Ingresa tu clave de acceso' : 'Ingresa el nombre para tu nuevo asistente'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => { setIsImportModalOpen(false); setImportStep('key'); setImportKey(''); }}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    {importStep === 'key' ? (
                                        <>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Clave Secreta</label>
                                                <input
                                                    type="password"
                                                    value={importKey}
                                                    onChange={(e) => { setImportKey(e.target.value); setImportKeyError(''); }}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyImportKey()}
                                                    placeholder="Ingresa tu clave de acceso"
                                                    autoFocus
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-mint/20 focus:border-brand-mint outline-none text-gray-900 font-bold placeholder:text-gray-300 transition-all"
                                                />
                                                {importKeyError && (
                                                    <p className="text-red-500 text-xs font-medium">{importKeyError}</p>
                                                )}
                                            </div>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={() => setIsImportModalOpen(false)}
                                                    className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                                                >
                                                    Cancelar
                                                </button>
                                                <button
                                                    onClick={handleVerifyImportKey}
                                                    disabled={!importKey.trim()}
                                                    className="flex-2 px-8 py-4 bg-gray-900 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-gray-900/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                                >
                                                    <Lock size={14} />
                                                    Verificar
                                                </button>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            {isLoadingImports ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                    <RefreshCw size={24} className="animate-spin text-brand-mint" />
                                                    <p className="text-sm text-gray-400 font-medium">Cargando agentes de ElevenLabs...</p>
                                                </div>
                                            ) : importableAgents.length === 0 ? (
                                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                                    <CheckCircle2 size={32} className="text-brand-mint" />
                                                    <p className="text-sm text-gray-500 font-medium text-center">No hay más agentes disponibles en este momento.<br /><span className="text-[10px] text-gray-400 uppercase">Contacta con soporte para ampliar tu pool.</span></p>
                                                    <button
                                                        onClick={() => setIsImportModalOpen(false)}
                                                        className="mt-4 px-8 py-3 bg-gray-900 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:brightness-110 transition-all"
                                                    >
                                                        Cerrar
                                                    </button>
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Nombre del Agente</label>
                                                            <input
                                                                type="text"
                                                                value={newAgentName}
                                                                onChange={(e) => setNewAgentName(e.target.value)}
                                                                placeholder="Ej: Asistente de Ventas"
                                                                autoFocus
                                                                onKeyDown={(e) => e.key === 'Enter' && confirmImport()}
                                                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 focus:ring-2 focus:ring-brand-mint/20 focus:border-brand-mint outline-none text-gray-900 font-bold placeholder:text-gray-300 transition-all font-inter"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => { setIsImportModalOpen(false); setImportStep('key'); }}
                                                            className="flex-1 py-4 bg-gray-50 text-gray-500 rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                                                        >
                                                            Cancelar
                                                        </button>
                                                        <button
                                                            onClick={confirmImport}
                                                            disabled={isImporting || !newAgentName.trim() || selectedImports.size === 0}
                                                            className="flex-2 px-8 py-4 bg-brand-mint text-brand-dark rounded-2xl text-[11px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-xl shadow-brand-mint/10 disabled:opacity-50 flex items-center justify-center gap-2"
                                                        >
                                                            {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                                                            Crear Ahora
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Unified Side Panel */}
                {
                    selectedLead && (
                        <div className="fixed inset-0 z-50 flex justify-end">
                            {/* Backdrop */}
                            <div
                                className="absolute inset-0 bg-black/20 backdrop-blur-[1px] transition-opacity"
                                onClick={() => setSelectedLead(null)}
                            />

                            {/* Panel */}
                            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col border-l border-gray-100">
                                {/* Header */}
                                <div className="p-6 border-b border-gray-100 bg-gray-50/50 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-green-50 rounded-xl text-green-600 shadow-sm border border-green-100">
                                                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366]">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-sm">{selectedLead.name}</h3>
                                                <p className="text-[10px] text-gray-500">{selectedLead.phone}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => setSelectedLead(null)}
                                            className="p-2 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>

                                    {/* Qualification Badge */}
                                    <div className="flex items-center justify-between">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Calificación</span>
                                        <span className={cn(
                                            "w-24 py-1 rounded-md text-[9px] font-bold uppercase tracking-wide inline-flex justify-center",
                                            selectedLead.status === 'POTENCIAL'
                                                ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                                                : "bg-red-100 text-red-700 border border-red-200"
                                        )}>
                                            {selectedLead.status === 'POTENCIAL' ? 'POTENCIAL' : 'NO POTENCIAL'}
                                        </span>
                                    </div>

                                    {/* Tabs */}
                                    <div className="flex bg-gray-200/50 p-1 rounded-xl">
                                        <button
                                            onClick={() => setPanelTab('SUMMARY')}
                                            className={cn(
                                                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                panelTab === 'SUMMARY' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            Resumen
                                        </button>
                                        <button
                                            onClick={() => setPanelTab('CHAT')}
                                            className={cn(
                                                "flex-1 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                panelTab === 'CHAT' ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                                            )}
                                        >
                                            Chat
                                        </button>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="flex-1 overflow-visible bg-white relative flex flex-col min-h-0">
                                    {panelTab === 'SUMMARY' ? (
                                        <div className="p-6 overflow-y-auto">
                                            <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap font-medium">
                                                {selectedLead.summary}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col h-full min-h-0">
                                            {/* Transcript Content */}
                                            <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-24 relative">
                                                {selectedLead.transcript && selectedLead.transcript.length > 0 ? (
                                                    selectedLead.transcript.map((msg: { role: string; message?: string; text?: string; time?: string }, idx: number) => (
                                                        <div key={idx} className={cn("flex", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                                            <div className={cn(
                                                                "px-3 py-2 rounded-lg text-xs max-w-[80%] shadow-sm",
                                                                msg.role === 'user'
                                                                    ? "bg-brand-mint/20 text-gray-900 rounded-tr-none"
                                                                    : "bg-white border border-gray-100 text-gray-900 rounded-tl-none"
                                                            )}>
                                                                <p>{msg.message || msg.text}</p>
                                                                {msg.time && <span className="text-[9px] text-gray-400 block text-right mt-1">{msg.time}</span>}
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center p-12 text-center">
                                                        <Lock size={32} className="text-gray-200 mb-2" />
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sin transcripción disponible</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Fixed Footer Disclaimer */}
                                            <div className="bg-gray-50 border-t border-gray-100 p-4 shrink-0">
                                                <div className="flex items-center justify-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm">
                                                    <Lock size={10} className="text-gray-400" />
                                                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">
                                                        Protegido y guardado por <span className="text-brand-primary">iautomae systems</span>
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                            </div>
                        </div>
                    )
                }

                {/* Pushover Configuration Modal */}
                {
                    isPushoverModalOpen && configuringAgent && (
                        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                            <Bell size={20} />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-gray-900 leading-tight">Configurar Notificación Push</h3>
                                            <div className="mt-1 relative group">
                                                <select
                                                    value={configuringAgent.id}
                                                    onChange={(e) => {
                                                        const selected = agents.find(a => a.id === e.target.value);
                                                        if (selected) handleOpenPushover(selected);
                                                    }}
                                                    className="w-full bg-transparent border-none p-0 text-[10px] text-gray-400 font-bold uppercase tracking-widest focus:ring-0 cursor-pointer hover:text-brand-primary transition-colors appearance-none pr-4"
                                                >
                                                    {agents.map(agent => (
                                                        <option key={agent.id} value={agent.id}>{agent.nombre}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute right-0 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 group-hover:text-brand-primary transition-colors">
                                                    <ChevronsRight size={10} className="rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsPushoverModalOpen(false)}
                                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh]">
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-between border-b border-gray-50 pb-2">
                                            <h4 className="text-[11px] font-bold text-gray-400 gap-2 uppercase tracking-widest flex items-center">
                                                <Bell size={12} className="text-brand-primary" />
                                                Pushover (Opcional)
                                            </h4>
                                            <button
                                                onClick={() => setIsPushoverSectionOpen(!isPushoverSectionOpen)}
                                                className="text-[10px] font-bold text-brand-primary uppercase tracking-tighter hover:underline"
                                            >
                                                {isPushoverSectionOpen ? 'Ocultar' : 'Configurar'}
                                            </button>
                                        </div>

                                        {isPushoverSectionOpen && (
                                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                                <div className="space-y-3 bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">User Key</label>
                                                    <input
                                                        type="text"
                                                        value={pushoverUserKey}
                                                        onChange={(e) => setPushoverUserKey(e.target.value)}
                                                        placeholder="Ingresa tu User Key de Pushover"
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-gray-900 font-bold placeholder:text-gray-300 transition-all font-mono shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-3 bg-brand-primary/5 p-4 rounded-2xl border border-brand-primary/10">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">API Token / App Token</label>
                                                    <input
                                                        type="password"
                                                        value={pushoverApiToken}
                                                        onChange={(e) => setPushoverApiToken(e.target.value)}
                                                        placeholder="Ingresa tu App Token"
                                                        className="w-full bg-white border border-gray-200 rounded-xl py-3 px-5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-gray-900 font-bold placeholder:text-gray-300 transition-all font-mono shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Filtro de Notificaciones</label>
                                                    <div className="relative">
                                                        <select
                                                            value={pushoverFilter}
                                                            onChange={(e) => setPushoverFilter(e.target.value as 'ALL' | 'POTENTIAL_ONLY' | 'NO_POTENTIAL_ONLY')}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-gray-900 font-medium transition-all appearance-none cursor-pointer"
                                                        >
                                                            <option value="ALL">Notificar Todos los Leads</option>
                                                            <option value="POTENTIAL_ONLY">Solo Leads Potenciales</option>
                                                            <option value="NO_POTENTIAL_ONLY">Solo Leads No Potenciales</option>
                                                        </select>
                                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                            <ChevronsRight size={14} className="rotate-90" />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Título de Notificación</label>
                                                    <input
                                                        type="text"
                                                        value={pushoverTitle}
                                                        onChange={(e) => setPushoverTitle(e.target.value)}
                                                        placeholder="Ej: Nuevo Lead Detectado"
                                                        className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-gray-900 font-medium placeholder:text-gray-300 transition-all font-mono"
                                                    />
                                                </div>

                                                <div className="space-y-4">
                                                    <div className="space-y-1">
                                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block">Respuesta para el Cliente</label>
                                                        <span className="text-[9px] text-blue-500 font-medium">Usa {"{nombre}"} para personalizar</span>
                                                    </div>

                                                    <div className="relative">
                                                        <textarea
                                                            value={pushoverReplyMessage}
                                                            onChange={(e) => setPushoverReplyMessage(e.target.value)}
                                                            placeholder="Escribe el mensaje..."
                                                            rows={4}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none text-sm text-gray-900 font-medium placeholder:text-gray-300 transition-all leading-relaxed"
                                                        />
                                                    </div>

                                                    <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50/50 rounded-xl border border-gray-100">
                                                        {['👋', '😊', '🤝', '🙌', '🔥', '✨', '🚀', '✅', '📞', '💬', '📍', '📩', '📱', '🎯'].map(emoji => (
                                                            <button
                                                                key={emoji}
                                                                onClick={() => setPushoverReplyMessage(prev => prev + emoji)}
                                                                className="w-8 h-8 flex items-center justify-center bg-white hover:bg-gray-100 rounded-lg text-base shadow-sm transition-all hover:scale-110 active:scale-90 border border-gray-100"
                                                            >
                                                                {emoji}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <div className="p-4 bg-gray-900 rounded-2xl border border-gray-800 shadow-inner">
                                                        <div className="flex items-center gap-2 mb-3">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                                            <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Vista Previa (Móvil)</span>
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex gap-2">
                                                                <span className="text-[10px] font-bold text-brand-primary">Nombre:</span>
                                                                <span className="text-[10px] text-gray-300">Juan Pérez</span>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <span className="text-[10px] font-bold text-brand-primary">Resumen:</span>
                                                                <span className="text-[10px] text-gray-300 line-clamp-1">Interesado en cotización...</span>
                                                            </div>
                                                            <div className="pt-2 border-t border-gray-800">
                                                                <div className="bg-brand-primary/10 border border-brand-primary/20 rounded-xl p-2 flex items-center justify-between">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-6 h-6 rounded-lg bg-[#25D366] flex items-center justify-center">
                                                                            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.008-.57-.008-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                                                        </div>
                                                                        <span className="text-[10px] font-bold text-white uppercase tracking-tighter">Responder WhatsApp</span>
                                                                    </div>
                                                                    <ChevronsRight size={12} className="text-white/50" />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {!isPushoverSectionOpen && (
                                        <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in duration-500">
                                            <h4 className="text-[11px] font-bold text-amber-500 uppercase tracking-widest pb-2 flex items-center gap-2">
                                                <RotateCcw size={12} />
                                                WEBHOOK
                                            </h4>
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">WEBHOOK URL</label>
                                                <input
                                                    type="text"
                                                    value={makeWebhookUrl}
                                                    onChange={(e) => setMakeWebhookUrl(e.target.value)}
                                                    placeholder="https://hook.us1.make.com/..."
                                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-3 px-5 focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none text-sm text-gray-900 font-medium placeholder:text-gray-300 transition-all font-mono"
                                                />
                                                <p className="text-[9px] text-amber-500 font-medium">Reenviará el paquete de datos original a esta URL.</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3 pt-4 border-t border-gray-50">
                                        <button
                                            onClick={handleSavePushover}
                                            disabled={isSavingPushover}
                                            className={cn(
                                                "w-full py-4 text-white rounded-2xl text-[11px] font-bold uppercase tracking-widest transition-all shadow-xl disabled:opacity-50 flex items-center justify-center gap-2",
                                                hasUnsavedNotificationChanges ? "bg-orange-500 hover:bg-orange-600 shadow-orange-500/10" : "bg-gray-900 hover:brightness-110 shadow-gray-900/10"
                                            )}
                                        >
                                            {isSavingPushover ? <RefreshCw size={14} className="animate-spin" /> : null}
                                            {isSavingPushover ? 'Guardando...' : 'Guardar Configuración'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
