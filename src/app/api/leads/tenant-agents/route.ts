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

        // 1. Get agents from tenant_owners in the same tenant
        const { data: tenantProfiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('tenant_id', tenantId)
            .in('role', ['tenant_owner']);

        const tenantOwnerIds = (tenantProfiles || []).map(p => p.id);

        // 2. Get admin user IDs (their agents are global/shared across all tenants)
        const { data: adminProfiles } = await supabaseAdmin
            .from('profiles')
            .select('id')
            .eq('role', 'admin');

        const adminIds = (adminProfiles || []).map(p => p.id);

        // Combine: tenant-specific + global admin agents
        const allOwnerIds = [...new Set([...tenantOwnerIds, ...adminIds])];

        if (allOwnerIds.length === 0) {
            return NextResponse.json({ agents: [], leadsVisibleAdvisors: 'all' });
        }

        const { data: agents, error: agentsError } = await supabaseAdmin
            .from('agentes')
            .select('*')
            .in('user_id', allOwnerIds)
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
