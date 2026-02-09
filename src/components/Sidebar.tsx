"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  LogOut
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useUI } from '@/hooks/useUI';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

type MainCategory = 'dashboard' | 'leads' | 'documents' | 'forms' | 'settings';

const PRIMARY_MENU = [
  { id: 'leads' as MainCategory, icon: Users, label: 'Agentes', href: '/leads', permission: 'has_leads_access' },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading } = useProfile();
  const { activeCategory, setActiveCategory, setSubSidebarOpen } = useUI();

  // USER: Change this URL to your default logo image path
  const DEFAULT_LOGO_URL = "/brand/logo.jpg";
  const [logo, setLogo] = useState(DEFAULT_LOGO_URL);

  useEffect(() => {
    const savedLogo = localStorage.getItem('antigravity_brand_logo');
    if (savedLogo) setLogo(savedLogo);
  }, []);

  const loading = authLoading || (user && profileLoading);

  if (loading || !user || pathname === '/login' || pathname === '/pending-approval') return null;

  // Filter menu based on permissions
  const visibleMenu = PRIMARY_MENU.filter(item => {
    if (!item.permission) return true;
    return profile?.[item.permission as keyof typeof profile] === true;
  });


  return (
    <div className="fixed left-4 top-4 bottom-4 w-20 bg-sidebar rounded-2xl shadow-2xl shadow-black/5 border border-slate-100 flex flex-col items-center py-8 z-[60] select-none transition-all duration-300">
      {/* Brand Logo - Swappable */}
      <div className="mb-10">
        <Link href="/" className="relative z-10 flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
          <img
            src={logo}
            alt="Logo"
            className="w-10 h-10 rounded-lg object-cover"
          />
          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/logo:opacity-100 flex items-center justify-center transition-opacity rounded-lg">
            <LayoutDashboard size={12} className="text-white" />
          </div>
        </Link>
      </div>

      {/* Primary Navigation */}
      <nav className="flex-1 flex flex-col gap-4">
        {visibleMenu.map((item) => {
          const isActive = activeCategory === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                setActiveCategory(item.id);
                if (item.id === 'leads') {
                  setSubSidebarOpen(false);
                  router.push('/leads');
                }
              }}
              className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative border-2",
                isActive
                  ? "border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm"
                  : "border-transparent text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5"
              )}
              style={isActive ? { borderColor: '#14b8a6', color: '#14b8a6' } : {}}
            >
              <item.icon
                size={20}
                className="relative z-10"
                style={isActive ? { color: '#14b8a6' } : {}}
              />

              {/* Tooltip */}
              <div className="absolute left-[70px] bg-slate-900 text-white px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 pointer-events-none transition-all translate-x-[-10px] group-hover:translate-x-0 z-50 shadow-xl whitespace-nowrap">
                {item.label}
              </div>
            </button>
          )
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="mt-auto flex flex-col gap-4">
        <button
          onClick={() => setActiveCategory('settings')}
          className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 group relative border-2",
            activeCategory === 'settings'
              ? "border-brand-primary bg-brand-primary/10 text-brand-primary shadow-sm"
              : "border-transparent text-slate-400 hover:text-brand-primary hover:bg-brand-primary/5"
          )}
          style={activeCategory === 'settings' ? { borderColor: '#14b8a6', color: '#14b8a6' } : {}}
        >
          <Settings
            size={20}
            style={activeCategory === 'settings' ? { color: '#14b8a6' } : {}}
          />
        </button>
        <button
          onClick={() => signOut()}
          className="w-12 h-12 rounded-xl flex items-center justify-center text-red-500 hover:bg-red-50 transition-all duration-300 group relative"
        >
          <LogOut size={20} />
        </button>
      </div>
    </div>
  );
}
