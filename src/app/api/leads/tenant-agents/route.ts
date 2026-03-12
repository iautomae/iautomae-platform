import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function GET(request: Request) {
    try {
        const { context, response } = await requireAuth(request, ['admin', 'tenant_owner', 'client']);
        if (response || !context) {
            return response!;
        }

        const tenantId = context.profile.tenant_id;
        if (!tenantId) {
            return NextResponse.json({ error: 'No perteneces a ningún tenant.' }, { status: 403 });
        }

        // Get all user IDs in this tenant (tenant_owners who own agents)
        const { data: tenantProfiles, error: profilesError } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('tenant_id', tenantId)
            .in('role', ['tenant_owner', 'admin']);

        if (profilesError || !tenantProfiles || tenantProfiles.length === 0) {
            return NextResponse.json({ agents: [] });
        }

        const ownerIds = tenantProfiles.map(p => p.id);

        // Get all agents belonging to those owners
        const { data: agents, error: agentsError } = await supabaseAdmin
            .from('agentes')
            .select('*')
            .in('user_id', ownerIds)
            .order('created_at', { ascending: true });

        if (agentsError) {
            throw agentsError;
        }

        // Return caller's leads_visible_advisors for client-side filtering
        const callerFeatures = context.profile.features || {};
        const leadsVisibleAdvisors = callerFeatures.leads_visible_advisors || 'all';

        return NextResponse.json({
            agents: agents || [],
            leadsVisibleAdvisors,
        });
    } catch (error: unknown) {
        console.error('Error fetching tenant agents:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
