import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export type AppRole = 'admin' | 'tenant_owner' | 'client';

export interface AuthenticatedProfile {
    id: string;
    email: string | null;
    role: AppRole;
    tenant_id: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    features: Record<string, any> | null;
    has_leads_access: boolean | null;
}

export interface AuthContext {
    accessToken: string;
    profile: AuthenticatedProfile;
}

function getSupabaseAdmin() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

function extractBearerToken(request: Request): string | null {
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }

    return authHeader.slice('Bearer '.length).trim() || null;
}

export async function requireAuth(
    request: Request,
    allowedRoles?: AppRole[]
): Promise<{ context: AuthContext | null; response: NextResponse | null }> {
    const accessToken = extractBearerToken(request);
    if (!accessToken) {
        return {
            context: null,
            response: NextResponse.json({ error: 'No autorizado.' }, { status: 401 }),
        };
    }

    const supabaseAdmin = getSupabaseAdmin();
    const {
        data: { user },
        error: authError,
    } = await supabaseAdmin.auth.getUser(accessToken);

    if (authError || !user) {
        return {
            context: null,
            response: NextResponse.json({ error: 'Sesión inválida.' }, { status: 401 }),
        };
    }

    const { data: profile, error: profileError } = await supabaseAdmin
        .from('profiles')
        .select('id, email, role, tenant_id, features, has_leads_access')
        .eq('id', user.id)
        .single<AuthenticatedProfile>();

    if (profileError || !profile) {
        return {
            context: null,
            response: NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 403 }),
        };
    }

    if (allowedRoles && !allowedRoles.includes(profile.role)) {
        return {
            context: null,
            response: NextResponse.json({ error: 'No tienes permisos para esta acción.' }, { status: 403 }),
        };
    }

    return {
        context: { accessToken, profile },
        response: null,
    };
}

export function getTopLevelFeatureKey(featureKey: string): string {
    return featureKey.split(':')[0];
}

export function hasFeatureAccess(profile: AuthenticatedProfile, featureKey: string): boolean {
    const topLevelFeature = getTopLevelFeatureKey(featureKey);
    if (topLevelFeature === 'leads') {
        return profile.features?.leads === true || profile.has_leads_access === true;
    }

    return profile.features?.[topLevelFeature] === true;
}

export async function getProfileById(profileId: string) {
    return getSupabaseAdmin()
        .from('profiles')
        .select('id, email, role, tenant_id, features, has_leads_access')
        .eq('id', profileId)
        .single<AuthenticatedProfile>();
}

export function getSupabaseAdminClient() {
    return getSupabaseAdmin();
}
