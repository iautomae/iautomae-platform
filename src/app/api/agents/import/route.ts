import { NextResponse } from 'next/server';
import { getSupabaseAdminClient, requireAuth } from '@/lib/server-auth';

type IncomingAgent = {
    eleven_labs_agent_id?: string;
    name?: string;
    prompt?: string | null;
    personalidad?: string | null;
    knowledge_files?: unknown;
    phone_number?: string | null;
    phone_number_id?: string | null;
    status?: string | null;
};

const supabaseAdmin = getSupabaseAdminClient();

export async function POST(request: Request) {
    try {
        const { context, response } = await requireAuth(request, ['admin', 'tenant_owner']);
        if (response || !context) {
            return response!;
        }

        const body = await request.json();
        const agent = (body.agent || {}) as IncomingAgent;
        const requestedUserId = typeof body.userId === 'string' ? body.userId : '';
        const targetUserId = context.profile.role === 'admin' ? requestedUserId : context.profile.id;

        if (!agent.eleven_labs_agent_id || !targetUserId) {
            return NextResponse.json({ error: 'Faltan los datos del agente o del usuario.' }, { status: 400 });
        }

        if (context.profile.role !== 'admin' && requestedUserId && requestedUserId !== context.profile.id) {
            return NextResponse.json({ error: 'No puedes importar agentes para otro usuario.' }, { status: 403 });
        }

        const { data: existingAgents, error: fetchError } = await supabaseAdmin
            .from('agentes')
            .select('id, user_id, nombre')
            .eq('eleven_labs_agent_id', agent.eleven_labs_agent_id);

        if (fetchError) {
            throw fetchError;
        }

        const otherOwner = (existingAgents || []).find(existing => existing.user_id !== targetUserId);
        if (otherOwner) {
            return NextResponse.json(
                {
                    error: 'Este agente ya está vinculado a otra cuenta o es de uso exclusivo.',
                    code: 'AGENT_OWNED_BY_OTHER',
                },
                { status: 403 }
            );
        }

        if (agent.name) {
            try {
                const apiKey = process.env.ELEVEN_LABS_API_KEY;
                if (apiKey) {
                    await fetch(`https://api.elevenlabs.io/v1/convai/agents/${agent.eleven_labs_agent_id}`, {
                        method: 'PATCH',
                        headers: {
                            'xi-api-key': apiKey,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ name: agent.name }),
                    });
                }
            } catch (renameError) {
                console.error('Error renaming agent in ElevenLabs:', renameError);
            }
        }

        const payload = {
            nombre: agent.name?.trim() || 'Agente Importado',
            user_id: targetUserId,
            eleven_labs_agent_id: agent.eleven_labs_agent_id,
            prompt: agent.prompt || null,
            personalidad: agent.personalidad || null,
            knowledge_files: agent.knowledge_files || null,
            phone_number: agent.phone_number || null,
            phone_number_id: agent.phone_number_id || null,
            status: agent.status || 'active',
        };

        if (existingAgents && existingAgents.length > 0) {
            const { data: updatedAgent, error: updateError } = await supabaseAdmin
                .from('agentes')
                .update(payload)
                .eq('id', existingAgents[0].id)
                .select()
                .single();

            if (updateError) {
                throw updateError;
            }

            return NextResponse.json({ success: true, agent: updatedAgent, action: 'updated' });
        }

        const { data: newAgent, error: insertError } = await supabaseAdmin
            .from('agentes')
            .insert([payload])
            .select()
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({ success: true, agent: newAgent, action: 'created' });
    } catch (error: unknown) {
        console.error('Error importing agent:', error);
        return NextResponse.json({ error: 'Error interno del servidor.' }, { status: 500 });
    }
}
