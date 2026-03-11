"use client";

import { LoaderCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
    size?: number;
    className?: string;
    label?: string;
}

export function LoadingSpinner({ size = 16, className, label }: LoadingSpinnerProps) {
    return (
        <div className={cn("inline-flex items-center gap-2", className)}>
            <LoaderCircle size={size} className="animate-spin" />
            {label && <span>{label}</span>}
        </div>
    );
}
