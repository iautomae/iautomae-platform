"use client";

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './useAuth';

export type Company = {
    id: string;
    nombre: string;
    nicho: 'libreria' | 'restaurante' | 'general';
    configuracion: any;
};

export type UserProfile = {
    id: string;
    email: string;
    is_approved: boolean;
    has_leads_access: boolean;
    has_docs_access: boolean;
    has_forms_access: boolean;
    has_compressor_access: boolean;
    primary_service: string | null;
    empresa_id: string | null;
    empresa?: Company | null;
} | null;

export function useProfile() {
    const { user } = useAuth();
    const [profile, setProfile] = useState<UserProfile>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchProfile() {
            if (!user) {
                setProfile(null);
                setLoading(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('*, empresa:empresas(*)')
                    .eq('id', user.id)
                    .single();

                if (error) {
                    console.error('Error fetching profile:', error.message);
                    setProfile({
                        id: user.id,
                        email: user.email || '',
                        is_approved: false,
                        has_leads_access: false,
                        has_docs_access: false,
                        has_forms_access: false,
                        has_compressor_access: false,
                        primary_service: null,
                        empresa_id: null,
                        empresa: null
                    });
                } else {
                    // Merge auth email into profile for UI consistency
                    setProfile({
                        ...data,
                        email: data.email || user.email || ''
                    });
                }
            } catch (err) {
                console.error('Unexpected error fetching profile:', err);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [user]);

    return { profile, loading };
}
