
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client with Service Role Key to bypass RLS
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { agent, userId } = body;

        if (!agent || !userId) {
            return NextResponse.json({ error: 'Missing agent data or userId' }, { status: 400 });
        }

        console.log(`📥 Importing agent ${agent.name} for user ${userId}...`);

        // Check if agent already exists (by eleven_labs_agent_id)
        const { data: existingAgents, error: fetchError } = await supabase
            .from('agentes')
            .select('id, user_id, nombre')
            .eq('eleven_labs_agent_id', agent.eleven_labs_agent_id);

        if (fetchError) throw fetchError;

        if (existingAgents && existingAgents.length > 0) {
            // Check if ANY instance of this agent ID belongs to ANOTHER user
            const otherOwner = existingAgents.find(a => a.user_id !== userId);

            if (otherOwner) {
                console.log(`❌ Security Alert: User ${userId} tried to import agent ${agent.eleven_labs_agent_id} which belongs to ${otherOwner.user_id}`);
                return NextResponse.json({
                    error: 'Este agente ya está vinculado a otra cuenta. No se puede importar.',
                    code: 'AGENT_OWNED_BY_OTHER'
                }, { status: 403 });
            }

            const existingAgentId = existingAgents[0].id;
            console.log(`⚠️ Agent ${agent.name} already exists for this user. Updating first instance (${existingAgentId})...`);

            // If there were more than one, we should probably delete the others, but for now just update the main one
            const { data: updatedAgent, error: updateError } = await supabase
                .from('agentes')
                .update({
                    nombre: agent.name,
                    user_id: userId,
                    prompt: agent.prompt,
                    personalidad: agent.personalidad,
                    knowledge_files: agent.knowledge_files,
                    phone_number: agent.phone_number,
                    phone_number_id: agent.phone_number_id,
                    status: agent.status
                })
                .eq('id', existingAgentId)
                .select()
                .single();

            if (updateError) throw updateError;
            return NextResponse.json({ success: true, agent: updatedAgent, action: 'updated' });
        } else {
            // Insert new agent
            const { data: newAgent, error: insertError } = await supabase
                .from('agentes')
                .insert([{
                    nombre: agent.name,
                    user_id: userId,
                    eleven_labs_agent_id: agent.eleven_labs_agent_id,
                    prompt: agent.prompt,
                    personalidad: agent.personalidad,
                    knowledge_files: agent.knowledge_files,
                    phone_number: agent.phone_number,
                    phone_number_id: agent.phone_number_id,
                    status: agent.status
                }])
                .select()
                .single();

            if (insertError) throw insertError;
            return NextResponse.json({ success: true, agent: newAgent, action: 'created' });
        }

    } catch (error: unknown) {
        console.error('❌ Error importing agent:', error);
        return NextResponse.json({ error: (error as Error).message || 'Internal Server Error' }, { status: 500 });
    }
}
