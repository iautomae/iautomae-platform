"use client";

import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, loading: authLoading } = useAuth();
    const { profile, loading: profileLoading } = useProfile();
    const router = useRouter();
    const pathname = usePathname();

    const isLoading = authLoading || (user && profileLoading);

    useEffect(() => {
        if (!isLoading) {
            // Case 1: No user at all -> Login
            if (!user && pathname !== '/login') {
                router.push('/login');
                return;
            }

            // Case 2: User exists but not approved
            if (user && profile && !profile.is_approved && pathname !== '/pending-approval') {
                router.push('/pending-approval');
                return;
            }

            // Case 3: User is approved but tries to access a service they haven't paid for
            if (user && profile && profile.is_approved) {
                if (pathname.startsWith('/leads') && !profile.has_leads_access) {
                    router.push('/');
                    return;
                }
                if (pathname.startsWith('/documents') && !profile.has_docs_access) {
                    router.push('/');
                    return;
                }
                if (pathname.startsWith('/forms') && !profile.has_forms_access) {
                    router.push('/');
                    return;
                }
            }

            // Case 4: User is approved but tries to go to pending-approval
            if (user && profile && profile.is_approved && pathname === '/pending-approval') {
                router.push('/');
                return;
            }
        }
    }, [user, profile, isLoading, router, pathname]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-[#0a0a0a] flex items-center justify-center z-[110]">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="animate-spin text-brand-mint" size={48} />
                    <span className="text-white/40 text-xs font-bold tracking-widest uppercase animate-pulse">Autenticando...</span>
                </div>
            </div>
        );
    }

    // Protection during redirection
    if (!user && pathname !== '/login') return null;
    if (user && profile && !profile.is_approved && pathname !== '/pending-approval') return null;

    return <>{children}</>;
}
