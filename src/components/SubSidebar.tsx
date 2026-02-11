"use client";

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ChevronRight,
    FileSpreadsheet,
    History,
    FileCode,
    MessageSquare,
    LayoutGrid,
    Settings2,
    Bell,
    Plus
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useUI } from '@/hooks/useUI';

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

const SUB_MENU_CONFIG = {
    dashboard: {
        title: 'Dashboard',
        items: [
            { label: 'Vista General', href: '/', icon: LayoutGrid },
            { label: 'Notificaciones', href: '/notifications', icon: Bell },
        ]
    },
    settings: {
        title: 'Ajustes',
        items: [
            { label: 'Perfil', href: '/settings/profile', icon: Settings2 },
            { label: 'Suscripción', href: '/settings/billing', icon: Plus },
        ]
    }
};

export function SubSidebar() {
    const pathname = usePathname();
    const { activeCategory, isSubSidebarOpen, setSubSidebarOpen } = useUI();

    // We are NOT auto-opening anymore as per user request ("solo cuando se clickeado").
    // But we close it if the pathname changes (user clicked an item)
    React.useEffect(() => {
        setSubSidebarOpen(false);
    }, [pathname, setSubSidebarOpen]);

    if (!activeCategory || !isSubSidebarOpen) return null;

    const config = SUB_MENU_CONFIG[activeCategory as keyof typeof SUB_MENU_CONFIG];
    if (!config) return null;

    return (
        <div className={cn(
            "fixed left-[112px] top-4 bottom-4 w-64 bg-white rounded-2xl border border-slate-100 z-50 transition-all duration-300 transform shadow-2xl animate-in slide-in-from-left duration-300 overflow-hidden",
            isSubSidebarOpen ? "translate-x-0 opacity-100" : "-translate-x-10 opacity-0 pointer-events-none"
        )}>
            <div className="h-full flex flex-col p-6">
                <div className="flex justify-between items-center mb-6 px-3">
                    <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {config.title}
                    </h3>
                </div>

                <nav className="space-y-1">
                    {config.items.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group",
                                    isActive
                                        ? "bg-brand-turquoise/10 text-brand-turquoise"
                                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <item.icon size={18} className={cn(isActive ? "text-brand-turquoise" : "text-gray-400 group-hover:text-gray-600")} />
                                    <span>{item.label}</span>
                                </div>
                                <ChevronRight size={14} className={cn("transition-transform opacity-0 group-hover:opacity-100", isActive && "opacity-100")} />
                            </Link>
                        );
                    })}
                </nav>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
                <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tight mb-2">Soporte</p>
                    <button className="text-[11px] font-semibold text-brand-turquoise hover:underline">¿WhatsApp de Ayuda?</button>
                </div>
            </div>
        </div>
    );
}
