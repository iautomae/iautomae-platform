"use client";

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Sidebar } from "@/components/Sidebar";
import { SubSidebar } from "@/components/SubSidebar";
import { useAuth } from "@/hooks/useAuth";
import { useUI } from "@/hooks/useUI";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function ClientLayout({ children }: { children: React.ReactNode }) {
    const { isSubSidebarOpen, setSubSidebarOpen } = useUI();
    const { user } = useAuth();

    // ADJUSTED MARGIN: Floating sidebar (16px left + 80px width + 16px gap = 112px)
    const marginClass = user ? "ml-[112px]" : "ml-0";

    return (
        <div className="flex bg-background min-h-screen">
            <Sidebar />
            <SubSidebar />

            <main
                className={cn(
                    "flex-1 min-h-screen py-4 pr-8 relative z-0 transition-all duration-300",
                    marginClass
                )}
            >
                {children}
            </main>
        </div>
    );
}
