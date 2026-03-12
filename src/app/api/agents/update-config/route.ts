import { NextResponse } from 'next/server';
import { getProfileById, getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

type AgentConfigPayload = Record<string, unknown>;

const supabaseAdmin = getSupabaseAdminClient();

function normalizeString(value: unknown) {
    return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function normalizeBoolean(value: unknown, fallback: boolean) {
    return typeof value === 'boolean' ? value : fallback;
}

export async function POST(request: Request) {
    try {
        const { context, response } = await requireAuth(request, ['admin', 'tenant_owner', 'client']);
        if (response || !context) {
            return response!;
        }

        const body = await request.json();
        const agentId = typeof body.agentId === 'string' ? body.agentId : '';
        const config = (body.config || {}) as AgentConfigPayload;

        if (!agentId || !config) {
            return NextResponse.json({ error: 'Faltan agentId o config.' }, { status: 400 });
        }

        const { data: agent, error: agentError } = await supabaseAdmin
            .from('agentes')
            .select('id, user_id')
            .eq('id', agentId)
            .single<{ id: string; user_id: string }>();

        if (agentError || !agent) {
            return NextResponse.json({ error: 'Agente no encontrado.' }, { status: 404 });
        }

        const { data: ownerProfile, error: ownerProfileError } = await getProfileById(agent.user_id);
        if (ownerProfileError || !ownerProfile) {
            return NextResponse.json({ error: 'No se pudo validar el dueño del agente.' }, { status: 403 });
        }

        const sameTenant = context.profile.tenant_id && context.profile.tenant_id === ownerProfile.tenant_id;
        const isOwner = context.profile.id === agent.user_id;
        const isAdmin = context.profile.role === 'admin';
        // Tenant owners can configure agents from their own tenant OR admin-owned global agents
        const isAdminOwnedGlobal = ownerProfile.role === 'admin';
        const isTenantOwner = context.profile.role === 'tenant_owner' && (sameTenant || isAdminOwnedGlobal);

        if (!isAdmin && !isOwner && !isTenantOwner) {
            return NextResponse.json({ error: 'No tienes permisos para modificar este agente.' }, { status: 403 });
        }

        for (const profileKey of ['pushover_user_1_profile_id', 'pushover_user_2_profile_id', 'pushover_user_3_profile_id']) {
            const linkedProfileId = normalizeString(config[profileKey]);
            if (!linkedProfileId) {
                continue;
            }

            const { data: linkedProfile, error: linkedProfileError } = await getProfileById(linkedProfileId);
            if (linkedProfileError || !linkedProfile || linkedProfile.tenant_id !== ownerProfile.tenant_id) {
                return NextResponse.json(
                    { error: 'Los asesores asignados deben pertenecer al mismo tenant del agente.' },
                    { status: 400 }
                );
            }
        }

        const { data: updatedAgent, error: updateError } = await supabaseAdmin
            .from('agentes')
            .update({
                pushover_user_1_name: normalizeString(config.pushover_user_1_name),
                pushover_user_1_key: normalizeString(config.pushover_user_1_key),
                pushover_user_1_token: normalizeString(config.pushover_user_1_token),
                pushover_user_2_name: normalizeString(config.pushover_user_2_name),
                pushover_user_2_key: normalizeString(config.pushover_user_2_key),
                pushover_user_2_token: normalizeString(config.pushover_user_2_token),
                pushover_user_3_name: normalizeString(config.pushover_user_3_name),
                pushover_user_3_key: normalizeString(config.pushover_user_3_key),
                pushover_user_3_token: normalizeString(config.pushover_user_3_token),
                pushover_user_1_active: normalizeBoolean(config.pushover_user_1_active, true),
                pushover_user_2_active: normalizeBoolean(config.pushover_user_2_active, true),
                pushover_user_3_active: normalizeBoolean(config.pushover_user_3_active, true),
                pushover_user_1_template: normalizeString(config.pushover_user_1_template),
                pushover_user_2_template: normalizeString(config.pushover_user_2_template),
                pushover_user_3_template: normalizeString(config.pushover_user_3_template),
                pushover_user_1_title: normalizeString(config.pushover_user_1_title),
                pushover_user_2_title: normalizeString(config.pushover_user_2_title),
                pushover_user_3_title: normalizeString(config.pushover_user_3_title),
                pushover_user_1_notification_filter: normalizeString(config.pushover_user_1_notification_filter),
                pushover_user_2_notification_filter: normalizeString(config.pushover_user_2_notification_filter),
                pushover_user_3_notification_filter: normalizeString(config.pushover_user_3_notification_filter),
                pushover_user_1_test_phone: normalizeString(config.pushover_user_1_test_phone),
                pushover_user_2_test_phone: normalizeString(config.pushover_user_2_test_phone),
                pushover_user_3_test_phone: normalizeString(config.pushover_user_3_test_phone),
                pushover_user_1_profile_id: normalizeString(config.pushover_user_1_profile_id),
                pushover_user_2_profile_id: normalizeString(config.pushover_user_2_profile_id),
                pushover_user_3_profile_id: normalizeString(config.pushover_user_3_profile_id),
                pushover_template: normalizeString(config.pushover_template),
                pushover_notification_filter: normalizeString(config.pushover_notification_filter) || 'ALL',
                pushover_title: normalizeString(config.pushover_title),
                pushover_reply_message: normalizeString(config.pushover_reply_message),
                make_webhook_url: normalizeString(config.make_webhook_url),
            })
            .eq('id', agentId)
            .select()
            .single();

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, agent: updatedAgent });
    } catch (error: unknown) {
        console.error('Error updating agent config:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
