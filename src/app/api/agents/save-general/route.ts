import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

const supabaseAdmin = getSupabaseAdminClient();

export async function POST(request: Request) {
    try {
        const { context, response } = await requireAuth(request, ['admin', 'tenant_owner']);
        if (response || !context) {
            return response!;
        }

        const body = await request.json();
        const { agentId, data } = body;

        if (!agentId || !data) {
            return NextResponse.json({ error: 'agentId y data son requeridos.' }, { status: 400 });
        }

        // Verify agent exists
        const { data: agent, error: agentError } = await supabaseAdmin
            .from('agentes')
            .select('id, user_id')
            .eq('id', agentId)
            .single();

        if (agentError || !agent) {
            return NextResponse.json({ error: 'Agente no encontrado.' }, { status: 404 });
        }

        // Permission check
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
                return NextResponse.json({ error: 'No tienes permisos para modificar este agente.' }, { status: 403 });
            }
        }

        // Whitelist allowed fields to prevent unauthorized modifications
        const allowedFields = [
            'nombre', 'personalidad', 'prompt', 'avatar_url',
            'eleven_labs_agent_id', 'phone_number', 'phone_number_id',
            'knowledge_files'
        ];

        const updateData: Record<string, unknown> = {};
        for (const key of allowedFields) {
            if (key in data) {
                updateData[key] = data[key];
            }
        }

        // Do NOT allow changing user_id (ownership)
        const { error: updateError } = await supabaseAdmin
            .from('agentes')
            .update(updateData)
            .eq('id', agentId);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error saving agent config:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
