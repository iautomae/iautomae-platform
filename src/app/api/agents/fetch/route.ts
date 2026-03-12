import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function GET(request: Request) {
    try {
        const { context, response } = await requireAuth(request, ['admin', 'tenant_owner']);
        if (response || !context) {
            return response!;
        }

        const url = new URL(request.url);
        const agentId = url.searchParams.get('id');

        if (!agentId) {
            return NextResponse.json({ error: 'id es requerido.' }, { status: 400 });
        }

        const { data: agent, error } = await supabaseAdmin
            .from('agentes')
            .select('*')
            .eq('id', agentId)
            .single();

        if (error || !agent) {
            return NextResponse.json({ error: 'Agente no encontrado.' }, { status: 404 });
        }

        // Permission check: admin can access any agent
        // Tenant owner can access agents owned by themselves, their tenant members, or admin (global agents)
        if (context.profile.role === 'tenant_owner') {
            const { data: ownerProfile } = await supabaseAdmin
                .from('profiles')
                .select('role, tenant_id')
                .eq('id', agent.user_id)
                .single();

            if (!ownerProfile) {
                return NextResponse.json({ error: 'No se pudo validar el dueño del agente.' }, { status: 403 });
            }

            const isAdminOwned = ownerProfile.role === 'admin';
            const isSameTenant = context.profile.tenant_id && ownerProfile.tenant_id === context.profile.tenant_id;

            if (!isAdminOwned && !isSameTenant) {
                return NextResponse.json({ error: 'No tienes permisos para ver este agente.' }, { status: 403 });
            }
        }

        return NextResponse.json({ agent });
    } catch (error: unknown) {
        console.error('Error fetching agent:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
