"use client";

import React from 'react';
import {
  Zap,
  ShieldCheck,
  ArrowUpRight,
  BarChart3,
  Search,
  Bell,
  MoreHorizontal,
  SquarePen
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Upper Top Bar / Header */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Dashboard</h2>
          <p className="text-sm text-gray-500">Reporte financiero para Feb 01, 2024 - Feb 28, 2024</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-brand-mint" size={18} />
            <input
              type="text"
              placeholder="Buscar..."
              className="bg-white border rounded-lg py-2 pl-10 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-brand-mint/50 focus:border-brand-mint"
            />
          </div>
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
            <Bell size={20} />
          </button>
          <div className="w-8 h-8 rounded-full bg-gray-200 border overflow-hidden">
            <img src="https://ui-avatars.com/api/?name=User&background=19799E&color=FFFFFF" alt="Profile" />
          </div>
        </div>
      </div>

      {/* Welcome Banner */}
      <div className="bg-white border flex items-center justify-between p-6 rounded-xl shadow-sm overflow-hidden relative">
        <div className="absolute top-0 left-0 w-1 h-full bg-brand-mint" />
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">Bienvenido a Antigravity</h3>
          <p className="text-sm text-gray-500">Ahora es más fácil que nunca comenzar a captar leads con IA.</p>
        </div>
        <button className="px-5 py-2 text-sm font-semibold border rounded-lg hover:bg-gray-50 transition-colors">
          Watch a Demo
        </button>
      </div>

      {/* Main Grid: Balance & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Large Chart Card (Mockup) */}
        <div className="lg:col-span-2 card-professional p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gray-100 rounded-lg">
                <BarChart3 size={18} className="text-gray-600" />
              </div>
              <h4 className="font-semibold text-gray-900">Actividad de Leads</h4>
            </div>
            <div className="flex bg-gray-100 p-1 rounded-lg text-xs font-medium text-gray-500">
              <button className="px-3 py-1 bg-white shadow-sm rounded-md text-gray-900">Semanal</button>
              <button className="px-3 py-1 hover:text-gray-900">Mensual</button>
              <button className="px-3 py-1 hover:text-gray-900">Anual</button>
            </div>
          </div>

          <div className="space-y-1">
            <p className="text-sm text-gray-500">Total acumulado</p>
            <p className="text-3xl font-bold text-gray-900">$22,933.92</p>
          </div>

          <div className="h-48 w-full bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 flex items-center justify-center">
            <p className="text-xs text-gray-400 italic">Previsualización de Gráfico Lineal de Actividad</p>
          </div>
        </div>

        {/* Vertical Stats Column */}
        <div className="space-y-6">
          {[
            { label: 'Leads Captados', value: '$28,933.92', trend: '+5% vs último mes', color: 'text-brand-mint' },
            { label: 'Gastos de Email', value: '$12,933.92', trend: '-12% vs último mes', color: 'text-red-500' },
          ].map((stat, i) => (
            <div key={i} className="card-professional p-6 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <h5 className="text-sm font-medium text-gray-500">{stat.label}</h5>
                <button><MoreHorizontal size={18} className="text-gray-400" /></button>
              </div>
              <div className="mt-4">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className={cn("text-xs font-medium mt-1 uppercase tracking-tight", stat.color)}>{stat.trend}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Services Grid Selection */}
      <h4 className="text-lg font-bold text-gray-900 mt-10">Servicios Activos</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-10">
        {[
          { title: 'Atención con IA', desc: 'Gestiona la captación de leads con agentes inteligentes.', icon: Zap },
          { title: 'Automatización Docs', desc: 'Crea y firma documentos legalizados al instante.', icon: ShieldCheck },
          { title: 'Formularios Dinámicos', desc: 'Captura datos e intégralos a tu CRM favorito.', icon: SquarePen },
        ].map((service, i) => (
          <div key={i} className="card-professional p-6 hover:border-brand-mint/50 transition-colors group cursor-pointer">
            <div className="w-12 h-12 rounded-xl bg-brand-mint/10 flex items-center justify-center mb-4 group-hover:bg-brand-mint transition-colors">
              <service.icon size={24} className="text-brand-mint group-hover:text-white" />
            </div>
            <h5 className="font-bold text-gray-900 mb-2">{service.title}</h5>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">{service.desc}</p>
            <button className="flex items-center gap-2 text-xs font-bold text-brand-mint uppercase tracking-widest group-hover:gap-3 transition-all">
              Gestionar servicio <ArrowUpRight size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
