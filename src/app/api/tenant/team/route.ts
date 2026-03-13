import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function GET(req: Request) {
    try {
        const { context, response } = await requireAuth(req, ['admin', 'tenant_owner']);
        if (response || !context) {
            return response!;
        }

        const { data: callerProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('id, role, tenant_id')
            .eq('id', context.profile.id)
            .single();

        if (profileError || !callerProfile) {
            return NextResponse.json({ error: 'Perfil no encontrado.' }, { status: 403 });
        }

        const url = new URL(req.url);
        const queryTenantId = url.searchParams.get('tenant_id');

        let tenantId: string;
        let excludeId: string;

        if (callerProfile.role === 'admin' && queryTenantId) {
            tenantId = queryTenantId;
            excludeId = '';
        } else if (callerProfile.role === 'tenant_owner' && callerProfile.tenant_id) {
            tenantId = callerProfile.tenant_id;
            excludeId = callerProfile.id;
        } else {
            return NextResponse.json({ error: 'Solo el propietario puede ver el equipo.' }, { status: 403 });
        }

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

        const membersWithStatus = await Promise.all(
            (members || []).map(async (member) => {
                try {
                    const { data: { user: authUser } } = await supabaseAdmin.auth.admin.getUserById(member.id);
                    const isConfirmed = !!authUser?.email_confirmed_at;
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
    } catch (error: unknown) {
        console.error('GET /api/tenant/team error:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
