"use client";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LeadsRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        // Preserve query params (e.g. ?view_as=) during redirect
        const params = searchParams.toString();
        const target = `/leads/app/dashboard${params ? `?${params}` : ''}`;
        router.push(target);
    }, [router, searchParams]);

    return (
        <div className="flex items-center justify-center min-h-screen bg-white">
            <div className="animate-pulse text-brand-turquoise font-bold uppercase tracking-widest text-xs">
                Cargando panel...
            </div>
        </div>
    );
}
