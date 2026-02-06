"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useMemo, useEffect } from 'react';
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
import { useProfile } from '@/hooks/useProfile';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

// --- Types ---
type LeadStatus = 'POTENCIAL' | 'NO POTENCIAL';

interface Lead {
    id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    status: LeadStatus;
    summary: string;
    conversation: { role: 'user' | 'assistant', text: string }[];
    custom_data?: Record<string, unknown>;
    score: number;
}

type AgentPersonality = 'VENDER' | 'AGENDAR' | 'SOPORTE' | 'COBRAR' | 'CALIFICAR' | 'GENERAL';

interface PromptBlock {
    id: string;
    title: string;
    content: string;
}

interface KBFile {
    id: string;
    name: string;
    type: string;
    size: string;
    uploadedAt: string;
}

interface ProductAttribute {
    id: string;
    label: string;
    value: string;
}

interface Product {
    id: string;
    name: string;
    description: string;
    price: string;
    availability: 'DISPONIBLE' | 'AGOTADO' | 'BAJO PEDIDO';
    images: string[]; // Max 4
    attributes: ProductAttribute[];
    category: string;
}

interface Agent {
    id: string;
    name: string;
    specialty: string;
    personality: AgentPersonality;
    status: 'active' | 'inactive';
    leadsCount: number;
    createdAt: string;
    tokenUsage: number;
    image?: string;
    systemPromptBlocks: PromptBlock[];
    channel: 'TEXT' | 'AUDIO';
    voiceConfig?: {
        voiceId: string;
        stability: number;
        similarityBoost: number;
    };
    knowledgeBase?: KBFile[];
    catalog?: Product[];
}

// --- Prompt Templates ---
const PROMPT_TEMPLATES: Record<AgentPersonality, PromptBlock[]> = {
    VENDER: [
        { id: '1', title: 'PERSONALIDAD', content: 'Tu nombre es {{AGENT_NAME}}, eres un asesor virtual de la empresa [EMPRESA]. Estás especializado en orientar y filtrar potenciales clientes interesados en nuestros productos/servicios. Eres claro, eficiente y profesional, con un tono amigable y cercano, hablando siempre por el nombre de la persona (si no lo tienes pídeselo), sin usar “usted”, generando confianza desde el primer mensaje. No menciones que quieres saber el nombre del cliente para "PERSONALIZAR" la conversación, usa otra frase natural.' },
        { id: '2', title: 'CONTEXTO', content: 'Interactúas por chat con personas que han solicitado información. Los leads pueden variar entre personas realmente interesadas, curiosos o personas con dudas específicas. Muchos están dispuestos a comprar si entienden el valor. Tu misión es convertir ese interés inicial en una oportunidad de venta clara.' },
        { id: '3', title: 'TONO', content: 'Profesional, claro y cercano. Amigable, sin ser invasivo. Seguro, sin prometer resultados imposibles. Lenguaje sencillo, evitando tecnicismos innecesarios que confundan al cliente.' },
        { id: '4', title: 'OBJETIVO', content: 'Tu objetivo es identificar y calificar leads, sin mucho rodeo, determinando: 1. Si la persona tiene una necesidad real. 2. Si tiene el presupuesto o la intención de compra. 3. Si es el momento adecuado. Según esto, decides si brindar información general o derivarlo con un cierre de ventas. Trata de calificar con pocas preguntas. Induce siempre a que el cliente avance en el embudo.' },
        { id: '5', title: 'FLUJO DE CONVERSACIÓN', content: '1. Inicio: Saluda y explica el motivo. 2. Identificación: Pregunta qué busca específicamente. 3. Clasificación: Si es info general, sé breve. Si hay interés profundo, profundiza. 4. Filtro: Valida sutilmente su intención de compra. 5. Cierre: Llévalo a la acción deseada (cita, compra, registro). Si no interesa, despídete cordialmente.' },
        { id: '6', title: 'REGLAS IMPORTANTES', content: 'No brindes datos falsos. No prometas cosas que no están en tu base de conocimiento. Escribe montos con el dato en paréntesis. Sé breve y puntual, evita textos largos (biblias) que nadie lee. Promueve el diálogo. Si el usuario se va por las ramas, regrésalo al objetivo.' }
    ],
    AGENDAR: [
        { id: '1', title: 'PERSONALIDAD', content: 'Tu nombre es {{AGENT_NAME}}, eres el coordinador de agenda de [EMPRESA]. Tu especialidad es organizar citas de manera eficiente, evitando fricciones y asegurando que cada espacio reservado sea un compromiso firme. Eres amable pero estructurado y valoras el tiempo de todos.' },
        { id: '2', title: 'CONTEXTO', content: 'Gestionas la agenda a través de chat. Los clientes escriben buscando una reunión, servicio o evaluación. Debes conciliar su disponibilidad con la de la empresa para encontrar el hueco perfecto.' },
        { id: '3', title: 'TONO', content: 'Servicial, preciso y cordial. Usas formato de 24h o AM/PM consistentemente para evitar confusiones. Siempre confirmas el día y la hora explícitamente antes de cerrar la conversación.' },
        { id: '4', title: 'OBJETIVO', content: 'Lograr que el cliente reserve una cita válida. Debes obtener: Motivo de la cita, Fecha/Hora propuesta y Datos de contacto. Si no hay espacio en la fecha solicitada, ofrece proactivamente las opciones más cercanas disponibles.' },
        { id: '5', title: 'FLUJO DE CONVERSACIÓN', content: '1. Saludo y solicitud del motivo de la visita. 2. Oferta de disponibilidad (da 2 o 3 opciones concretas, no preguntes "¿cuándo quieres?"). 3. Selección y validación de datos del cliente. 4. Confirmación final con resumen completo de la cita. 5. Despedida.' },
        { id: '6', title: 'REGLAS IMPORTANTES', content: 'No agendes citas en el pasado. Si el cliente divaga, redirígelo amablemente a definir una fecha. Confirma siempre la zona horaria si es relevante. Si cancelan, ofrece reagendar de inmediato.' }
    ],
    SOPORTE: [
        { id: '1', title: 'PERSONALIDAD', content: 'Tu nombre es {{AGENT_NAME}}, eres un especialista de soporte técnico de [EMPRESA]. Tu misión es resolver dudas frecuentes y problemas técnicos básicos con paciencia infinita y claridad pedagógica.' },
        { id: '2', title: 'CONTEXTO', content: 'Los usuarios te contactan porque algo no funciona, tienen una duda o están bloqueados. Pueden estar frustrados o confundidos. Tu trabajo es calmarlos, entender el problema y guiarlos hacia la solución paso a paso.' },
        { id: '3', title: 'TONO', content: 'Empático, paciente y técnico pero accesible. Evita jerga compleja a menos que el usuario sea experto. Usa frases como "Entiendo el problema" o "Vamos a solucionarlo juntos" para generar calma.' },
        { id: '4', title: 'OBJETIVO', content: 'Diagnosticar el problema y ofrecer una solución inmediata. Si no puedes resolverlo, debes escalar el ticket recopilando toda la información necesaria (capturas, mensajes de error, pasos reproducibles).' },
        { id: '5', title: 'FLUJO DE CONVERSACIÓN', content: '1. Saludo y pregunta por el problema("¿En qué te puedo ayudar hoy?"). 2. Escucha activa y validación (parafrasear el error para confirmar entendimiento). 3. Instrucciones de solución paso a paso. 4. Verificación de éxito ("¿Se solucionó?"). 5. Cierre o escalado.' },
        { id: '6', title: 'REGLAS IMPORTANTES', content: 'Nunca culpes al usuario. Si no sabes la respuesta, no inventes; di que consultarás con un superior o base de conocimiento. Verifica siempre que la solución haya funcionado antes de despedirte.' }
    ],
    COBRAR: [
        { id: '1', title: 'PERSONALIDAD', content: 'Tu nombre es {{AGENT_NAME}}, eres gestor de cuentas y cobranzas en [EMPRESA]. Tu rol es asegurar el flujo de caja recuperando pagos pendientes, manteniendo siempre la relación comercial a largo plazo y la cordialidad.' },
        { id: '2', title: 'CONTEXTO', content: 'Contactas a clientes con facturas vencidas o próximas a vencer. Algunos pueden haber olvidado pagar, otros pueden tener problemas de liquidez. Debes identificar la situación.' },
        { id: '3', title: 'TONO', content: 'Firme, profesional y respetuoso. No eres agresivo, pero sí persistente. Buscas acuerdos y soluciones, no conflictos. Transmites seriedad en los plazos.' },
        { id: '4', title: 'OBJETIVO', content: 'Obtener un compromiso de pago concreto: una fecha y un monto exactos. Si ya pagaron, solicitar el comprobante. Identificar la causa raíz del no pago para reportarla.' },
        { id: '5', title: 'FLUJO DE CONVERSACIÓN', content: '1. Identificación y motivo del contacto (factura pendiente). 2. Indagación de la causa del retraso (¿Hubo algún inconveniente?). 3. Negociación de fecha de pago. 4. Confirmación del acuerdo y consecuencias. 5. Cierre formal.' },
        { id: '6', title: 'REGLAS IMPORTANTES', content: 'No aceptes promesas vagas como "te pago luego". Pide fechas exactas. Mantén la confidencialidad de la deuda. Si el cliente se molesta, mantén la calma y vuelve al objetivo del pago.' }
    ],
    GENERAL: [
        { id: '1', title: 'PERSONALIDAD', content: 'Tu nombre es {{AGENT_NAME}}, eres el anfitrión virtual de [EMPRESA]. Eres la primera cara amable que los visitantes encuentran. Conoces un poco de todo y sabes a quién derivar cada tema con precisión.' },
        { id: '2', title: 'CONTEXTO', content: 'Atiendes el canal general. Llegan consultas de todo tipo: horarios, ubicación, reclamos, ventas, empleo. Eres el filtro principal de la organización.' },
        { id: '3', title: 'TONO', content: 'Muy amable, hospitalario y eficiente. Eres la "recepción" de lujo de la empresa. Siempre saludas con energía y disposición.' },
        { id: '4', title: 'OBJETIVO', content: 'Clasificar la consulta y resolverla si es información pública (horarios, dirección) o derivarla al departamento correcto (Ventas, Soporte, RRHH) rápidamente para no hacer perder tiempo al usuario.' },
        { id: '5', title: 'FLUJO DE CONVERSACIÓN', content: '1. Saludo cálido. 2. Pregunta abierta: "¿En qué puedo ayudarte hoy?". 3. Identificación del tema. 4. Respuesta directa o transferencia a área correspondiente (dando datos de contacto). 5. Despedida.' },
        { id: '6', title: 'REGLAS IMPORTANTES', content: 'No des correos o teléfonos personales de empleados. Si no entiendes la consulta, ofrece un menú de opciones generales. Mantén siempre la cortesía, incluso si el usuario es grosero.' }
    ],
    CALIFICAR: [
        { id: '1', title: 'PERSONALIDAD', content: 'Tu nombre es {{AGENT_NAME}}, eres analista de oportunidades comerciales en [EMPRESA]. Tu talento es distinguir entre curiosos y compradores serios mediante preguntas estratégicas y análisis de respuestas.' },
        { id: '2', title: 'CONTEXTO', content: 'Recibes leads de campañas de marketing. Tu tiempo es valioso y el del equipo de ventas también. Debes filtrar quién merece una llamada de un ejecutivo senior y quién necesita más nutrición.' },
        { id: '3', title: 'TONO', content: 'Curioso, inteligente y estratégico. Haces preguntas abiertas. No vendes el producto, vendes el siguiente paso (la reunión con el experto). Eres consultivo.' },
        { id: '4', title: 'OBJETIVO', content: 'Determinar el fit del cliente usando criterios como BANT (Presupuesto, Autoridad, Necesidad, Tiempo). Si califica, tu meta es agendar el paso siguiente; si no, nutrir con info general.' },
        { id: '5', title: 'FLUJO DE CONVERSACIÓN', content: '1. Bienvenida y contexto. 2. Preguntas de calificación (¿Qué buscas solucionar? ¿Para cuándo lo necesitas?). 3. Evaluación de respuestas. 4. Cierre (agendar cita o enviar material informativo).' },
        { id: '6', title: 'REGLAS IMPORTANTES', content: 'No presiones la venta directa todavía. Escucha más de lo que hablas. Si el lead no tiene presupuesto o interés real, descártalo amablemente sin perder tiempo. Registra los motivos de descarte.' }
    ]
};

// --- Mock Data ---
const MOCK_LEADS: Lead[] = Array.from({ length: 45 }).map((_, i) => {
    const statuses: LeadStatus[] = ['POTENCIAL', 'NO POTENCIAL'];
    const status = statuses[i % 2];

    return {
        id: String(i + 1),
        name: `Lead Usuario ${i + 1}`,
        email: `usuario${i + 1}@ejemplo.pe`,
        phone: `+51 900 000 ${String(100 + i)}`,
        date: `2024-02-${String(Math.max(1, 15 - (i % 10))).padStart(2, '0')}`,
        status,
        summary: status === 'POTENCIAL'
            ? "Este cliente está extremadamente interesado en los servicios de odontología estética. Ha consultado específicamente por carillas de porcelana y ha mencionado que le gustaría agendar una cita de evaluación para la próxima semana. Es un perfil con alta intención de compra."
            : "El usuario consultó sobre limpieza dental básica y blanqueamiento. Mencionó que está comparando precios con otros centros y que por ahora no desea agendar una cita. Se recomienda seguimiento en 15 días si hay promociones vigentes.",
        conversation: [
            { role: 'user', text: 'Hola, me gustaría saber más sobre sus servicios de odontología.' },
            { role: 'assistant', text: '¡Hola! Claro que sí. Tenemos especialistas en estética, ortodoncia y salud general. ¿Buscas algo en particular?' },
            { role: 'user', text: i % 3 === 0 ? 'Me interesa un diseño de sonrisa.' : '¿Tienen citas de limpieza para esta semana?' },
        ],
        custom_data: {
            "Servicio": i % 3 === 0 ? "Diseño de Sonrisa" : (i % 2 === 0 ? "Limpieza Profunda" : "Ortodoncia"),
            "Preferencia": i % 2 === 0 ? "Lunes Mañana" : "Viernes Tarde",
            "Urgencia": i % 3 === 0 ? "Alta" : "Media"
        },
        score: Math.floor(Math.random() * (99 - 60 + 1)) + 60
    };
});

// --- Components ---

export default function AgentsAndLeadsPage() {
    const { profile } = useProfile();
    const niche = profile?.empresa?.nicho || 'general';

    // labels based on niche
    const nicheLabels = {
        libreria: { unit: 'Libro', inventory: 'Catálogo de Libros', leadAction: 'Consulta de Libro' },
        restaurante: { unit: 'Plato', inventory: 'Menú Digital', leadAction: 'Reserva/Pedido' },
        general: { unit: 'Producto', inventory: 'Catálogo', leadAction: 'Interés' }
    }[niche];

    // --- State ---
    const [view, setView] = useState<'GALLERY' | 'DASHBOARD' | 'CATALOG'>('GALLERY');
    const [agents, setAgents] = useState<Agent[]>([]);
    const [isCreateModalOpen, setCreateModalOpen] = useState(false);
    const [consumptionDetail, setConsumptionDetail] = useState<Agent | null>(null);
    const [newAgentName, setNewAgentName] = useState('');
    const [newAgentSpecialty, setNewAgentSpecialty] = useState('');
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
    const [configAgent, setConfigAgent] = useState<Agent | null>(null);
    const [activeConfigTab, setActiveConfigTab] = useState<'ID' | 'BEH' | 'KB' | 'ADV'>('ID');
    const [catalogAgent, setCatalogAgent] = useState<Agent | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [catalogCategoryFilter, setCatalogCategoryFilter] = useState<string>('Todos');
    const [catalogSearch, setCatalogSearch] = useState<string>('');

    // Leads logic (extracted from previous version)
    const [filter, setFilter] = useState<'TOTAL' | 'POTENCIAL' | 'NO POTENCIAL'>('TOTAL');
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(14);
    const [selectedChat, setSelectedChat] = useState<Lead | null>(null);
    const [activeSummary, setActiveSummary] = useState<Lead | null>(null);

    // Column Visibility State
    const [hiddenColumns, setHiddenColumns] = useState<string[]>([]);
    const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    // Custom Modal State
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
        type: 'danger' | 'warning' | 'success';
    }>({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'warning'
    });

    const hasUnsavedChanges = useMemo(() => {
        if (!configAgent) return false;
        const original = agents.find(a => a.id === configAgent.id);
        if (!original) return false;
        return JSON.stringify(configAgent) !== JSON.stringify(original);
    }, [configAgent, agents]);

    const originalPersonality = useMemo(() => {
        if (!configAgent) return null;
        return agents.find(a => a.id === configAgent.id)?.personality;
    }, [configAgent, agents]);

    const categories = useMemo(() => {
        if (!catalogAgent) return ['General'];
        const cats = new Set((catalogAgent.catalog || []).map(p => p.category));
        const catsArray = Array.from(cats).filter(c => c && c !== 'General');
        return ['Todos', 'General', ...catsArray];
    }, [catalogAgent]);

    const filteredCatalog = useMemo(() => {
        if (!catalogAgent) return [];
        return (catalogAgent.catalog || []).filter(p => {
            const matchesSearch = p.name.toLowerCase().includes(catalogSearch.toLowerCase()) ||
                p.description.toLowerCase().includes(catalogSearch.toLowerCase());
            const matchesCategory = catalogCategoryFilter === 'Todos' || p.category === catalogCategoryFilter;
            return matchesSearch && matchesCategory;
        });
    }, [catalogAgent, catalogSearch, catalogCategoryFilter]);

    const originalChannel = useMemo(() => {
        if (!configAgent) return null;
        return agents.find(a => a.id === configAgent.id)?.channel;
    }, [configAgent, agents]);

    const originalVoiceId = useMemo(() => {
        if (!configAgent) return null;
        return agents.find(a => a.id === configAgent.id)?.voiceConfig?.voiceId;
    }, [configAgent, agents]);

    // --- Effects (Persistence) ---
    useEffect(() => {
        const savedAgents = localStorage.getItem('antigravity_agents');
        if (savedAgents) {
            try {
                const parsed = JSON.parse(savedAgents);
                // Data normalization for pre-existing users
                const normalized = parsed.map((a: any) => ({
                    ...a,
                    personality: a.personality || 'GENERAL',
                    systemPromptBlocks: a.systemPromptBlocks || PROMPT_TEMPLATES.GENERAL,
                    channel: a.channel || 'TEXT',
                    voiceConfig: a.voiceConfig || { voiceId: 'adam', stability: 0.5, similarityBoost: 0.75 },
                    knowledgeBase: a.knowledgeBase || [],
                    catalog: a.catalog || []
                }));
                setAgents(normalized);
            } catch (e) {
                console.error('Error parsing agents', e);
            }
        }
    }, []);

    useEffect(() => {
        if (agents.length > 0) {
            localStorage.setItem('antigravity_agents', JSON.stringify(agents));
        }
    }, [agents]);


    // --- Handlers ---
    const handleCreateAgent = () => {
        if (!newAgentName.trim()) return;
        const newAgent: Agent = {
            id: String(Date.now()),
            name: newAgentName,
            specialty: newAgentSpecialty || "Asistente de Captación",
            personality: 'GENERAL',
            status: 'active',
            leadsCount: 0,
            createdAt: new Date().toISOString(),
            tokenUsage: Math.floor(Math.random() * 100),
            systemPromptBlocks: PROMPT_TEMPLATES.GENERAL,
            channel: 'TEXT',
            voiceConfig: { voiceId: 'adam', stability: 0.5, similarityBoost: 0.75 },
            knowledgeBase: [],
            catalog: []
        };
        setAgents([...agents, newAgent]);
        setNewAgentName('');
        setNewAgentSpecialty('');
        setCreateModalOpen(false);
    };

    const handleToggleStatus = (id: string) => {
        setAgents(prev => prev.map(a =>
            a.id === id ? { ...a, status: a.status === 'active' ? 'inactive' : 'active' } : a
        ));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, agentId: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAgents(prev => prev.map(a =>
                    a.id === agentId ? { ...a, image: reader.result as string } : a
                ));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleDeleteAgent = (agentId: string) => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar Agente?',
            message: '¿Estás seguro de que deseas eliminar este agente? Esta acción no se puede deshacer.',
            type: 'danger',
            onConfirm: () => {
                setAgents(prev => prev.filter(a => a.id !== agentId));
                setConfirmModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDuplicateAgent = (agent: Agent) => {
        const newAgent: Agent = {
            ...agent,
            id: String(Date.now()),
            name: `${agent.name} - Copia`,
            createdAt: new Date().toISOString(),
            leadsCount: 0,
            tokenUsage: 0
        };
        setAgents(prev => [...prev, newAgent]);

        setConfirmModal({
            isOpen: true,
            title: 'Agente Duplicado',
            message: `Se ha creado una copia de "${agent.name}" correctamente.`,
            type: 'success',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    const handleUpdateConfig = () => {
        if (!configAgent) return;

        setConfirmModal({
            isOpen: true,
            title: '¿Guardar Cambios?',
            message: '¿Estás seguro de que deseas aplicar esta nueva configuración al agente?',
            type: 'warning',
            onConfirm: () => {
                setAgents(prev => prev.map(a => a.id === configAgent.id ? configAgent : a));
                setConfirmModal({
                    isOpen: true,
                    title: '¡Guardado con éxito!',
                    message: 'La configuración del agente ha sido actualizada correctamente.',
                    type: 'success',
                    onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
                });
            }
        });
    };

    const handleSaveCatalog = () => {
        if (!catalogAgent) return;
        setAgents(prev => prev.map(a => a.id === catalogAgent.id ? catalogAgent : a));
        setView('GALLERY');
        setConfirmModal({
            isOpen: true,
            title: 'Catálogo Actualizado',
            message: 'Los productos han sido guardados correctamente.',
            type: 'success',
            onConfirm: () => setConfirmModal(prev => ({ ...prev, isOpen: false }))
        });
    };

    const addProduct = () => {
        if (!catalogAgent) return;
        const newProduct: Product = {
            id: String(Date.now()),
            name: `Nuevo ${nicheLabels.unit}`,
            description: `Descripción detallada del ${nicheLabels.unit.toLowerCase()}...`,
            price: '0.00',
            availability: 'DISPONIBLE',
            images: [],
            attributes: [
                { id: '1', label: 'Nombre Detalle', value: '' },
                { id: '2', label: 'Descripción', value: '' }
            ],
            category: 'General'
        };
        setCatalogAgent({
            ...catalogAgent,
            catalog: [...(catalogAgent.catalog || []), newProduct]
        });
        setEditingProduct(newProduct);
    };

    const addAttribute = () => {
        if (!editingProduct) return;
        setEditingProduct({
            ...editingProduct,
            attributes: [...editingProduct.attributes, { id: String(Date.now()), label: 'Nuevo Campo', value: '' }]
        });
    };

    const removeAttribute = (id: string) => {
        if (!editingProduct) return;
        setEditingProduct({
            ...editingProduct,
            attributes: editingProduct.attributes.filter(a => a.id !== id)
        });
    };

    const deleteProduct = (id: string) => {
        if (!catalogAgent) return;
        setCatalogAgent({
            ...catalogAgent,
            catalog: (catalogAgent.catalog || []).filter(p => p.id !== id)
        });
        if (editingProduct?.id === id) setEditingProduct(null);
    };

    const updateProduct = (updated: Product) => {
        if (!catalogAgent) return;
        setCatalogAgent({
            ...catalogAgent,
            catalog: (catalogAgent.catalog || []).map(p => p.id === updated.id ? updated : p)
        });
    };

    const handlePersonalityChange = (personality: AgentPersonality) => {
        if (!configAgent) return;

        const templates = PROMPT_TEMPLATES[personality];
        const populatedTemplates = templates.map(block => ({
            ...block,
            content: block.content.replace('{{AGENT_NAME}}', configAgent.name)
        }));

        setConfigAgent({
            ...configAgent,
            personality,
            systemPromptBlocks: populatedTemplates
        });
    };

    const updatePromptBlock = (id: string, field: 'title' | 'content', value: string) => {
        if (!configAgent) return;
        const blocks = configAgent.systemPromptBlocks || [];
        setConfigAgent({
            ...configAgent,
            systemPromptBlocks: blocks.map(b => b.id === id ? { ...b, [field]: value } : b)
        });
    };

    const handleExportCSV = (exportFilter: 'TOTAL' | 'POTENCIAL' | 'NO POTENCIAL') => {
        const leadsToExport = MOCK_LEADS.filter(lead => {
            const matchesStatus = exportFilter === 'TOTAL' ? true : lead.status === exportFilter;
            return matchesStatus;
        });

        if (leadsToExport.length === 0) {
            alert('No hay leads para exportar en esta categoría.');
            return;
        }

        // Get all unique custom keys from the filtered leads
        const customKeys = Array.from(new Set(leadsToExport.flatMap(l => Object.keys(l.custom_data || {}))));

        // Define headers
        const headers = ['Nombre', 'Email', 'Teléfono', 'Estado', 'Fecha', 'Resumen', 'Calificación', ...customKeys];

        // Generate rows
        const rows = leadsToExport.map(lead => {
            const rowData = [
                lead.name,
                lead.email,
                lead.phone,
                lead.status,
                new Date(lead.date).toLocaleDateString(),
                `"${lead.summary.replace(/"/g, '""')}"`, // Escape quotes for CSV
                lead.score,
                ...customKeys.map(key => `"${(lead.custom_data?.[key] || '').replace(/"/g, '""')}"`)
            ];
            return rowData.join(',');
        });

        // Combine logic
        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(',') + "\n"
            + rows.join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);

        const filterLabel = exportFilter.toLowerCase();

        link.setAttribute("download", `leads_${filterLabel}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    const enterAgentDashboard = (agent: Agent) => {
        setSelectedAgent(agent);
        setView('DASHBOARD');
    };

    const filteredData = useMemo(() => {
        return MOCK_LEADS.filter(lead => {
            const matchesFilter = filter === 'TOTAL' || lead.status === filter;
            const matchesSearch = !searchQuery ||
                lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.summary.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesFilter && matchesSearch;
        });
    }, [filter, searchQuery]);

    const totalPages = Math.max(1, Math.ceil(filteredData.length / itemsPerPage));
    const paginatedLeads = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        return filteredData.slice(startIndex, startIndex + itemsPerPage);
    }, [filteredData, currentPage, itemsPerPage]);

    const getStatusColor = (status: LeadStatus) => {
        switch (status) {
            case 'POTENCIAL': return 'bg-brand-mint/10 text-brand-mint border-brand-mint/20';
            case 'NO POTENCIAL': return 'bg-red-50 text-red-500 border-red-100';
            default: return '';
        }
    };

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

    const handleSearch = () => {
        const input = document.getElementById('leads-search') as HTMLInputElement;
        setSearchQuery(input?.value || '');
        setCurrentPage(1);
    };

    // --- Render View: Agent Gallery ---
    if (view === 'GALLERY') {
        return (
            <div className="max-w-[1200px] mx-auto py-10 animate-in fade-in duration-500">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Mis Agentes</h1>
                        <p className="text-gray-500 text-sm">Gestiona tus asistentes IA y sus integraciones.</p>
                    </div>
                    <button
                        onClick={() => setCreateModalOpen(true)}
                        className="btn-primary flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-xl shadow-brand-mint/20"
                    >
                        <Plus size={16} /> Crear Agente
                    </button>
                </div>

                {agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-32 bg-white rounded-3xl border border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-300 mb-4">
                            <Bot size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">Sin agentes configurados</h3>
                        <p className="text-gray-400 text-sm max-w-[280px] text-center mb-8">
                            Comienza creando tu primer agente para automatizar la captación de leads.
                        </p>
                        <button
                            onClick={() => setCreateModalOpen(true)}
                            className="text-brand-mint font-bold text-xs uppercase tracking-widest hover:underline flex items-center gap-2"
                        >
                            <Plus size={14} /> Iniciar Configuración
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map(agent => (
                            <div key={agent.id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-brand-mint/20 transition-all group overflow-hidden relative flex flex-col h-auto">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-brand-mint/5 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />

                                <div className="flex items-start justify-between mb-4 relative z-10">
                                    <div className="relative group/avatar">
                                        <div className="w-14 h-14 bg-brand-mint/10 rounded-2xl flex items-center justify-center text-brand-mint overflow-hidden relative">
                                            {agent.image ? (
                                                <img src={agent.image} alt={agent.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <Bot size={28} />
                                            )}
                                            {/* Edit Image Overlay */}
                                            <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                                                <Camera size={18} className="text-white" />
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleImageUpload(e, agent.id)}
                                                />
                                            </label>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        {/* Consumption Monitor */}
                                        <div
                                            onClick={() => setConsumptionDetail(agent)}
                                            className={cn(
                                                "relative flex flex-col items-center cursor-pointer group/usage bg-gray-50 p-1.5 rounded-2xl border transition-all shadow-sm",
                                                agent.tokenUsage >= 20 ? "border-brand-mint/50 hover:border-brand-mint" :
                                                    (agent.tokenUsage >= 10 ? "border-yellow-500/50 hover:border-yellow-500" : "border-red-500/50 hover:border-red-500")
                                            )}
                                        >
                                            <div className="relative w-8 h-8 flex items-center justify-center">
                                                <svg className="w-full h-full transform -rotate-90">
                                                    <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-gray-200" />
                                                    <circle
                                                        cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" fill="transparent"
                                                        strokeDasharray={81.68}
                                                        strokeDashoffset={81.68 - (agent.tokenUsage / 100) * 81.68}
                                                        className={cn(
                                                            "transition-all duration-1000",
                                                            agent.tokenUsage >= 20 ? "text-brand-mint drop-shadow-[0_0_3px_rgba(44,219,155,0.4)]" :
                                                                (agent.tokenUsage >= 10 ? "text-yellow-500" : "text-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]")
                                                        )}
                                                    />
                                                </svg>
                                                <span className="absolute text-[7px] font-black text-gray-700">{agent.tokenUsage}%</span>
                                            </div>
                                        </div>

                                        {/* Status Switch */}
                                        <div className="flex flex-col items-center gap-0.5">
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={agent.status === 'active'}
                                                    onChange={() => handleToggleStatus(agent.id)}
                                                />
                                                <div className="w-8 h-4.5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-brand-mint"></div>
                                            </label>
                                            <span className="text-[8px] font-bold uppercase tracking-tight text-gray-400 text-center inline-block">
                                                {agent.status === 'active' ? 'Activado' : 'Off'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mb-4 relative z-10 flex items-end justify-between">
                                    <div className="overflow-hidden">
                                        <h3 className="text-lg font-bold text-gray-900 mb-0.5 leading-none group-hover:text-brand-mint transition-colors truncate">{agent.name}</h3>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest truncate">{agent.specialty}</p>
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all -mr-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDuplicateAgent(agent); }}
                                            className="p-1.5 text-gray-300 hover:text-brand-mint hover:bg-brand-mint/5 rounded-full transition-all"
                                            title="Duplicar Agente"
                                        >
                                            <Copy size={16} />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDeleteAgent(agent.id); }}
                                            className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                            title="Eliminar Agente"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 relative z-10">
                                    <button
                                        onClick={() => { setConfigAgent(agent); setActiveConfigTab('ID'); }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-brand-mint/5 text-gray-500 hover:text-brand-mint transition-all border border-transparent hover:border-brand-mint/20"
                                    >
                                        <Settings2 size={16} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Configurar</span>
                                    </button>
                                    <button className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-brand-mint/5 text-gray-500 hover:text-brand-mint transition-all border border-transparent hover:border-brand-mint/20">
                                        <MessageSquare size={16} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">WhatsApp</span>
                                    </button>
                                    <button
                                        onClick={() => { setCatalogAgent(agent); setView('CATALOG'); }}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gray-50 hover:bg-brand-mint/5 text-gray-500 hover:text-brand-mint transition-all border border-transparent hover:border-brand-mint/20"
                                    >
                                        <Package size={16} />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">{nicheLabels.unit}</span>
                                    </button>
                                    <button
                                        onClick={() => enterAgentDashboard(agent)}
                                        className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-brand-primary-darker text-white shadow-lg shadow-black/10 hover:brightness-125 transition-all"
                                    >
                                        <LayoutDashboard size={16} className="text-brand-primary" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Panel Leads</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Create Agent Modal Overlay */}
                {isCreateModalOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" onClick={() => setCreateModalOpen(false)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white z-[210] shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8">
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">Nuevo Agente</h3>
                                <p className="text-gray-500 text-sm mb-6">Dale un nombre a tu asistente virtual.</p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Nombre</label>
                                        <input
                                            autoFocus
                                            type="text"
                                            value={newAgentName}
                                            onChange={(e) => setNewAgentName(e.target.value)}
                                            placeholder="Ej: Andres, Jorge, Maria"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white transition-all font-medium text-sm mb-4"
                                        />

                                        <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2 px-1">Función o Especialidad</label>
                                        <input
                                            type="text"
                                            value={newAgentSpecialty}
                                            onChange={(e) => setNewAgentSpecialty(e.target.value)}
                                            placeholder="Ej: Asistente de Capacitación"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 focus:bg-white transition-all font-medium text-sm"
                                            onKeyDown={(e) => e.key === 'Enter' && handleCreateAgent()}
                                        />
                                    </div>
                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setCreateModalOpen(false)}
                                            className="flex-1 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            onClick={handleCreateAgent}
                                            className="flex-1 btn-primary py-4 text-xs font-bold shadow-xl shadow-brand-mint/20"
                                        >
                                            Empezar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* Advanced Configuration Modal */}
                {configAgent && (
                    <>
                        <div className="fixed inset-0 bg-brand-primary-darker/40 backdrop-blur-md z-[300]" onClick={() => setConfigAgent(null)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl bg-white z-[310] shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                            {/* Modal Header */}
                            <div className="p-8 pb-4 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-brand-mint rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-mint/20">
                                        <Settings2 size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-900 leading-none mb-1">Configuración Avanzada</h2>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Personaliza a {configAgent.name}</p>
                                    </div>
                                </div>
                                <button onClick={() => setConfigAgent(null)} className="p-3 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                                    <X size={24} />
                                </button>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="px-8 border-b border-gray-100 flex gap-8 justify-center">
                                {[
                                    { id: 'ID', label: '1. Identidad', icon: Bot },
                                    { id: 'BEH', label: '2. Comportamiento', icon: Sparkles },
                                    { id: 'KB', label: '3. Base de Conocimiento', icon: FileText },
                                ].map(tab => {
                                    // Validation Logic
                                    let isComplete = true;
                                    if (tab.id === 'ID') {
                                        isComplete = !!configAgent.name.trim() && !!configAgent.specialty.trim();
                                    } else if (tab.id === 'BEH') {
                                        isComplete = !!configAgent.systemPromptBlocks && configAgent.systemPromptBlocks.length > 0;
                                    }

                                    return (
                                        // @ts-expect-error
                                        <button
                                            key={tab.id}
                                            onClick={() => {
                                                setActiveConfigTab(tab.id as any);
                                                // Auto-populate blocks if empty when switching to Behavior tab
                                                if (tab.id === 'BEH' && configAgent && (!configAgent.systemPromptBlocks || configAgent.systemPromptBlocks.length === 0)) {
                                                    const templates = PROMPT_TEMPLATES[configAgent.personality];
                                                    const populatedTemplates = templates.map(block => ({
                                                        ...block,
                                                        content: block.content.replace('{{AGENT_NAME}}', configAgent.name)
                                                    }));

                                                    setConfigAgent({
                                                        ...configAgent,
                                                        systemPromptBlocks: populatedTemplates
                                                    });
                                                }
                                            }}
                                            className={cn("pb-4 text-[11px] font-bold uppercase tracking-widest transition-all relative flex items-center gap-2", activeConfigTab === tab.id ? "text-brand-mint" : "text-gray-400 hover:text-gray-600")}
                                        >
                                            <tab.icon size={14} />
                                            {tab.label}
                                            {!isComplete && (
                                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse ml-1" title="Configuración incompleta" />
                                            )}
                                            {activeConfigTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-1 bg-brand-mint rounded-t-full" />}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Tab Content */}
                            <div className="overflow-y-auto p-8 custom-scrollbar h-[550px] max-h-[550px]">
                                {activeConfigTab === 'ID' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {/* Section 1: Name & Specialty */}
                                        <div className="p-6 bg-gray-100/40 border border-gray-100 rounded-2xl space-y-4 group/section transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-mint/10 flex items-center justify-center text-xs font-bold text-brand-mint">1</div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Identificación del Agente</h3>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight px-1 block">Nombre Visible</label>
                                                    <input
                                                        type="text"
                                                        value={configAgent.name}
                                                        onChange={(e) => setConfigAgent({ ...configAgent, name: e.target.value })}
                                                        className="w-full bg-white border border-gray-100 rounded-lg py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-mint/20 focus:bg-white transition-all font-medium text-xs shadow-sm"
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-tight px-1 block">Especialidad / Rol</label>
                                                    <input
                                                        type="text"
                                                        value={configAgent.specialty}
                                                        onChange={(e) => setConfigAgent({ ...configAgent, specialty: e.target.value })}
                                                        className="w-full bg-white border border-gray-100 rounded-lg py-2 px-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-mint/20 focus:bg-white transition-all font-medium text-xs shadow-sm"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 2: Personality/Purpose */}
                                        <div className="p-6 bg-gray-100/40 border border-gray-100 rounded-2xl space-y-4 group/section transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-mint/10 flex items-center justify-center text-xs font-bold text-brand-mint">2</div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">¿Para qué se usará este agente?</h3>
                                            </div>
                                            <div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
                                                    {[
                                                        { id: 'VENDER', label: 'Venta de Productos', icon: TrendingUp, desc: 'Enfocado en conversión.' },
                                                        { id: 'AGENDAR', label: 'Agendar Citas', icon: Calendar, desc: 'Coordinación de agendas.' },
                                                        { id: 'SOPORTE', label: 'Soporte Técnico', icon: Headphones, desc: 'Resolución de dudas.' },
                                                        { id: 'COBRAR', label: 'Gestión de Cobros', icon: Activity, desc: 'Recordatorios de pago.' },
                                                        { id: 'CALIFICAR', label: 'Calificación Leads', icon: UserCheck, desc: 'Filtro de prospectos.' },
                                                        { id: 'GENERAL', label: 'Asistente General', icon: Sparkles, desc: 'Atención multiuso.' },
                                                    ].map(type => {
                                                        const isSelected = configAgent.personality === type.id;
                                                        const showCheck = originalPersonality === type.id;

                                                        // Background & Border classes based on selection state
                                                        let containerClasses = "bg-white border-gray-100 hover:border-gray-200";
                                                        let iconContainerClasses = "bg-gray-50 text-gray-400 group-hover:bg-gray-100";
                                                        let titleClasses = "text-gray-900";
                                                        let descClasses = "text-gray-400";

                                                        if (isSelected) {
                                                            containerClasses = "bg-brand-mint/10 border-brand-mint shadow-sm";
                                                            iconContainerClasses = "bg-brand-mint text-white";
                                                            titleClasses = "text-gray-900";
                                                            descClasses = "text-gray-500";
                                                        }

                                                        return (
                                                            <button
                                                                key={type.id}
                                                                onClick={(e) => {
                                                                    e.preventDefault();
                                                                    if (configAgent.personality !== type.id) {
                                                                        handlePersonalityChange(type.id as AgentPersonality);
                                                                    }
                                                                }}
                                                                className={cn(
                                                                    "group p-3 rounded-lg border text-left transition-all flex items-start gap-2.5 outline-none relative",
                                                                    containerClasses
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "w-7 h-7 rounded-lg flex-shrink-0 flex items-center justify-center transition-all",
                                                                    iconContainerClasses
                                                                )}>
                                                                    <type.icon size={14} />
                                                                </div>
                                                                <div className="overflow-hidden pr-4">
                                                                    <p className={cn("text-[10px] font-bold leading-tight", titleClasses)}>{type.label}</p>
                                                                    <p className={cn("text-[8px] font-medium truncate", descClasses)}>{type.desc}</p>
                                                                </div>
                                                                {showCheck && (
                                                                    <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-brand-mint rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                                                                        <Check size={9} className="text-white" strokeWidth={4} />
                                                                    </div>
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Section 3: Channel */}
                                        <div className="p-6 bg-gray-100/40 border border-gray-100 rounded-2xl space-y-4 group/section transition-all shadow-sm">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-brand-mint/10 flex items-center justify-center text-xs font-bold text-brand-mint">3</div>
                                                <h3 className="text-sm font-bold uppercase tracking-widest text-gray-900">Canal y comunicación</h3>
                                            </div>
                                            <div>
                                                <div className="flex gap-3">
                                                    <button
                                                        onClick={() => setConfigAgent({ ...configAgent, channel: 'TEXT' })}
                                                        className={cn(
                                                            "flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all group relative",
                                                            configAgent.channel === 'TEXT'
                                                                ? "bg-brand-mint/5 border-brand-mint/50 shadow-sm"
                                                                : "bg-white border-gray-100 hover:border-gray-200"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                            configAgent.channel === 'TEXT'
                                                                ? "bg-brand-mint text-white"
                                                                : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                                                        )}>
                                                            <MessageSquareText size={16} />
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className={cn("text-[10px] font-bold leading-tight", configAgent.channel === 'TEXT' ? "text-gray-900" : "text-gray-700")}>Solo Texto/Chat</p>
                                                            <p className="text-[9px] opacity-60">Mensajes escritos y reconoce audios</p>
                                                        </div>
                                                        {originalChannel === 'TEXT' && (
                                                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-brand-mint rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                                                                <Check size={9} className="text-white" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfigAgent({ ...configAgent, channel: 'AUDIO' })}
                                                        className={cn(
                                                            "flex-1 flex items-center gap-3 p-3 rounded-lg border transition-all group relative",
                                                            configAgent.channel === 'AUDIO'
                                                                ? "bg-brand-mint/5 border-brand-mint/50 shadow-sm"
                                                                : "bg-white border-gray-100 hover:border-gray-200"
                                                        )}
                                                    >
                                                        <div className={cn(
                                                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all",
                                                            configAgent.channel === 'AUDIO'
                                                                ? "bg-brand-mint text-white"
                                                                : "bg-gray-50 text-gray-400 group-hover:bg-gray-100"
                                                        )}>
                                                            <Headphones size={16} />
                                                        </div>
                                                        <div className="text-left flex-1">
                                                            <p className={cn("text-[10px] font-bold leading-tight", configAgent.channel === 'AUDIO' ? "text-gray-900" : "text-gray-700")}>Solo Llamada/Voz</p>
                                                            <p className="text-[9px] opacity-70">Llamadas</p>
                                                        </div>
                                                        {originalChannel === 'AUDIO' && (
                                                            <div className="absolute top-2 right-2 w-3.5 h-3.5 bg-brand-mint rounded-full flex items-center justify-center shadow-sm animate-in zoom-in duration-200">
                                                                <Check size={9} className="text-white" strokeWidth={4} />
                                                            </div>
                                                        )}
                                                    </button>
                                                </div>

                                                {configAgent.channel === 'AUDIO' && (
                                                    <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-4 mt-4 border-t border-gray-200/50">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-[10px] font-bold text-brand-mint uppercase tracking-widest">Selector de Voz</h4>
                                                        </div>

                                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                                            {[
                                                                { id: 'adam', name: 'Adam', style: 'Varonil' },
                                                                { id: 'bella', name: 'Bella', style: 'Femenina' },
                                                                { id: 'charlie', name: 'Charlie', style: 'Natural' },
                                                                { id: 'dorothy', name: 'Dorothy', style: 'Madura' },
                                                                { id: 'emily', name: 'Emily', style: 'Cercana' },
                                                                { id: 'fin', name: 'Fin', style: 'Juvenil' },
                                                                { id: 'giovanni', name: 'Giovanni', style: 'Italiano' },
                                                                { id: 'harry', name: 'Harry', style: 'Sereno' },
                                                                { id: 'isabella', name: 'Isabella', style: 'Dulce' },
                                                                { id: 'james', name: 'James', style: 'Formal' },
                                                                { id: 'kyle', name: 'Kyle', style: 'Enérgico' },
                                                                { id: 'lily', name: 'Lily', style: 'Suave' },
                                                                { id: 'marcus', name: 'Marcus', style: 'Profundo' },
                                                                { id: 'nora', name: 'Nora', style: 'Confiable' },
                                                                { id: 'oscar', name: 'Oscar', style: 'Amistoso' },
                                                                { id: 'penelope', name: 'Penélope', style: 'Elegante' },
                                                                { id: 'quinn', name: 'Quinn', style: 'Neutral' },
                                                                { id: 'riley', name: 'Riley', style: 'Dinámico' },
                                                                { id: 'sophia', name: 'Sophia', style: 'Profesional' },
                                                                { id: 'thomas', name: 'Thomas', style: 'Clave' }
                                                            ].map(voice => (
                                                                <button
                                                                    key={voice.id}
                                                                    onClick={() => setConfigAgent({
                                                                        ...configAgent,
                                                                        voiceConfig: { ...(configAgent.voiceConfig || { stability: 0.5, similarityBoost: 0.75 }), voiceId: voice.id }
                                                                    })}
                                                                    className={cn(
                                                                        "flex flex-col p-2.5 rounded-lg border transition-all relative group/voice",
                                                                        configAgent.voiceConfig?.voiceId === voice.id ? "bg-white border-brand-mint shadow-sm" : "bg-white/40 border-transparent hover:border-gray-200"
                                                                    )}
                                                                >
                                                                    <div className="flex items-center gap-2 mb-2">
                                                                        <div className={cn(
                                                                            "w-5 h-5 rounded flex items-center justify-center transition-all",
                                                                            configAgent.voiceConfig?.voiceId === voice.id ? "bg-brand-mint text-white" : "bg-gray-200 text-gray-500"
                                                                        )}>
                                                                            <Volume2 size={10} />
                                                                        </div>
                                                                        <div className="text-left overflow-hidden flex-1">
                                                                            <p className="text-[9px] font-bold text-gray-900 truncate">{voice.name}</p>
                                                                            <p className="text-[7px] text-gray-500 truncate">{voice.style}</p>
                                                                        </div>
                                                                        {originalVoiceId === voice.id && (
                                                                            <div className="w-3.5 h-3.5 bg-brand-mint rounded-full flex items-center justify-center shadow-sm absolute top-2 right-2">
                                                                                <Check size={9} className="text-white" strokeWidth={4} />
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    {/* Progress Bar for voice test */}
                                                                    <div className="w-full flex items-center gap-2">
                                                                        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                                            <div className={cn("h-full bg-brand-mint transition-all duration-1000", configAgent.voiceConfig?.voiceId === voice.id ? "w-[40%]" : "w-0")} />
                                                                        </div>
                                                                        <span className="text-[7px] font-bold text-gray-400">0:03</span>
                                                                        <Play size={8} className={cn("transition-colors", configAgent.voiceConfig?.voiceId === voice.id ? "text-brand-mint" : "text-gray-300")} fill="currentColor" />
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeConfigTab === 'BEH' && (
                                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        <div className="flex items-center justify-between mb-4">
                                            <div>
                                                <h3 className="text-lg font-bold" style={{ color: '#2CDB9B' }}>Comportamiento (System Prompt)</h3>
                                                <p className="text-xs text-gray-400">Configura el cerebro de tu agente mediante bloques detallados.</p>
                                            </div>
                                            <button
                                                onClick={() => setConfigAgent({
                                                    ...configAgent,
                                                    systemPromptBlocks: [...(configAgent.systemPromptBlocks || []), { id: String(Date.now()), title: 'Nuevo Bloque', content: '' }]
                                                })}
                                                className="flex items-center gap-2 text-brand-mint font-black text-[10px] uppercase tracking-widest hover:bg-brand-mint/10 px-4 py-2 rounded-xl transition-all"
                                            >
                                                <Plus size={14} /> Añadir Bloque
                                            </button>
                                        </div>

                                        <div className="space-y-4">
                                            {(configAgent.systemPromptBlocks || []).map((block, idx) => (
                                                <div key={block.id} className="p-6 bg-gray-100/40 border border-gray-100 rounded-2xl space-y-4 group/block transition-all shadow-sm">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded-lg bg-brand-mint/10 flex items-center justify-center text-brand-mint text-[10px] font-black">
                                                                {idx + 1}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-[10px] font-black text-brand-mint uppercase tracking-widest leading-none mb-1">Característica</span>
                                                                <input
                                                                    type="text"
                                                                    value={block.title}
                                                                    onChange={(e) => updatePromptBlock(block.id, 'title', e.target.value)}
                                                                    className="bg-transparent border-none p-0 text-sm font-bold text-gray-900 focus:ring-0 w-64 placeholder-gray-300"
                                                                    placeholder="Título del bloque..."
                                                                />
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => setConfirmModal({
                                                                isOpen: true,
                                                                title: 'Eliminar Bloque',
                                                                message: '¿Estás seguro de que deseas eliminar esta sección del prompt?',
                                                                type: 'danger',
                                                                onConfirm: () => {
                                                                    setConfigAgent({
                                                                        ...configAgent,
                                                                        systemPromptBlocks: (configAgent.systemPromptBlocks || []).filter(b => b.id !== block.id)
                                                                    });
                                                                    setConfirmModal(prev => ({ ...prev, isOpen: false }));
                                                                }
                                                            })}
                                                            className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover/block:opacity-100 transition-all"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                    <textarea
                                                        value={block.content}
                                                        onChange={(e) => updatePromptBlock(block.id, 'content', e.target.value)}
                                                        rows={Math.max(3, Math.ceil(block.content.length / 80))}
                                                        className="w-full bg-white border border-gray-100 rounded-2xl py-4 px-6 text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-mint/30 transition-all text-[13px] leading-relaxed resize-none placeholder-gray-300 shadow-sm"
                                                        placeholder="Instrucciones detalladas para este bloque..."
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeConfigTab === 'KB' && (
                                    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 overflow-y-auto max-h-full">
                                        {/* Knowledge Base Section */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-brand-mint/10 rounded-xl flex items-center justify-center text-brand-mint">
                                                        <FileText size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-gray-900 leading-none mb-1">Documentos de Entrenamiento</h3>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Sube PDFs para dar contexto al agente</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => {
                                                        const newFile: KBFile = {
                                                            id: String(Date.now()),
                                                            name: 'documento_entrenamiento.pdf',
                                                            type: 'application/pdf',
                                                            size: '1.2 MB',
                                                            uploadedAt: new Date().toISOString()
                                                        };
                                                        setConfigAgent({
                                                            ...configAgent!,
                                                            knowledgeBase: [...(configAgent!.knowledgeBase || []), newFile]
                                                        });
                                                    }}
                                                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary-darker text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-125 transition-all shadow-lg shadow-black/5"
                                                >
                                                    <Upload size={14} /> Subir PDF
                                                </button>
                                            </div>

                                            {(!configAgent.knowledgeBase || configAgent.knowledgeBase.length === 0) ? (
                                                <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-gray-100 rounded-2xl bg-gray-50/30">
                                                    <Info size={24} className="text-gray-300 mb-2" />
                                                    <p className="text-xs text-gray-400 font-medium text-center max-w-[200px]">No hay documentos cargados. El agente usará su conocimiento base.</p>
                                                </div>
                                            ) : (
                                                <div className="grid grid-cols-1 gap-3">
                                                    {configAgent.knowledgeBase.map(file => (
                                                        <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50/50 rounded-xl border border-gray-100 group">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center text-red-500">
                                                                    <FileText size={16} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-xs font-bold text-gray-700">{file.name}</p>
                                                                    <p className="text-[10px] text-gray-400 uppercase tracking-tighter font-black">{file.size} • {new Date(file.uploadedAt).toLocaleDateString()}</p>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setConfigAgent({
                                                                    ...configAgent!,
                                                                    knowledgeBase: configAgent!.knowledgeBase?.filter(f => f.id !== file.id)
                                                                })}
                                                                className="p-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        {/* Product Catalog Section */}
                                        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-500">
                                                        <Package size={20} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-bold text-gray-900 leading-none mb-1">Catálogo de Productos</h3>
                                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Base de datos de productos y servicios</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => { setCatalogAgent(configAgent); setView('CATALOG'); setConfigAgent(null); }}
                                                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-mint text-white rounded-xl text-[10px] font-bold uppercase tracking-widest hover:brightness-110 transition-all shadow-lg shadow-brand-mint/20"
                                                >
                                                    <Plus size={14} /> Gestionar Catálogo
                                                </button>
                                            </div>

                                            <div className="flex items-start gap-4 p-4 bg-orange-50/30 rounded-2xl border border-orange-100">
                                                <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center text-orange-500 shrink-0">
                                                    <Sparkles size={16} />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-orange-700 mb-1">Optimización Automática</p>
                                                    <p className="text-[10px] text-orange-600/70 leading-relaxed font-medium">
                                                        Los productos agregados aquí serán usados por la IA para ofrecer recomendaciones precisas, precios actualizados y disponibilidad en tiempo real durante sus conversaciones.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex justify-end gap-3">
                                <button
                                    onClick={() => setConfigAgent(null)}
                                    className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateConfig}
                                    className={cn(
                                        "px-10 py-4 text-xs font-bold shadow-xl transition-all rounded-2xl text-white outline-none",
                                        hasUnsavedChanges
                                            ? "bg-[#f97316] shadow-[#f97316]/20 hover:brightness-110"
                                            : "bg-[#0d1b1a] shadow-[#0d1b1a]/20 hover:brightness-125"
                                    )}
                                    style={{ backgroundColor: hasUnsavedChanges ? '#f97316' : '#0d1b1a' }}
                                >
                                    Guardar Cambios
                                </button>
                            </div>
                        </div>
                    </>
                )}

                {/* Custom Confirmation Modal */}
                {confirmModal.isOpen && (
                    <>
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[500]" onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm bg-white z-[510] shadow-2xl rounded-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            <div className="p-8 text-center">
                                <div className={cn(
                                    "w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-6",
                                    confirmModal.type === 'danger' ? "bg-red-50 text-red-500" :
                                        (confirmModal.type === 'success' ? "bg-brand-mint/10 text-brand-mint" : "bg-brand-accent/10 text-brand-accent")
                                )}>
                                    {confirmModal.type === 'danger' ? <Trash2 size={32} /> :
                                        (confirmModal.type === 'success' ? <Check size={32} /> : <AlertTriangle size={32} />)}
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmModal.title}</h3>
                                <p className="text-sm text-gray-500 leading-relaxed mb-8">{confirmModal.message}</p>

                                <div className="flex flex-col gap-2">
                                    <button
                                        onClick={confirmModal.onConfirm}
                                        className={cn(
                                            "w-full py-4 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all text-white",
                                            confirmModal.type === 'danger' ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20" :
                                                confirmModal.type === 'warning' ? "bg-[#f97316] hover:brightness-110 shadow-lg shadow-[#f97316]/20" :
                                                    "bg-brand-primary-darker hover:bg-black"
                                        )}
                                        style={confirmModal.type === 'warning' ? { backgroundColor: '#f97316' } : {}}
                                    >
                                        {confirmModal.type === 'success' ? 'Entendido' : 'Confirmar'}
                                    </button>
                                    {confirmModal.type !== 'success' && (
                                        <button
                                            onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                                            className="w-full py-4 text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
                {/* Consumption Detail Modal */}
                {consumptionDetail && (
                    <>
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" onClick={() => setConsumptionDetail(null)} />
                        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white z-[210] shadow-2xl rounded-3xl overflow-hidden animate-in zoom-in-95 duration-200">
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-mint/10 rounded-xl flex items-center justify-center text-brand-mint">
                                            <Activity size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Consumo de Tokens</h3>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{consumptionDetail.name}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setConsumptionDetail(null)} className="p-2 text-gray-400 hover:text-red-500 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="flex justify-between items-end mb-4">
                                            <div>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Capacidad Utilizada</p>
                                                <p className="text-3xl font-bold text-gray-900">{consumptionDetail.tokenUsage}%</p>
                                            </div>
                                            <p className="text-[11px] text-gray-500 font-medium">12.4k / 50k tokens</p>
                                        </div>
                                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full transition-all duration-1000", consumptionDetail.tokenUsage > 80 ? "bg-red-500" : (consumptionDetail.tokenUsage > 50 ? "bg-yellow-500" : "bg-brand-mint"))}
                                                style={{ width: `${consumptionDetail.tokenUsage}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 border border-gray-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tokens Entrada</p>
                                            <p className="text-lg font-bold text-gray-900 leading-none">8.2k</p>
                                        </div>
                                        <div className="p-4 border border-gray-100 rounded-2xl">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Tokens Salida</p>
                                            <p className="text-lg font-bold text-gray-900 leading-none">4.2k</p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-3 p-4 bg-brand-mint/5 rounded-2xl border border-brand-mint/10">
                                        <Info size={16} className="text-brand-mint shrink-0 mt-0.5" />
                                        <p className="text-[11px] text-gray-600 leading-relaxed">
                                            Este agente tiene un consumo moderado. Los tokens se reinician el primer día de cada mes según tu plan contratado.
                                        </p>
                                    </div>

                                    <button className="w-full btn-primary py-4 text-xs font-bold shadow-xl shadow-brand-mint/20 mt-4">
                                        Recargar Créditos
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        );
    }

    if (view === 'CATALOG' && catalogAgent) {
        return (
            <div className="flex-1 h-screen flex flex-col bg-white overflow-hidden animate-in fade-in duration-500">
                {/* Header */}
                <div className="p-8 bg-white border-b border-gray-100 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => setView('GALLERY')}
                            className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 hover:text-brand-mint transition-all border border-gray-100"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="w-16 h-16 bg-brand-mint rounded-[24px] flex items-center justify-center text-white shadow-2xl shadow-brand-mint/30">
                            <Package size={32} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900 leading-none mb-1">Catálogo de Productos</h2>
                            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-[0.2em]">Agente: {catalogAgent.name}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={addProduct}
                            className="btn-primary flex items-center gap-2 px-8 py-3.5 text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-brand-mint/20"
                        >
                            <Plus size={16} /> Nuevo Producto
                        </button>
                        <button onClick={handleSaveCatalog} className="btn-secondary px-10 py-3.5 text-[10px] font-black uppercase tracking-widest bg-brand-primary-darker text-white border-none hover:brightness-125 transition-all">
                            Guardar y Salir
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Product List Sidebar (Menu Style) */}
                    <div className="w-96 bg-gray-50/50 border-r border-gray-100 flex flex-col">
                        <div className="p-6">
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                                <input
                                    type="text"
                                    placeholder="Buscar en el catálogo..."
                                    value={catalogSearch}
                                    onChange={(e) => setCatalogSearch(e.target.value)}
                                    className="w-full bg-white border border-gray-100 focus:border-brand-mint/40 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-gray-700 outline-none transition-all shadow-sm"
                                />
                            </div>
                            <div className="mt-4 flex flex-wrap gap-2">
                                {categories.map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCatalogCategoryFilter(cat)}
                                        className={cn(
                                            "px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all",
                                            catalogCategoryFilter === cat
                                                ? "bg-brand-mint text-white shadow-lg shadow-brand-mint/20"
                                                : "bg-white text-gray-400 hover:text-gray-600 border border-gray-100"
                                        )}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto px-6 pb-6 space-y-3">
                            {filteredCatalog.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 opacity-30">
                                    <Package size={48} className="text-gray-200 mb-4" />
                                    <p className="text-[10px] font-black uppercase tracking-widest text-center">No se encontraron productos <br /> con estos filtros</p>
                                </div>
                            ) : (
                                filteredCatalog.map(product => (
                                    <div
                                        key={product.id}
                                        onClick={() => setEditingProduct(product)}
                                        className={cn(
                                            "p-4 rounded-[24px] border transition-all cursor-pointer group flex items-center gap-4",
                                            editingProduct?.id === product.id
                                                ? "bg-white border-brand-mint shadow-xl shadow-brand-mint/10 ring-1 ring-brand-mint/20"
                                                : "bg-white border-transparent hover:border-brand-mint/20 hover:shadow-md"
                                        )}
                                    >
                                        <div className="w-14 h-14 bg-gray-50 rounded-[18px] border border-gray-100 overflow-hidden flex items-center justify-center shrink-0">
                                            {product.images?.[0] ? (
                                                <img src={product.images[0]} className="w-full h-full object-cover" />
                                            ) : (
                                                <Package size={20} className="text-gray-200" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-900 truncate mb-1">{product.name}</h4>
                                            <div className="flex items-center justify-between">
                                                <span className="text-[11px] font-black text-brand-mint">S/ {product.price}</span>
                                                <span className={cn(
                                                    "text-[8px] font-black px-2 py-0.5 rounded-full",
                                                    product.availability === 'DISPONIBLE' ? "bg-green-100 text-green-600" :
                                                        product.availability === 'AGOTADO' ? "bg-red-100 text-red-600" : "bg-orange-100 text-orange-600"
                                                )}>
                                                    {product.availability}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 overflow-y-auto bg-white p-10 custom-scrollbar">
                        {editingProduct ? (
                            <div className="max-w-4xl mx-auto animate-in slide-in-from-right-8 duration-500 pb-20">
                                <div className="flex items-center justify-between mb-10 pb-6 border-b border-gray-50">
                                    <div className="flex items-center gap-4">
                                        <div className="w-2 h-10 bg-brand-mint rounded-full" />
                                        <h3 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">Editando: {editingProduct.name}</h3>
                                    </div>
                                    <button
                                        onClick={() => deleteProduct(editingProduct.id)}
                                        className="flex items-center gap-2 px-6 py-3 text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-red-100"
                                    >
                                        <Trash2 size={16} /> Eliminar Producto
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-10">
                                    {/* Image Management (Max 4) */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Galería de Imágenes (Máx. 4)</h4>
                                            <span className="text-[10px] font-bold text-brand-mint bg-brand-mint/5 px-2 py-1 rounded-lg">{editingProduct.images.length}/4</span>
                                        </div>
                                        <div className="grid grid-cols-4 gap-4">
                                            {editingProduct.images.map((img, idx) => (
                                                <div key={idx} className="relative group aspect-square bg-gray-50 rounded-[28px] overflow-hidden border border-gray-100 shadow-sm">
                                                    <img src={img} className="w-full h-full object-cover" />
                                                    <button
                                                        onClick={() => {
                                                            const newImgs = [...editingProduct.images];
                                                            newImgs.splice(idx, 1);
                                                            updateProduct({ ...editingProduct, images: newImgs });
                                                            setEditingProduct({ ...editingProduct, images: newImgs });
                                                        }}
                                                        className="absolute top-3 right-3 w-8 h-8 bg-black/60 backdrop-blur-md rounded-xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 shadow-lg"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {editingProduct.images.length < 4 && (
                                                <label className="aspect-square bg-gray-50/50 rounded-[28px] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center text-gray-400 hover:border-brand-mint/40 hover:bg-brand-mint/5 cursor-pointer transition-all gap-2 group">
                                                    <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                                                        <Camera size={20} />
                                                    </div>
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Añadir Foto</span>
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            const file = e.target.files?.[0];
                                                            if (file) {
                                                                const reader = new FileReader();
                                                                reader.onloadend = () => {
                                                                    const newImgs = [...editingProduct.images, reader.result as string];
                                                                    updateProduct({ ...editingProduct, images: newImgs });
                                                                    setEditingProduct({ ...editingProduct, images: newImgs });
                                                                };
                                                                reader.readAsDataURL(file);
                                                            }
                                                        }}
                                                    />
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {/* Main Fields */}
                                    <div className="grid grid-cols-2 gap-8 bg-gray-50/30 p-10 rounded-[40px] border border-gray-100">
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1">
                                                    Nombre del Producto <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={editingProduct.name}
                                                    onChange={(e) => {
                                                        const newVal = e.target.value;
                                                        setEditingProduct({ ...editingProduct, name: newVal });
                                                        updateProduct({ ...editingProduct, name: newVal });
                                                    }}
                                                    className="w-full bg-white border border-gray-100 focus:border-brand-mint/40 rounded-2xl py-4 px-6 text-sm font-bold text-gray-700 outline-none transition-all shadow-sm"
                                                    placeholder="Ej: Licencia Tipo L"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1">
                                                        Precio <span className="text-red-500">*</span>
                                                    </label>
                                                    <div className="relative">
                                                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold">$</span>
                                                        <input
                                                            type="text"
                                                            value={editingProduct.price}
                                                            onChange={(e) => {
                                                                const newVal = e.target.value;
                                                                setEditingProduct({ ...editingProduct, price: newVal });
                                                                updateProduct({ ...editingProduct, price: newVal });
                                                            }}
                                                            className="w-full bg-white border border-gray-100 focus:border-brand-mint/40 rounded-2xl py-4 pl-12 pr-6 text-sm font-bold text-gray-700 outline-none transition-all shadow-sm"
                                                            placeholder="0.00"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1">
                                                        Estado <span className="text-red-500">*</span>
                                                    </label>
                                                    <select
                                                        value={editingProduct.availability}
                                                        onChange={(e) => {
                                                            const availability = e.target.value as Product['availability'];
                                                            setEditingProduct({ ...editingProduct, availability });
                                                            updateProduct({ ...editingProduct, availability });
                                                        }}
                                                        className="w-full bg-white border border-gray-100 focus:border-brand-mint/40 rounded-2xl py-4 px-6 text-sm font-bold text-gray-700 outline-none transition-all shadow-sm appearance-none cursor-pointer"
                                                    >
                                                        <option value="DISPONIBLE">DISPONIBLE</option>
                                                        <option value="AGOTADO">AGOTADO</option>
                                                        <option value="BAJO PEDIDO">BAJO PEDIDO</option>
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1">
                                                    Categoría <span className="text-red-500">*</span>
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        list="catalog-categories"
                                                        value={editingProduct.category}
                                                        onChange={(e) => {
                                                            const category = e.target.value;
                                                            setEditingProduct({ ...editingProduct, category });
                                                            updateProduct({ ...editingProduct, category });
                                                        }}
                                                        className="w-full bg-white border border-gray-100 focus:border-brand-mint/40 rounded-2xl py-4 px-6 text-sm font-bold text-gray-700 outline-none transition-all shadow-sm"
                                                        placeholder="Ej: Odontología, Estética..."
                                                    />
                                                    <datalist id="catalog-categories">
                                                        {categories.filter(c => c !== 'Todos').map(c => (
                                                            <option key={c} value={c} />
                                                        ))}
                                                    </datalist>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-2 flex items-center gap-1">
                                                Descripción General <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={editingProduct.description}
                                                onChange={(e) => {
                                                    const newVal = e.target.value;
                                                    setEditingProduct({ ...editingProduct, description: newVal });
                                                    updateProduct({ ...editingProduct, description: newVal });
                                                }}
                                                rows={5}
                                                className="w-full bg-white border border-gray-100 focus:border-brand-mint/40 rounded-3xl py-4 px-6 text-[13px] font-medium text-gray-600 outline-none transition-all shadow-sm leading-relaxed resize-none h-full"
                                                placeholder="Describe las características principales..."
                                            />
                                        </div>
                                    </div>

                                    {/* Dynamic Fields */}
                                    <div className="space-y-6">
                                        <div className="flex items-center justify-between px-2">
                                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Información Adicional (Campos Dinámicos)</h4>
                                            <button
                                                onClick={addAttribute}
                                                className="flex items-center gap-2 text-brand-mint text-[9px] font-black uppercase tracking-widest hover:underline bg-brand-mint/5 px-3 py-1.5 rounded-full transition-all"
                                            >
                                                <Plus size={12} /> Añadir otro campo
                                            </button>
                                        </div>
                                        <div className="grid grid-cols-1 gap-4">
                                            {editingProduct.attributes.map(attr => (
                                                <div key={attr.id} className="flex gap-4 animate-in slide-in-from-left-4 duration-300">
                                                    <input
                                                        type="text"
                                                        value={attr.label}
                                                        onChange={(e) => {
                                                            const newAttrs = editingProduct.attributes.map(a => a.id === attr.id ? { ...a, label: e.target.value } : a);
                                                            setEditingProduct({ ...editingProduct, attributes: newAttrs });
                                                            updateProduct({ ...editingProduct, attributes: newAttrs });
                                                        }}
                                                        className="w-1/3 bg-gray-50 border border-gray-100 focus:border-brand-mint/40 rounded-2xl py-3 px-6 text-xs font-bold text-gray-500 outline-none transition-all"
                                                        placeholder="Nombre del Campo"
                                                    />
                                                    <div className="flex-1 relative">
                                                        <input
                                                            type="text"
                                                            value={attr.value}
                                                            onChange={(e) => {
                                                                const newAttrs = editingProduct.attributes.map(a => a.id === attr.id ? { ...a, value: e.target.value } : a);
                                                                setEditingProduct({ ...editingProduct, attributes: newAttrs });
                                                                updateProduct({ ...editingProduct, attributes: newAttrs });
                                                            }}
                                                            className="w-full bg-white border border-gray-100 focus:border-brand-mint/40 rounded-2xl py-3 px-6 text-xs font-bold text-gray-700 outline-none transition-all shadow-sm"
                                                            placeholder="Valor o Descripción..."
                                                        />
                                                        <button
                                                            onClick={() => removeAttribute(attr.id)}
                                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-red-500 p-2"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center py-20">
                                <div className="w-32 h-32 bg-gray-50 rounded-[40px] flex items-center justify-center text-gray-200 mb-8 animate-pulse">
                                    <Package size={64} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-300 uppercase tracking-tighter italic">Selecciona un producto</h3>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">Menú para editar detalles o fotos</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }


    // --- Render View: Agent DASHBOARD (Leads Table) ---
    return (
        <div className="pt-0 px-8 pb-8 max-w-[1600px] mx-auto space-y-3 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 mb-0.5">
                        <button
                            onClick={() => setView('GALLERY')}
                            className="text-[10px] font-bold text-brand-mint uppercase tracking-widest hover:underline flex items-center gap-1"
                        >
                            <ChevronLeft size={10} /> Volver a Agentes
                        </button>
                        <span className="text-gray-300 px-1">•</span>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{selectedAgent?.name}</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Panel de Control de Leads</h1>
                    <p className="text-gray-500 text-[13px] max-w-md leading-relaxed">
                        Visualiza los prospectos captados específicamente por este agente.
                    </p>
                </div>
                <div className="flex items-center gap-3 pb-1 relative">
                    <div className="relative">
                        <button
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="btn-secondary flex items-center gap-2 px-5 py-2 text-xs font-bold border-gray-200"
                        >
                            <Download size={14} /> Exportar CSV <ChevronDown size={12} className="ml-1 opacity-50" />
                        </button>

                        {showExportMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowExportMenu(false)} />
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-40 p-2 animate-in fade-in zoom-in-95 duration-200">
                                    <button onClick={() => { handleExportCSV('TOTAL'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                                        <UserPlus size={14} className="text-gray-400" /> Exportar Todo
                                    </button>
                                    <button onClick={() => { handleExportCSV('NO POTENCIAL'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                                        <UserX size={14} className="text-red-400" /> Solo No Potenciales
                                    </button>
                                    <button onClick={() => { handleExportCSV('POTENCIAL'); setShowExportMenu(false); }} className="w-full text-left px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center gap-2">
                                        <UserCheck size={14} className="text-brand-mint" /> Solo Potenciales
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main Interface */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-3 bg-gray-100/30 p-1.5 rounded-xl border border-gray-200/50">
                <div className="flex bg-white rounded-lg p-0.5 shadow-sm border border-gray-200/50 w-full md:w-auto overflow-x-auto">
                    {[
                        { id: 'TOTAL', label: 'Todos', icon: UserPlus, count: MOCK_LEADS.length },
                        { id: 'NO POTENCIAL', label: 'No Potenciales', icon: UserX, count: MOCK_LEADS.filter(l => l.status === 'NO POTENCIAL').length },
                        { id: 'POTENCIAL', label: 'Potenciales', icon: UserCheck, count: MOCK_LEADS.filter(l => l.status === 'POTENCIAL').length },
                    ].map((item) => (
                        <button
                            key={item.id}
                            // @ts-expect-error
                            onClick={() => { setFilter(item.id); setCurrentPage(1); }}
                            className={cn(
                                "flex items-center justify-center gap-2 px-3 py-1 rounded-md text-[11px] font-bold transition-all flex-1 md:flex-none whitespace-nowrap",
                                filter === item.id ? "bg-white text-gray-900 shadow-sm border border-gray-100" : "text-gray-400 hover:text-gray-600"
                            )}
                        >
                            <item.icon size={13} /> {item.label}
                            <span className={cn(
                                "ml-1 px-1.5 py-0.5 rounded-full text-[8px]",
                                filter === item.id ? "bg-brand-mint/10 text-brand-mint" : "bg-gray-200 text-gray-400"
                            )}>
                                {item.count}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-auto flex items-center gap-2">
                    <button
                        className="btn-secondary flex items-center gap-2 px-4 py-2 text-xs font-bold border-gray-200 bg-white shadow-sm rounded-2xl hover:text-brand-mint/80 transition-all"
                    >
                        <BarChart3 size={14} /> Estadística
                    </button>
                    {/* Columns Toggle (Moved Left) */}
                    <div className="relative">
                        <button
                            onClick={() => setShowColumnMenu(!showColumnMenu)}
                            className="btn-secondary flex items-center gap-2 px-4 py-2 text-xs font-bold border-gray-200 bg-white shadow-sm rounded-2xl"
                        >
                            <LayoutDashboard size={14} /> Columnas
                        </button>

                        {showColumnMenu && (
                            <>
                                <div className="fixed inset-0 z-30" onClick={() => setShowColumnMenu(false)} />
                                <div className="absolute left-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 z-40 p-2 animate-in fade-in zoom-in-95 duration-200">
                                    <div className="px-3 py-2 border-b border-gray-50 mb-1">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Campos Visibles</p>
                                    </div>
                                    <div className="max-h-64 overflow-y-auto custom-scrollbar">
                                        {/* Standard Optional Columns */}
                                        {[
                                            { id: 'contact', label: 'Contacto' },
                                            { id: 'summary', label: 'Resumen IA' },
                                            { id: 'score', label: 'Calificación' },
                                            ...Array.from(new Set(MOCK_LEADS.flatMap(l => Object.keys(l.custom_data || {})))).map(key => ({ id: key, label: key }))
                                        ].map(col => (
                                            <label key={col.id} className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                <div className={cn(
                                                    "w-4 h-4 rounded border flex items-center justify-center transition-all",
                                                    !hiddenColumns.includes(col.id) ? "bg-brand-mint border-brand-mint" : "border-gray-300 bg-white"
                                                )}>
                                                    {!hiddenColumns.includes(col.id) && <Check size={10} className="text-white" />}
                                                </div>
                                                <input
                                                    type="checkbox"
                                                    className="hidden"
                                                    checked={!hiddenColumns.includes(col.id)}
                                                    onChange={() => {
                                                        if (hiddenColumns.includes(col.id)) {
                                                            setHiddenColumns(prev => prev.filter(c => c !== col.id));
                                                        } else {
                                                            setHiddenColumns(prev => [...prev, col.id]);
                                                        }
                                                    }}
                                                />
                                                <span className="text-xs font-medium text-gray-700">{col.label}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    <div className="relative group w-60">
                        <Search
                            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-mint transition-colors cursor-pointer"
                            size={16}
                            onClick={handleSearch}
                        />
                        <input
                            id="leads-search"
                            type="text"
                            placeholder="Buscar y presionar Enter..."
                            onKeyDown={(e) => { if (e.key === 'Enter') handleSearch(); }}
                            className="w-full bg-gray-50 border border-transparent border-gray-100 rounded-lg py-2 pl-9 pr-4 text-xs focus:outline-none focus:ring-1 focus:ring-brand-mint/50 focus:bg-white focus:border-brand-mint transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table Interface */}
            <div className="card-professional overflow-hidden border-none shadow-xl shadow-black/5 bg-white flex flex-col h-[680px]">
                {(() => {
                    const dynamicKeys = Array.from(new Set(
                        paginatedLeads.flatMap(l => Object.keys(l.custom_data || {}))
                    ));

                    return (
                        <>
                            <div className="overflow-x-auto overflow-y-auto flex-1 custom-scrollbar">
                                <table className="w-full text-left border-collapse relative">
                                    <thead className="sticky top-0 z-10 bg-white shadow-sm shadow-gray-100">
                                        <tr className="bg-gray-50/50 border-b border-gray-100">
                                            <th className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[150px]">Nombre</th>
                                            {!hiddenColumns.includes('contact') && <th className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[130px]">Contacto</th>}

                                            {dynamicKeys.map(key => !hiddenColumns.includes(key) && (
                                                <th key={key} className="px-5 py-2 text-[10px] font-bold text-brand-mint uppercase tracking-widest min-w-[120px] bg-brand-mint/[0.02]">
                                                    <div className="flex items-center gap-1">
                                                        {key}
                                                        <span className="text-[7px] bg-brand-mint/10 px-1 rounded text-brand-mint border border-brand-mint/20">IA</span>
                                                    </div>
                                                </th>
                                            ))}

                                            {!hiddenColumns.includes('summary') && <th className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[250px]">Resumen IA</th>}
                                            {!hiddenColumns.includes('score') && <th className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center">Calificación</th>}
                                            <th className="px-5 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {paginatedLeads.length > 0 ? paginatedLeads.map((lead) => (
                                            <tr key={lead.id} className="hover:bg-gray-100 transition-colors group cursor-default">
                                                <td className="px-5 py-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] font-semibold text-gray-900 group-hover:text-brand-mint transition-colors">{lead.name}</span>
                                                        <span className="text-[9px] text-gray-400 font-medium flex items-center gap-1 mt-0.5">
                                                            <Calendar size={9} className="text-gray-300" />
                                                            {new Date(lead.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    </div>
                                                </td>
                                                {!hiddenColumns.includes('contact') && (
                                                    <td className="px-5 py-1">
                                                        <div className="flex flex-col gap-0.5">
                                                            <div className="flex items-center gap-1.5 text-[9px] text-gray-400 font-medium">
                                                                <Mail size={10} className="text-gray-300" /> {lead.email}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 text-[10px] text-gray-600 font-bold mt-0.5">
                                                                <Phone size={10} className="text-brand-mint" /> {lead.phone}
                                                            </div>
                                                        </div>
                                                    </td>
                                                )}

                                                {dynamicKeys.map(key => !hiddenColumns.includes(key) && (
                                                    <td key={key} className="px-5 py-1">
                                                        {lead.custom_data?.[key] ? (
                                                            <span className="text-[10px] text-gray-700 font-bold bg-brand-mint/5 px-2 py-0.5 rounded border border-brand-mint/20 whitespace-nowrap">
                                                                {lead.custom_data[key]}
                                                            </span>
                                                        ) : (
                                                            <span className="text-[7px] text-gray-200 uppercase tracking-tighter">no cap.</span>
                                                        )}
                                                    </td>
                                                ))}

                                                {!hiddenColumns.includes('summary') && (
                                                    <td className="px-5 py-1">
                                                        <button
                                                            onClick={() => setActiveSummary(lead)}
                                                            className="flex items-start gap-1.5 bg-gray-50/50 px-2 py-1 rounded-lg border border-gray-100 max-w-[280px] w-full text-left hover:bg-brand-mint/5 hover:border-brand-mint/30 transition-all group/sum"
                                                        >
                                                            <Sparkles size={10} className="text-brand-mint shrink-0 mt-0.5" />
                                                            <p className="text-[10px] text-gray-500 line-clamp-1 leading-tight group-hover/sum:text-gray-700">
                                                                {lead.summary}
                                                            </p>
                                                        </button>
                                                    </td>
                                                )}
                                                {!hiddenColumns.includes('score') && (
                                                    <td className="px-5 py-1 text-center">
                                                        <div className="flex justify-center">
                                                            <span className={cn(
                                                                "w-28 py-0.5 rounded-md text-[8px] font-bold uppercase tracking-wider border text-center",
                                                                getStatusColor(lead.status)
                                                            )}>
                                                                {lead.status}
                                                            </span>
                                                        </div>
                                                    </td>
                                                )}

                                                <td className="px-5 py-1 text-right">
                                                    <div className="flex justify-end gap-1.5">
                                                        <button onClick={() => setSelectedChat(lead)} className="w-7 h-7 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-brand-mint hover:border-brand-mint/30 rounded-lg transition-all" title="Chat">
                                                            <MessageSquareText size={14} />
                                                        </button>
                                                        <button className="w-7 h-7 flex items-center justify-center bg-white border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-300 rounded-lg transition-all" title="Eliminar">
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={5 + (dynamicKeys?.length || 0)} className="px-6 py-20 text-center text-gray-400 text-xs text uppercase tracking-widest font-bold">No se encontraron registros.</td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer */}
                            <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <p className="text-[10px] text-gray-500 font-bold tracking-widest leading-none uppercase">Mostrando {paginatedLeads.length} de {filteredData.length}</p>
                                    <div className="flex bg-gray-100 p-1 rounded-lg">
                                        {[14, 50, 100].map((size) => (
                                            <button key={size} onClick={() => { setItemsPerPage(size); setCurrentPage(1); }} className={cn("px-3 py-1 text-[10px] font-bold rounded", itemsPerPage === size ? "bg-white text-gray-900 shadow-sm" : "text-gray-400")}>
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 disabled:opacity-30"><ChevronLeft size={16} /></button>
                                    <div className="flex gap-1">
                                        {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => (
                                            <button key={i} onClick={() => setCurrentPage(i + 1)} className={cn("w-8 h-8 rounded-lg text-xs font-bold", currentPage === i + 1 ? "bg-brand-mint text-white" : "text-gray-400")}>
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                    <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 border border-gray-200 rounded-lg text-gray-400 disabled:opacity-30"><ChevronRight size={16} /></button>
                                </div>
                            </div>
                        </>
                    );
                })()}
            </div>

            {/* Popups & Overlays remain the same (AI Summary, Chat, etc.) */}
            {activeSummary && (
                <>
                    <div className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[300]" onClick={() => setActiveSummary(null)} />
                    <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white z-[310] shadow-2xl rounded-3xl overflow-hidden border border-gray-100 animate-in zoom-in-95 duration-200">
                        <div className="p-5 border-b border-gray-100 bg-brand-mint/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-mint flex items-center justify-center text-white shadow-lg shadow-brand-mint/20"><Sparkles size={18} /></div>
                                <div>
                                    <h3 className="text-sm font-bold text-gray-900">Resumen de asistente IA</h3>
                                    <p className="text-[10px] text-gray-500 font-medium">Lead: {activeSummary.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setActiveSummary(null)} className="p-2 text-gray-400 hover:text-red-500 transition-all"><X size={20} /></button>
                        </div>
                        <div className="p-8 bg-white">
                            <p className="text-gray-700 text-sm leading-relaxed italic font-medium">&quot;{activeSummary.summary}&quot;</p>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between px-6">
                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest leading-none">Calificación del Lead</span>
                            <div className={cn("px-6 py-2 rounded-xl text-xs font-bold border uppercase", getStatusColor(activeSummary.status))}>
                                {activeSummary.status}
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* Chat Sidebar Overlay */}
            {selectedChat && (
                <>
                    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[200]" onClick={() => setSelectedChat(null)} />
                    <div className="fixed top-0 right-0 h-screen w-full max-w-lg bg-white z-[210] shadow-2xl animate-in slide-in-from-right duration-300 flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-brand-mint flex items-center justify-center text-white font-bold shadow-lg shadow-brand-mint/10">{selectedChat.name[0]}</div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-900">{selectedChat.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <span className={cn("px-2 py-0.5 rounded text-[9px] font-bold border uppercase", getStatusColor(selectedChat.status))}>{selectedChat.status}</span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1"><Phone size={10} /> {selectedChat.phone}</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setSelectedChat(null)} className="p-2 text-gray-400 hover:text-red-500"><X size={22} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F9FAFB]/50">
                            {selectedChat.conversation.map((msg, idx) => (
                                <div key={idx} className={cn("flex flex-col max-w-[85%]", msg.role === 'assistant' ? "items-start mr-auto" : "items-end ml-auto")}>
                                    <div className={cn("p-4 rounded-3xl text-[12px] leading-relaxed shadow-sm", msg.role === 'assistant' ? "bg-white text-gray-700 border border-gray-100 rounded-tl-none" : "bg-brand-primary-darker text-white font-medium rounded-tr-none")}>
                                        {msg.text}
                                    </div>
                                    <span className="text-[8px] text-gray-400 mt-2 uppercase font-bold tracking-tighter px-2">{msg.role === 'assistant' ? 'Agente Antigravity' : 'Cliente'}</span>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 border-t border-gray-100 bg-white">
                            <button className="w-full btn-primary py-3.5 text-xs font-bold flex items-center justify-center gap-2 shadow-xl shadow-brand-mint/20 text-white">
                                <MessageSquareText size={16} /> Entrar al Chat de WhatsApp
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
