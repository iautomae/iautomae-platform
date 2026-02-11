import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request: Request) {
    try {
        const payload = await request.json();
        console.log('Received ElevenLabs Webhook:', JSON.stringify(payload, null, 2));

        const conversationId = payload.conversation_id;
        const elAgentId = payload.agent_id;
        const transcript = payload.transcript || [];
        const analysis = payload.analysis || {};
        const dataCollection = analysis.data_collection_results || {};

        // 1. Find the local agent ID using ElevenLabs Agent ID
        const { data: agent, error: agentError } = await supabase
            .from('agentes')
            .select('id')
            .eq('eleven_labs_agent_id', elAgentId)
            .single();

        if (agentError || !agent) {
            console.error('Agent not found for ElevenLabs ID:', elAgentId, agentError);
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        // 2. Extract specific data points (be flexible with keys)
        // Trying common variations of the keys designated by the user
        const nombreVal = dataCollection.nombre?.value || dataCollection.Nombre?.value || 'Desconocido';
        const resumenVal = dataCollection.resumen_de_llamada?.value || dataCollection.resumen?.value || dataCollection.Resumen?.value || 'Sin resumen';
        const calificacionVal = dataCollection.calificacion?.value || dataCollection.Calificación?.value || dataCollection.calificación?.value || 'PENDIENTE';

        // Normalize status for the UI colors
        let status: 'POTENCIAL' | 'NO_POTENCIAL' = 'POTENCIAL';
        if (calificacionVal.toUpperCase().includes('NO') || calificacionVal.toUpperCase().includes('RECHAZADO')) {
            status = 'NO_POTENCIAL';
        }

        // 3. Save Lead to Supabase
        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                agent_id: agent.id,
                eleven_labs_conversation_id: conversationId,
                nombre: nombreVal,
                status: status,
                summary: resumenVal,
                transcript: transcript,
                // We don't have phone from ElevenLabs directly unless it's a data point
                phone: dataCollection.telefono?.value || dataCollection.teléfono?.value || 'No proveído'
            });

        if (insertError) {
            console.error('Error saving lead:', insertError);
            return NextResponse.json({ error: 'Error saving lead' }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
