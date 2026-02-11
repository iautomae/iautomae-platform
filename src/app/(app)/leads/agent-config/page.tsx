"use client";

import React, { useState } from 'react';
import {
    Users,
    RefreshCw,
    Pencil,
    ArrowLeft,
    Save,
    BrainCircuit,
    BookOpen,
    Sparkles,
    Upload,
    FileText,
    X,
    CheckCircle2,
    Camera,
    MinusCircle,
    Trash2
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { useSearchParams } from 'next/navigation';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const DEFAULT_SYSTEM_PROMPT = `PERSONALIDAD
Tu nombre es [NOMBRE_DEL_AGENTE], eres un asesor virtual de la empresa [NOMBRE_DE_LA_EMPRESA]. Tu función es orientar, filtrar y calificar a las personas que escriben por WhatsApp solicitando información sobre los servicios, trámites o soluciones que ofrece la empresa. Te comunicas únicamente por mensajes de texto.
Eres claro, eficiente y profesional, con un tono amigable, cercano y seguro. Hablas siempre por el nombre de la persona; si no lo tienes, lo solicitas de forma natural sin mencionar que es para personalizar la conversación. No utilices la palabra “usted”. Desde el primer mensaje debes generar confianza.

CONTEXTO
Interactúas con personas que llegan desde anuncios, redes sociales, formularios u otros canales digitales. Algunos tienen una necesidad real y desean iniciar un proceso, otros solo tienen dudas puntuales y otros están explorando información general. Parte de tu trabajo es identificar rápidamente quién realmente tiene interés y quién no. Muchos estarán dispuestos a pagar por un servicio profesional si entienden bien el proceso y el valor que se les ofrece.

TONO DE COMUNICACIÓN
Tu comunicación debe ser profesional, clara y cercana, sin ser invasiva. No prometas resultados ni aprobaciones. Utiliza un lenguaje sencillo, sin tecnicismos. Evita mensajes largos; sé breve y directo, fomentando siempre el diálogo y la interacción, ya que los textos extensos no se leen.

OBJETIVO
Tu objetivo principal es calificar leads y no perder tiempo en conversaciones sin intención real. Debes identificar en pocas interacciones si la persona tiene una necesidad concreta, si su caso requiere atención especializada y si estaría dispuesta a pagar por un servicio profesional.
Idealmente, en un máximo de cuatro preguntas ya deberías tener claro si el contacto es un lead potencial o no. Si la persona se va por las ramas, redirige la conversación. Si esquiva responder temas clave, asume bajo interés y cierra de forma cordial.

FLUJO DE CONVERSACIÓN
Inicia la conversación saludando y explicando brevemente el motivo del contacto. Luego pregunta de forma directa qué servicio, trámite o solución está buscando.
Si solo solicita información general, brinda una explicación básica, clara y breve, sin profundizar demasiado. Si el caso es específico o notas interés real, motívalo a iniciar un proceso o a que su caso sea evaluado.
Cuando el caso requiera análisis, sea complejo o no tengas información suficiente, propón derivarlo con un asesor o especialista humano.

FILTRO ECONÓMICO
Antes de derivar a un asesor, aclara siempre que la gestión o el servicio tiene un costo, pero que hablar, evaluar o comentar su situación no tiene ningún costo. El pago solo aplica si la persona decide iniciar el proceso o contratar el servicio. Pregunta de forma clara si está dispuesto a continuar bajo esas condiciones.

DECISIÓN Y CIERRE
Si acepta continuar, solicita únicamente su nombre y un apellido, e indícale que un asesor especializado lo contactará por este mismo número de WhatsApp.
Si no acepta, desea verlo más adelante o no muestra interés real, brinda información general de cierre y despídete cordialmente sin intentar prolongar la conversación.

REGLAS IMPORTANTES
No brindes asesoría técnica o especializada.
No prometas resultados ni garantías.
No des opiniones profesionales definitivas.
Si mencionas montos, escríbelos en número y en texto (por ejemplo: S/ 300 – trescientos soles).
Aclara siempre que hablar con un asesor no tiene costo y que el pago solo aplica si inicia el proceso.
No envíes textos largos ni satures de información.
Promueve el diálogo y enfócate en calificar correctamente al lead.

CASOS ESPECIALES
Si el usuario indica ser cliente antiguo, tiene una queja o solicita hablar directamente con un asesor, pídele su nombre y el motivo del contacto, registra la solicitud y confirma que será contactado a la brevedad.`;

export default function AgentConfigPage() {
    const { user } = useAuth();
    const searchParams = useSearchParams();
    const agentId = searchParams.get('id');

    const [activeTab, setActiveTab] = useState<'behavior' | 'knowledge' | 'channels'>('behavior');
    const [files, setFiles] = useState<{ name: string, size: string }[]>([]);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // Form States
    const [nombre, setNombre] = useState('');
    const [personalidad, setPersonalidad] = useState('Asesor de ventas / Asistente Comercial');
    const [systemPrompt, setSystemPrompt] = useState(DEFAULT_SYSTEM_PROMPT);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [syncedNumbers, setSyncedNumbers] = useState<any[]>([]);
    const [isSyncing, setIsSyncing] = useState(false);
    const [elevenLabsAgentId, setElevenLabsAgentId] = useState('');
    const [associatedPhone, setAssociatedPhone] = useState<string | null>(null);
    const [associatedPhoneId, setAssociatedPhoneId] = useState<string | null>(null);
    const [showTestChat, setShowTestChat] = useState(false);
    const [isEditingNombre, setIsEditingNombre] = useState(false);
    const [isEditingPersonalidad, setIsEditingPersonalidad] = useState(false);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    // Custom Modals State
    const [fileToDelete, setFileToDelete] = useState<number | null>(null);
    const [showDeleteNumberModal, setShowDeleteNumberModal] = useState(false);
    const [infoModal, setInfoModal] = useState<{ isOpen: boolean, type: 'success' | 'error', message: string }>({ isOpen: false, type: 'success', message: '' });

    // Load Data
    React.useEffect(() => {
        if (!user) return;

        async function loadAgent() {
            if (!agentId) return;

            const { data, error } = await supabase
                .from('agentes')
                .select('*')
                .eq('id', agentId)
                .single();

            if (data && !error) {
                setNombre(data.nombre || '');
                setPersonalidad(data.personalidad || 'Profesional y Directo');
                setSystemPrompt(data.prompt || DEFAULT_SYSTEM_PROMPT);
                setAvatarPreview(data.avatar_url || null);
                setElevenLabsAgentId(data.eleven_labs_agent_id || '');
                setAssociatedPhone(data.phone_number || null);
                setAssociatedPhoneId(data.phone_number_id || null);
                // Load persisted knowledge files
                if (data.knowledge_files && Array.isArray(data.knowledge_files)) {
                    setFiles(data.knowledge_files);
                }
            }
        }

        loadAgent();
    }, [user, agentId]);

    const handleSave = async () => {
        if (!user) return;
        setIsSaving(true);

        try {
            const agentData = {
                nombre,
                personalidad,
                prompt: systemPrompt,
                avatar_url: avatarPreview,
                eleven_labs_agent_id: elevenLabsAgentId,
                phone_number: associatedPhone,
                phone_number_id: associatedPhoneId,
                knowledge_files: files,
                user_id: user.id
            };

            let error;
            if (agentId && agentId !== '1' && agentId !== '2') {
                // Update existing agent (don't update user_id)
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { user_id, ...updateData } = agentData;
                const { error: updateError } = await supabase
                    .from('agentes')
                    .update(updateData)
                    .eq('id', agentId);
                error = updateError;
            } else {
                // Insert new agent
                const { error: insertError } = await supabase
                    .from('agentes')
                    .insert([agentData]);
                error = insertError;
            }

            if (error) throw error;

            // Sync to ElevenLabs if we have an agent ID
            if (elevenLabsAgentId) {
                try {
                    await fetch(`/api/elevenlabs/agents/${elevenLabsAgentId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: nombre,
                            conversation_config: {
                                agent: {
                                    prompt: {
                                        prompt: systemPrompt
                                    }
                                }
                            }
                        })
                    });
                } catch (syncError) {
                    console.error('Error syncing to ElevenLabs:', syncError);
                }
            }

            setHasUnsavedChanges(false);
            setInfoModal({ isOpen: true, type: 'success', message: '¡Configuración guardada y sincronizada correctamente!' });
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error('Error saving agent:', error);
            setInfoModal({ isOpen: true, type: 'error', message: `Error al guardar los cambios: ${error.message || JSON.stringify(error)}` });
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;
        const rawFiles = Array.from(e.target.files);
        const newFiles = rawFiles.map(f => ({
            name: f.name,
            size: f.size > 1024 * 1024 ? (f.size / (1024 * 1024)).toFixed(1) + ' MB' : (f.size / 1024).toFixed(1) + ' KB'
        }));
        setFiles(prev => [...prev, ...newFiles]);
        setHasUnsavedChanges(true);

        // Sync to ElevenLabs if we have an agent ID
        if (elevenLabsAgentId) {
            for (const file of rawFiles) {
                try {
                    const formData = new FormData();
                    formData.append('file', file);
                    await fetch(`/api/elevenlabs/agents/${elevenLabsAgentId}/knowledge`, {
                        method: 'POST',
                        body: formData,
                    });
                } catch (err) {
                    console.error('Error uploading file to ElevenLabs:', err);
                }
            }
        }

        // Reset input so the same file can be re-uploaded
        e.target.value = '';
    };

    const removeFile = (index: number) => {
        setFileToDelete(index);
    };

    const confirmRemoveFile = async () => {
        if (fileToDelete === null) return;
        const fileToRemove = files[fileToDelete];
        setFiles(files.filter((_, i) => i !== fileToDelete));
        setHasUnsavedChanges(true);
        setFileToDelete(null);

        // Sync deletion to ElevenLabs - remove from KB via PATCH
        if (elevenLabsAgentId && fileToRemove) {
            try {
                // We fetch current agent detail to find the KB doc ID
                const detailRes = await fetch(`/api/elevenlabs/agents/${elevenLabsAgentId}`);
                if (detailRes.ok) {
                    const detail = await detailRes.json();
                    const kb = detail.conversation_config?.agent?.prompt?.knowledge_base || [];
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const matchingDoc = kb.find((doc: any) => doc.name === fileToRemove.name || doc.file_name === fileToRemove.name);
                    if (matchingDoc && matchingDoc.id) {
                        // Remove the doc from KB by patching the agent with the doc removed
                        const updatedKb = kb
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .filter((doc: any) => doc.id !== matchingDoc.id)
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            .map((doc: any) => ({ type: 'file', id: doc.id }));
                        await fetch(`/api/elevenlabs/agents/${elevenLabsAgentId}`, {
                            method: 'PATCH',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                conversation_config: {
                                    agent: {
                                        prompt: {
                                            knowledge_base: updatedKb
                                        }
                                    }
                                }
                            })
                        });
                    }
                }
            } catch (err) {
                console.error('Error removing file from ElevenLabs KB:', err);
            }
        }
    };

    const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAvatarPreview(reader.result as string);
                setHasUnsavedChanges(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImportFromMeta = () => {
        // Center of screen popup
        const width = 1000;
        const height = 800;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const url = 'https://elevenlabs.io/app/conversational-ai/whatsapp';
        window.open(
            url,
            'ElevenLabsWhatsApp',
            `width=${width},height=${height},left=${left},top=${top},scrollbars=yes,status=yes`
        );

        setInfoModal({ isOpen: true, type: 'success', message: 'Se ha abierto la ventana de ElevenLabs. Sigue los pasos para vincular tu número.' });
    };

    const handleSyncNumbers = async (silent = false) => {
        setIsSyncing(true);
        try {
            const response = await fetch('/api/elevenlabs/numbers');
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al sincronizar números');
            }
            const data = await response.json();
            const numbers = data.phone_numbers || [];
            setSyncedNumbers(numbers);

            if (!silent) {
                setInfoModal({ isOpen: true, type: 'success', message: 'Números sincronizados correctamente' });
            }
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(error);
            if (!silent) {
                setInfoModal({ isOpen: true, type: 'error', message: "Error: " + error.message });
            }
        } finally {
            setIsSyncing(false);
        }
    };

    const handleDeleteNumber = () => {
        setShowDeleteNumberModal(true);
    };

    const confirmDeleteNumber = async () => {
        setShowDeleteNumberModal(false);

        if (!associatedPhoneId) {
            setAssociatedPhone(null);
            setHasUnsavedChanges(true);
            return;
        }

        setIsSaving(true);
        try {
            // Only unlink from our panel, don't delete from ElevenLabs
            setAssociatedPhone(null);
            setAssociatedPhoneId(null);
            setHasUnsavedChanges(true);
            setInfoModal({ isOpen: true, type: 'success', message: 'Número desvinculado correctamente. Recuerda guardar los cambios.' });
        } catch (error: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
            console.error(error);
            setInfoModal({ isOpen: true, type: 'error', message: 'Error: ' + error.message });
        } finally {
            setIsSaving(false);
        }
    };


    React.useEffect(() => {
        if (showTestChat) {
            const script = document.createElement('script');
            script.src = "https://elevenlabs.io/convai-widget/index.js";
            script.async = true;
            script.type = "text/javascript";
            document.body.appendChild(script);
            return () => {
                document.body.removeChild(script);
            };
        }
    }, [showTestChat]);

    // Auto-sync when returning to the app
    React.useEffect(() => {
        const handleFocus = () => {
            if (activeTab === 'channels') {
                handleSyncNumbers(true);
            }
        };

        window.addEventListener('focus', handleFocus);
        return () => window.removeEventListener('focus', handleFocus);
    }, [activeTab]);


    return (
        <div className="max-w-7xl mx-auto space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 px-6 pt-4">
            {/* Navigation Header */}
            <div className="flex items-center">
                <Link href="/leads" className="flex items-center gap-2 text-gray-400 hover:text-gray-900 transition-colors group">
                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    <span className="text-xs font-medium uppercase tracking-widest">Volver</span>
                </Link>
            </div>

            <div className="flex items-end justify-between border-b border-gray-100 pb-4">
                <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Configuración del Agente</h2>
                    <p className="text-gray-500 text-xs">Define la personalidad, el conocimiento y los canales de tu experto en IA.</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
                <button
                    onClick={() => setActiveTab('behavior')}
                    className={`px-8 py-4 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2 ${activeTab === 'behavior'
                        ? 'border-brand-turquoise text-brand-turquoise'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <BrainCircuit size={18} />
                    1. Comportamiento
                </button>
                <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`px-8 py-4 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2 ${activeTab === 'knowledge'
                        ? 'border-brand-turquoise text-brand-turquoise'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <BookOpen size={18} />
                    2. Conocimiento
                </button>
                <button
                    onClick={() => setActiveTab('channels')}
                    className={`px-8 py-4 text-sm font-bold border-b-2 transition-all duration-300 flex items-center gap-2 ${activeTab === 'channels'
                        ? 'border-brand-turquoise text-brand-turquoise'
                        : 'border-transparent text-gray-400 hover:text-gray-600'
                        }`}
                >
                    <Users size={18} />
                    3. Número WhatsApp
                </button>
            </div>

            {/* Tab Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                {/* Main Content Area */}
                <div className="lg:col-span-2 flex flex-col">
                    {activeTab === 'behavior' && (
                        <div className="card-professional p-8 flex flex-col gap-6 animate-in fade-in duration-500 h-full">



                            {/* Avatar Section */}
                            <div className="flex items-center gap-6 pb-6 border-b border-gray-100">
                                <div className="relative group cursor-pointer">
                                    <div className="w-24 h-24 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden hover:border-brand-primary transition-colors">
                                        {avatarPreview ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <Camera size={28} className="text-gray-400 group-hover:text-brand-primary" />
                                        )}
                                    </div>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        id="avatar-upload"
                                    />
                                    <label htmlFor="avatar-upload" className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
                                        <span className="text-white text-[10px] font-bold uppercase tracking-widest">Cambiar</span>
                                    </label>
                                </div>
                                <div className="space-y-1 flex-1">
                                    <div className="flex items-center gap-2 group/name">
                                        {isEditingNombre ? (
                                            <input
                                                type="text"
                                                value={nombre}
                                                onChange={(e) => { setNombre(e.target.value); setHasUnsavedChanges(true); }}
                                                onBlur={() => setIsEditingNombre(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingNombre(false)}
                                                autoFocus
                                                className="text-xl font-bold text-gray-900 bg-gray-50 border-b border-brand-primary outline-none px-1 py-0.5 w-full max-w-xs"
                                            />
                                        ) : (
                                            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                                {nombre || 'Nombre del Agente'}
                                                <button
                                                    onClick={() => setIsEditingNombre(true)}
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-300 hover:text-brand-primary transition-all opacity-0 group-hover/name:opacity-100"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </h3>
                                        )}
                                    </div>

                                    <div className="flex items-center gap-2 group/desc">
                                        {isEditingPersonalidad ? (
                                            <input
                                                type="text"
                                                value={personalidad}
                                                onChange={(e) => { setPersonalidad(e.target.value); setHasUnsavedChanges(true); }}
                                                onBlur={() => setIsEditingPersonalidad(false)}
                                                onKeyDown={(e) => e.key === 'Enter' && setIsEditingPersonalidad(false)}
                                                autoFocus
                                                className="text-xs text-gray-500 bg-gray-50 border-b border-brand-primary outline-none px-1 py-0.5 w-full max-w-xs font-bold uppercase tracking-widest"
                                            />
                                        ) : (
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2">
                                                {personalidad || 'Define su función'}
                                                <button
                                                    onClick={() => setIsEditingPersonalidad(true)}
                                                    className="p-1 hover:bg-gray-100 rounded text-gray-300 hover:text-brand-primary transition-all opacity-0 group-hover/desc:opacity-100"
                                                >
                                                    <Pencil size={12} />
                                                </button>
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-0 flex-1 flex flex-col">
                                <div className="space-y-3 flex-1 flex flex-col">
                                    <div className="flex items-center justify-between px-1">
                                        <label className="text-sm font-bold text-gray-900 flex items-center gap-2 uppercase tracking-widest opacity-70">
                                            <FileText size={16} className="text-brand-primary" />
                                            Comportamiento del Agente (System Prompt)
                                        </label>
                                    </div>
                                    <div className="relative flex-1 min-h-[300px]">
                                        <textarea
                                            value={systemPrompt}
                                            onChange={(e) => { setSystemPrompt(e.target.value); setHasUnsavedChanges(true); }}
                                            placeholder=""
                                            className="w-full h-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-5 focus:ring-1 focus:ring-brand-primary/50 focus:border-brand-primary outline-none resize-none leading-relaxed text-sm shadow-inner"
                                        />
                                        <button
                                            onClick={() => setIsPromptModalOpen(true)}
                                            className="absolute top-4 right-4 p-2.5 bg-white/90 backdrop-blur-sm border border-gray-100 rounded-xl text-brand-primary shadow-sm hover:scale-110 transition-all hover:bg-brand-primary hover:text-white group"
                                            title="Editar en pantalla completa"
                                        >
                                            <Pencil size={20} className="transition-transform group-hover:rotate-12" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'knowledge' && (
                        <div className="card-professional p-8 space-y-8 animate-in fade-in duration-500 h-full">
                            <div className="space-y-6">
                                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 flex flex-col items-center justify-center space-y-2 hover:border-brand-turquoise/50 transition-colors">
                                    <div className="w-10 h-10 rounded-full bg-brand-turquoise/5 flex items-center justify-center text-brand-turquoise">
                                        <Upload size={20} />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-400 text-xs">Sube preguntas frecuentes, detalle de servicios, catálogos de precios o cualquier documento útil para tu agente.</p>
                                        <p className="text-[10px] text-gray-500 mt-0.5">PDF, DOCX, TXT (Max 10MB por archivo)</p>
                                    </div>
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileUpload}
                                        className="hidden"
                                        id="file-upload"
                                        accept=".pdf,.docx,.doc,.txt,.csv,.xlsx"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer px-5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-all"
                                    >
                                        Seleccionar Archivos
                                    </label>
                                </div>

                                {files.length > 0 && (
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Archivos Subidos ({files.length})</h4>
                                        <div className="max-h-[200px] overflow-y-auto pr-1 space-y-1.5 scrollbar-thin">
                                            {files.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between py-1.5 px-2.5 bg-gray-50 border border-gray-100 rounded-lg">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <FileText size={14} className="text-brand-turquoise shrink-0" />
                                                        <div className="min-w-0">
                                                            <p className="text-[11px] font-semibold text-gray-900 truncate max-w-[180px]">{file.name}</p>
                                                            <p className="text-[9px] text-gray-400">{file.size}</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={() => removeFile(i)}
                                                        className="p-0.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded transition-colors shrink-0"
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'channels' && (
                        <div className="card-professional p-8 space-y-8 animate-in fade-in duration-500 h-full">
                            <div className="flex items-center gap-4 pb-6 border-b border-gray-100">
                                <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
                                    <Users size={24} />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-lg font-bold text-gray-900">Configuración de WhatsApp</h3>
                                    <p className="text-xs text-gray-500">Conecta tu agente a WhatsApp Business mediante Meta.</p>
                                </div>
                            </div>

                            <div className="space-y-8">

                                <div className="p-8 border-2 border-dashed border-gray-100 rounded-3xl flex flex-col items-center justify-center space-y-6 bg-gray-50/50 min-h-[240px]">
                                    {associatedPhone ? (
                                        <div className="w-full max-w-sm">
                                            <div className="bg-white p-5 rounded-2xl border border-brand-turquoise/20 shadow-sm flex items-center justify-between group transition-all hover:shadow-md">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-brand-turquoise/10 flex items-center justify-center text-brand-turquoise">
                                                        <CheckCircle2 size={20} />
                                                    </div>
                                                    <div>
                                                        <p className="text-base font-bold text-gray-900">{associatedPhone}</p>
                                                        <div className="flex items-center gap-1.5 mt-0.5">
                                                            <span className="w-1.5 h-1.5 rounded-full bg-brand-turquoise animate-pulse" />
                                                            <p className="text-[10px] text-brand-turquoise font-bold uppercase tracking-widest">En Línea</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button
                                                        onClick={() => handleSyncNumbers()}
                                                        disabled={isSyncing}
                                                        className="p-2.5 hover:bg-brand-turquoise/10 text-brand-turquoise rounded-xl transition-all"
                                                        title="Refrescar conexión"
                                                    >
                                                        <RefreshCw size={18} className={isSyncing ? "animate-spin" : ""} />
                                                    </button>
                                                    <button
                                                        onClick={handleDeleteNumber}
                                                        className="p-2.5 hover:bg-red-50 text-gray-300 hover:text-red-500 rounded-xl transition-all"
                                                        title="Desvincular WhatsApp"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center space-y-8 w-full max-w-sm">
                                            <div className="space-y-4">
                                                <div className="w-16 h-16 bg-[#1877F2]/10 text-[#1877F2] rounded-3xl flex items-center justify-center mx-auto transition-transform hover:scale-110 duration-300">
                                                    <svg width="32" height="32" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                                                    </svg>
                                                </div>
                                                <div className="space-y-1">
                                                    <h4 className="text-lg font-bold text-gray-900 tracking-tight">Conecta tu WhatsApp</h4>
                                                    <p className="text-[11px] text-gray-500 max-w-[240px] mx-auto leading-relaxed">Vincula tu número oficial de Meta para habilitar las llamadas de tu agente.</p>
                                                </div>
                                            </div>

                                            <button
                                                onClick={handleImportFromMeta}
                                                className="w-full py-4 bg-[#1877F2] text-white rounded-2xl text-[13px] font-bold hover:bg-[#166fe5] hover:-translate-y-1 transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-500/20 active:scale-95"
                                            >
                                                Vincular con Meta
                                            </button>

                                            <button
                                                onClick={() => handleSyncNumbers()}
                                                disabled={isSyncing}
                                                className="text-[10px] text-gray-400 font-bold uppercase tracking-widest hover:text-brand-turquoise transition-colors flex items-center justify-center gap-2 mx-auto pt-2"
                                            >
                                                <RefreshCw size={12} className={isSyncing ? "animate-spin" : ""} />
                                                <span>Si ya lo vinculaste, pulsa aquí para refrescar</span>
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {syncedNumbers.length > 0 && !associatedPhone && (
                                    <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in duration-500">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest text-center">Números detectados</p>
                                        <div className="grid gap-2 max-w-sm mx-auto">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {syncedNumbers.map((num: any) => (
                                                <button
                                                    key={num.phone_number_id}
                                                    onClick={async () => {
                                                        const confirmLink = confirm(`¿Quieres vincular el número ${num.phone_number} a este agente?`);
                                                        if (!confirmLink) return;

                                                        setIsSaving(true);
                                                        try {
                                                            // Link in ElevenLabs
                                                            if (elevenLabsAgentId) {
                                                                await fetch(`/api/elevenlabs/numbers/${num.phone_number_id}`, {
                                                                    method: 'PATCH',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ agent_id: elevenLabsAgentId })
                                                                });
                                                            }

                                                            setAssociatedPhone(num.phone_number);
                                                            setAssociatedPhoneId(num.phone_number_id);
                                                            setHasUnsavedChanges(true);
                                                            alert("Número vinculado al agente correctamente.");
                                                        } catch (err) {
                                                            console.error(err);
                                                            alert("Error al vincular el número en ElevenLabs.");
                                                        } finally {
                                                            setIsSaving(false);
                                                        }
                                                    }}
                                                    className="p-4 bg-white border border-gray-100 rounded-2xl text-xs text-gray-700 hover:border-brand-turquoise/50 hover:bg-brand-turquoise/5 transition-all text-left flex items-center justify-between group shadow-sm"
                                                >
                                                    <span className="font-bold">{num.phone_number}</span>
                                                    <span className="text-[10px] text-brand-turquoise font-bold opacity-0 group-hover:opacity-100 transition-opacity">Vincular →</span>
                                                </button>
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
                    {/* Action Buttons Location */}
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowTestChat(true)}
                            className="px-4 py-3 border border-brand-primary text-brand-primary rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2 bg-white"
                            disabled={!elevenLabsAgentId}
                        >
                            <Sparkles size={14} />
                            Probar Agente
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className={cn(
                                "px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all shadow-lg flex items-center justify-center gap-2 hover:-translate-y-0.5 text-white",
                                hasUnsavedChanges
                                    ? "bg-amber-500 shadow-amber-500/20"
                                    : "bg-brand-primary shadow-brand-primary/20"
                            )}
                        >
                            {isSaving ? <RefreshCw size={14} className="animate-spin" /> : <Save size={14} />}
                            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                        </button>
                    </div>

                    <div className="card-professional p-6 bg-brand-turquoise/5 border-brand-turquoise/10">
                        <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Sparkles size={16} className="text-brand-turquoise" />
                            Tips de Configuración
                        </h4>
                        <ul className="space-y-4 text-xs text-gray-600 leading-relaxed">
                            <li>
                                <span className="font-bold block text-gray-900 mb-1">Comportamiento</span>
                                Define claramente el rol y el tono. Ejemplo: &quot;Eres un asistente amable y persuasivo de ventas.&quot;
                            </li>
                            <li>
                                <span className="font-bold block text-gray-900 mb-1">Conocimiento</span>
                                Sube PDFs con precios y preguntas frecuentes para que el agente tenga respuestas precisas.
                            </li>
                            <li>
                                <span className="font-bold block text-gray-900 mb-1">Número WhatsApp</span>
                                Vincula un número exclusivo para que tu agente pueda recibir y realizar llamadas 24/7.
                            </li>
                        </ul>
                    </div>

                    <div className="card-professional p-6 border-gray-100">
                        <h4 className="text-sm font-bold text-gray-900 mb-4">Estado del Agente</h4>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Nombre</span>
                                {nombre ? (
                                    <CheckCircle2 size={16} className="text-brand-turquoise" />
                                ) : (
                                    <div className="text-amber-500 rounded-full">
                                        <MinusCircle size={16} />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Comportamiento</span>
                                {systemPrompt ? (
                                    <CheckCircle2 size={16} className="text-brand-turquoise" />
                                ) : (
                                    <div className="text-amber-500 rounded-full">
                                        <MinusCircle size={16} />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Conocimiento</span>
                                {files.length > 0 ? (
                                    <CheckCircle2 size={16} className="text-brand-turquoise" />
                                ) : (
                                    <div className="text-amber-500 rounded-full">
                                        <MinusCircle size={16} />
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-between items-center text-xs">
                                <span className="text-gray-500">Número WhatsApp</span>
                                {associatedPhone ? (
                                    <CheckCircle2 size={16} className="text-brand-turquoise" />
                                ) : (
                                    <div className="text-amber-500 rounded-full">
                                        <MinusCircle size={16} />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Test Chat Modal */}
            {
                showTestChat && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[600px]">
                            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-brand-turquoise/10 flex items-center justify-center text-brand-turquoise">
                                        <Sparkles size={16} />
                                    </div>
                                    <h3 className="font-bold text-gray-900">Probar Agente</h3>
                                </div>
                                <button
                                    onClick={() => setShowTestChat(false)}
                                    className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <div className="flex-1 bg-gray-50 relative min-h-[500px]">
                                {/* ElevenLabs Widget Container */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    {elevenLabsAgentId ? (
                                        // @ts-expect-error - custom element
                                        <elevenlabs-convai agent-id={elevenLabsAgentId}></elevenlabs-convai>
                                    ) : (
                                        <p className="text-sm text-gray-400 font-medium italic">Configura un ID de agente para probar...</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Prompt Fullscreen Modal */}
            {isPromptModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[85vh]">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                                    <FileText size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900">Comportamiento del Agente</h3>
                                    <p className="text-xs text-gray-500">Edita el System Prompt en pantalla completa</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsPromptModalOpen(false)}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-400"
                            >
                                <X size={24} />
                            </button>
                        </div>
                        <div className="flex-1 p-6 bg-gray-50">
                            <textarea
                                value={systemPrompt}
                                onChange={(e) => { setSystemPrompt(e.target.value); setHasUnsavedChanges(true); }}
                                className="w-full h-full bg-white border border-gray-200 rounded-2xl p-8 focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none resize-none leading-relaxed text-[13px] text-gray-800 shadow-sm font-medium"
                                placeholder="Escribe aquí las instrucciones detalladas para el comportamiento de tu agente..."
                                autoFocus
                            />
                        </div>
                        <div className="p-6 border-t border-gray-100 flex items-center justify-end bg-white gap-3">
                            <span className="text-xs text-gray-400 italic">Los cambios en el prompt se guardan al cerrar. No olvides el botón principal de guardar.</span>
                            <button
                                onClick={() => setIsPromptModalOpen(false)}
                                className={cn(
                                    "px-8 py-3 rounded-xl text-sm font-bold shadow-lg transition-all hover:scale-105 active:scale-95 text-white",
                                    hasUnsavedChanges
                                        ? "bg-amber-500 shadow-amber-500/20"
                                        : "bg-brand-primary shadow-brand-primary/20"
                                )}
                            >
                                Guardar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* File Delete Confirmation Modal */}
            {fileToDelete !== null && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¿Eliminar Archivo?</h3>
                        <p className="text-sm text-gray-500 mb-8">
                            Estás a punto de eliminar este archivo de conocimiento.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setFileToDelete(null)}
                                className="flex-1 py-3 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmRemoveFile}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Sí, Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* WhatsApp Number Delete Confirmation Modal */}
            {showDeleteNumberModal && (
                <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 p-8 text-center">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <X size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">¿Desvincular Número?</h3>
                        <p className="text-sm text-gray-500 mb-8">
                            El número se desvinculará de este agente en tu panel. No se eliminará de ElevenLabs ni de Meta.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowDeleteNumberModal(false)}
                                className="flex-1 py-3 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-gray-100 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteNumber}
                                className="flex-1 py-3 bg-red-500 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
                            >
                                Sí, Desvincular
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Info/Success/Error Modal */}
            {infoModal.isOpen && (
                <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
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
        </div >
    );
}

// Global scope type safety for custom element
declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            'elevenlabs-convai': any;
        }
    }
}
