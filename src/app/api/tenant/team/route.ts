import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: Request) {
    try {
        // 1. Identificar al caller
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'No autorizado.' }, { status: 401 });
        }

        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ error: 'Token inválido.' }, { status: 401 });
        }

        // 2. Obtener perfil del caller
        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tenant_id')
            .eq('id', user.id)
            .single();

        if (profileError || !callerProfile) {
            return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 403 });
        }

        // Admin can view any tenant's team via ?tenant_id= query param
        const url = new URL(req.url);
        const queryTenantId = url.searchParams.get('tenant_id');

        let tenantId: string;
        let excludeId: string;

        if (callerProfile.role === 'admin' && queryTenantId) {
            tenantId = queryTenantId;
            excludeId = ''; // Don't exclude anyone — admin is not a member
        } else if (callerProfile.role === 'tenant_owner' && callerProfile.tenant_id) {
            tenantId = callerProfile.tenant_id;
            excludeId = callerProfile.id;
        } else {
            return NextResponse.json({ error: 'Solo el propietario puede ver el equipo.' }, { status: 403 });
        }

        // 3. Obtener todos los perfiles del tenant
        let membersQuery = supabaseAdmin
            .from('profiles')
            .select('id, email, full_name, role, features, has_leads_access')
            .eq('tenant_id', tenantId);

        if (excludeId) {
            membersQuery = membersQuery.neq('id', excludeId);
        }

        const { data: members, error: membersError } = await membersQuery;

        if (membersError) {
            console.error('Error fetching team:', membersError);
            return NextResponse.json({ error: 'Error al obtener el equipo.' }, { status: 500 });
        }

        // 4. Para cada miembro, verificar si ya confirmó su cuenta (email_confirmed_at / last_sign_in_at)
        const membersWithStatus = await Promise.all(
            (members || []).map(async (member) => {
                try {
                    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(member.id);
                    const isConfirmed = !!(authUser?.email_confirmed_at);
                    const lastSignIn = authUser?.last_sign_in_at || null;

                    return {
                        id: member.id,
                        email: member.email || 'Sin email',
                        full_name: member.full_name || null,
                        role: member.role || 'client',
                        features: member.features || {},
                        has_leads_access: member.has_leads_access || false,
                        status: isConfirmed ? 'active' : 'pending',
                        last_sign_in: lastSignIn,
                    };
                } catch {
                    return {
                        id: member.id,
                        email: member.email || 'Sin email',
                        full_name: member.full_name || null,
                        role: member.role || 'client',
                        features: member.features || {},
                        has_leads_access: member.has_leads_access || false,
                        status: 'pending' as const,
                        last_sign_in: null,
                    };
                }
            })
        );

        return NextResponse.json({ members: membersWithStatus });

    } catch (error: any) {
        console.error('GET /api/tenant/team error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
