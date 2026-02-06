"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { ClientLayout } from "@/components/ClientLayout";

export default function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <ClientLayout>
                {children}
            </ClientLayout>
        </AuthGuard>
    );
}
