"use client";

import React from 'react';
import { FileText, ChevronRight, Gauge } from 'lucide-react';

export const CompressionAnimation: React.FC = () => {
    return (
        <div className="relative w-full max-w-lg mx-auto h-64 flex items-center justify-between px-10 bg-white/5 rounded-[40px] border border-white/10 backdrop-blur-sm overflow-hidden group">

            {/* Input Side */}
            <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-left duration-1000">
                <div className="w-20 h-28 bg-white/10 rounded-lg border-2 border-dashed border-white/20 flex flex-col items-center justify-center relative overflow-hidden group-hover:border-brand-mint/40 transition-colors">
                    <FileText size={40} className="text-white/40 mb-2" />
                    <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">25.4 MB</span>

                    {/* Animated Sheet Entering */}
                    <div className="absolute inset-0 bg-brand-mint/5 translate-x-[-100%] animate-[slideRight_3s_infinite]" />
                </div>
                <span className="mt-4 text-[10px] font-black text-gray-500 uppercase tracking-widest">Original</span>
            </div>

            {/* Central "Processor" */}
            <div className="relative flex flex-col items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-brand-mint/20 flex items-center justify-center relative z-10 border border-brand-mint/30 shadow-lg shadow-brand-mint/20">
                    <Gauge size={24} className="text-brand-mint animate-spin [animation-duration:3s]" />
                </div>

                {/* Connecting Lines */}
                <div className="absolute top-1/2 left-[-60px] w-[60px] h-[2px] bg-gradient-to-r from-transparent to-brand-mint/40" />
                <div className="absolute top-1/2 right-[-60px] w-[60px] h-[2px] bg-gradient-to-r from-brand-mint/40 to-transparent" />
            </div>

            {/* Output Side */}
            <div className="relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-right duration-1000">
                <div className="w-12 h-16 bg-brand-mint/10 rounded-lg border-2 border-brand-mint/40 flex flex-col items-center justify-center relative overflow-hidden shadow-2xl shadow-brand-mint/10">
                    <FileText size={20} className="text-brand-mint mb-1" />
                    <span className="text-[8px] font-black text-brand-mint uppercase tracking-widest">840 KB</span>

                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-white/10 animate-pulse" />
                </div>
                <span className="mt-4 text-[10px] font-black text-brand-mint uppercase tracking-widest">Optimizado</span>
            </div>

            <style jsx>{`
                @keyframes slideRight {
                    0% { transform: translateX(-100%); opacity: 0; }
                    20% { opacity: 1; }
                    80% { opacity: 1; }
                    100% { transform: translateX(200%); opacity: 0; }
                }
            `}</style>
        </div>
    );
};
