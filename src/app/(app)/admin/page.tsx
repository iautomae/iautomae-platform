"use client";

import React, { useEffect, useState } from "react";
import Link from 'next/link';
import { supabase } from "@/lib/supabase";
import { useProfile } from "@/hooks/useProfile";
import { useRouter } from "next/navigation";
import { Users, Shield, Settings, ExternalLink, Search, RefreshCw, Star } from "lucide-react";
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

interface ProfileRawResponse {
    id: string;
    email: string;
    role: string;
    features: Record<string, boolean>;
    brand_logo?: string;
    created_at: string;
    agentes: { count: number }[];
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
            const { data, error } = await supabase
                .from("profiles")
                .select("*, agentes(count)")
                .order("created_at", { ascending: false });

            if (error) throw error;

            const typedData = (data as unknown) as ProfileRawResponse[];
            const formatted = typedData.map((p) => ({
                ...p,
                agent_count: p.agentes?.[0]?.count || 0
            }));
            setClients(formatted);
        } catch (err) {
            console.error("Error fetching clients:", err);
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
            <div className="flex flex-col items-center justify-center min-h-screen bg-white">
                <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mb-4" />
                <p className="text-slate-500 font-medium">Cargando Panel Maestro...</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50/50 p-8 ml-24">
            {/* Header */}
            <header className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Shield className="text-brand-primary w-6 h-6" />
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Panel Maestro</h1>
                    </div>
                    <p className="text-slate-500 text-sm">Gestiona tus clientes, activa módulos y supervisa la red.</p>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Buscar por email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary outline-none transition-all w-64 shadow-sm"
                    />
                </div>
            </header>

            {/* Clients Table */}
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden transform transition-all duration-500">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-bottom border-slate-100">
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/4">Usuario</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/6">Agentes</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/3">Módulos Activos</th>
                                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-1/6 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredClients.map((client) => (
                                <tr key={client.id} className="hover:bg-slate-50/30 transition-colors group">
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                                                {client.brand_logo ? (
                                                    <img src={client.brand_logo} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    client.email.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900">{client.email}</p>
                                                <span className={cn(
                                                    "text-[9px] font-bold px-1.5 py-0.5 rounded uppercase",
                                                    client.role === 'admin' ? "bg-purple-50 text-purple-600 border border-purple-100" : "bg-blue-50 text-blue-600 border border-blue-100"
                                                )}>
                                                    {client.role}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-brand-primary" />
                                            <span className="text-sm font-medium text-slate-600">{client.agent_count} agentes</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex flex-wrap gap-2">
                                            {AVAILABLE_FEATURES.map((feature) => {
                                                const isActive = client.features?.[feature.id];
                                                const key = `${client.id}-${feature.id}`;
                                                return (
                                                    <button
                                                        key={feature.id}
                                                        onClick={() => toggleFeature(client.id, feature.id)}
                                                        disabled={isUpdating === key}
                                                        className={cn(
                                                            "px-3 py-1.5 rounded-xl text-[11px] font-bold flex items-center gap-2 border transition-all",
                                                            isActive
                                                                ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-900/10"
                                                                : "bg-white border-slate-200 text-slate-400 grayscale opacity-50 hover:grayscale-0 hover:opacity-100"
                                                        )}
                                                    >
                                                        <span>{feature.icon}</span>
                                                        {feature.label}
                                                        {isUpdating === key && <RefreshCw className="w-3 h-3 animate-spin" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                title="Configuración"
                                                className="p-2 text-slate-400 hover:text-brand-primary hover:bg-brand-primary/10 rounded-lg transition-all"
                                                onClick={() => setRole(client.id, client.role === 'admin' ? 'client' : 'admin')}
                                            >
                                                <Settings size={18} />
                                            </button>
                                            <Link
                                                href={`/leads/dashboard?view_as=${client.id}`}
                                                className="flex items-center gap-2 px-3 py-1.5 bg-brand-primary/10 text-brand-primary hover:bg-brand-primary text-[11px] font-bold rounded-xl transition-all hover:text-white"
                                            >
                                                <ExternalLink size={14} />
                                                ENTRAR
                                            </Link>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {
                    filteredClients.length === 0 && (
                        <div className="p-12 text-center">
                            <p className="text-slate-400 text-sm">No se encontraron clientes que coincidan con la búsqueda.</p>
                        </div>
                    )
                }
            </div >
        </div >
    );
}
