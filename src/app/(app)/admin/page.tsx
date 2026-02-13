"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import { Shield, Settings, ExternalLink, Search, RefreshCw } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface ClientProfile {
    id: string;
    email: string;
    role: string;
    features: Record<string, boolean>;
    brand_logo?: string;
    created_at: string;
    agent_count?: number;
}

interface ProfileQueryResult {
    id: string;
    email: string | null;
    role: string | null;
    features: Record<string, boolean> | null;
    brand_logo: string | null;
}

export default function SuperAdminDashboard() {
    const { profile, loading: profileLoading } = useProfile();
    const router = useRouter();
    const [clients, setClients] = useState<ClientProfile[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    // Feature definitions
    const AVAILABLE_FEATURES = [
        { id: "calendar", label: "Calendario", icon: "📅" },
        { id: "gps", label: "Rutas GPS", icon: "📍" },
        { id: "leads_advanced", label: "Leads Pro", icon: "🚀" },
    ];

    useEffect(() => {
        if (!profileLoading && (!profile || profile.role !== "admin")) {
            router.push("/leads");
            return;
        }

        if (profile?.role === "admin") {
            fetchClients();
        }
    }, [profile, profileLoading, router]);

    const fetchClients = async () => {
        setIsLoading(true);
        try {
            console.log("Admin Panel: Fetching clients and stats...");

            // 1. Fetch Profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from("profiles")
                .select("id, email, role, features, brand_logo");

            if (profilesError) {
                console.error("Profiles Query Error:", profilesError);
                throw profilesError;
            }

            // 2. Fetch Agent counts from our new secure API
            let counts: Record<string, number> = {};
            try {
                const res = await fetch('/api/admin/stats');
                const statsData = await res.json();
                if (statsData.counts) {
                    counts = statsData.counts;
                }
            } catch (err) {
                console.error("Failed to fetch agent counts from API:", err);
            }

            const formatted: ClientProfile[] = (profilesData as unknown as ProfileQueryResult[] || []).map((p) => ({
                id: p.id,
                email: p.email || 'Sin email',
                role: p.role || 'client',
                features: p.features || {},
                brand_logo: p.brand_logo || undefined,
                created_at: '',
                agent_count: counts[p.id] || 0
            }));

            setClients(formatted);
        } catch (err) {
            console.error("DEBUG: fetchClients failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleFeature = async (userId: string, featureId: string) => {
        setIsUpdating(`${userId}-${featureId}`);
        const client = clients.find((c) => c.id === userId);
        if (!client) return;

        const newFeatures = { ...client.features };
        newFeatures[featureId] = !newFeatures[featureId];

        try {
            const { error } = await supabase
                .from("profiles")
                .update({ features: newFeatures })
                .eq("id", userId);

            if (error) throw error;

            setClients((prev) =>
                prev.map((c) =>
                    c.id === userId ? { ...c, features: newFeatures } : c
                )
            );
        } catch (err) {
            console.error("Error updating features:", err);
        } finally {
            setIsUpdating(null);
        }
    };

    const setRole = async (userId: string, newRole: string) => {
        if (!confirm(`¿Cambiar rol a ${newRole}?`)) return;
        try {
            const { error } = await supabase
                .from("profiles")
                .update({ role: newRole })
                .eq("id", userId);
            if (error) throw error;
            fetchClients();
        } catch (err) {
            console.error("Error updating role:", err);
        }
    };

    const filteredClients = clients.filter((c) =>
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );


    if (profileLoading || isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Cargando Panel Maestro...</p>
            </div>
        );
    }

    if (!profile || profile.role !== "admin") return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <header className="flex items-center justify-between mb-4">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Panel Maestro</h1>
                            <p className="text-gray-500 text-xs font-medium">Supervisión central de clientes y servicios.</p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all w-64 shadow-sm font-medium"
                    />
                </div>
            </header>

            {/* Clients Table */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl border border-gray-200 shadow-xl relative overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse table-fixed">
                        <thead className="bg-gray-50/50 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-900 uppercase tracking-tight w-[25%] border-b border-gray-100">Usuario</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-tight w-[15%] border-b border-l border-gray-100">Agentes</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-tight w-[40%] border-b border-l border-gray-100">Módulos Activos</th>
                                <th className="px-6 py-3 text-[10px] font-bold text-gray-500 uppercase tracking-tight w-[20%] text-center border-b border-l border-gray-100">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50/50 transition-colors group">
                                    <td className="px-6 py-2 border-b border-gray-50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-gray-100 border border-gray-200 flex items-center justify-center text-gray-500 text-xs font-bold overflow-hidden shrink-0">
                                                {client.brand_logo ? (
                                                    <img src={client.brand_logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    (client.email || '?').charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900 truncate">{client.email}</p>
                                                <span className={cn(
                                                    "text-[8px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                    client.role === 'admin' ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                                                )}>
                                                    {client.role}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 border-b border-l border-gray-50">
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "w-1.5 h-1.5 rounded-full",
                                                client.agent_count && client.agent_count > 0 ? "bg-brand-primary animate-pulse" : "bg-gray-300"
                                            )} />
                                            <span className="text-[11px] font-bold text-gray-700">{client.agent_count} {client.agent_count === 1 ? 'agente' : 'agentes'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 border-b border-l border-gray-50">
                                        <div className="flex flex-wrap gap-1.5">
                                            {AVAILABLE_FEATURES.map((feature) => {
                                                const isActive = client.features?.[feature.id];
                                                const key = `${client.id}-${feature.id}`;
                                                return (
                                                    <button
                                                        key={feature.id}
                                                        onClick={() => toggleFeature(client.id, feature.id)}
                                                        disabled={isUpdating === key}
                                                        className={cn(
                                                            "px-2.5 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 border transition-all",
                                                            isActive
                                                                ? "bg-gray-900 border-gray-900 text-white"
                                                                : "bg-white border-gray-200 text-gray-400 opacity-60 hover:opacity-100"
                                                        )}
                                                    >
                                                        <span className="text-[10px]">{feature.icon}</span>
                                                        {feature.label}
                                                        {isUpdating === key && <RefreshCw className="w-2.5 h-2.5 animate-spin" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-2 border-b border-l border-gray-50">
                                        <div className="flex items-center justify-center gap-2">
                                            <button
                                                title="Cambiar Rol"
                                                className="p-1.5 text-gray-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                                                onClick={() => setRole(client.id, client.role === 'admin' ? 'client' : 'admin')}
                                            >
                                                <Settings size={14} />
                                            </button>
                                            <Link
                                                href={`/leads/iautomae/dashboard?view_as=${client.id}`}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary text-[10px] font-bold rounded-lg transition-all hover:text-white"
                                            >
                                                <ExternalLink size={12} />
                                                ENTRAR
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredClients.length === 0 && (
                    <div className="p-12 text-center bg-gray-50/30">
                        <p className="text-gray-400 text-xs font-medium">No se encontraron clientes que coincidan con la búsqueda.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
