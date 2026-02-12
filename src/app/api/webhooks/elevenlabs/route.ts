import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// crypto is available in Node.js environment
import crypto from 'crypto';

export async function POST(request: Request) {
    // Determine which key to use
    // Using service role key allows bypassing RLS policies
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    // Create a new client instance for this request
    const supabase = createClient(supabaseUrl, supabaseKey);

    try {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);

        // --- SECURITY: Verify ElevenLabs Signature ---
        const signature = request.headers.get('elevenlabs-signature');
        const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

        if (secret) {
            if (!signature) {
                console.error('Missing ElevenLabs signature');
                return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
            }

            // Calculate HMAC
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(bodyText).digest('hex');

            if (signature !== digest) {
                console.error('Invalid ElevenLabs signature');
                return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
            }
            console.log('✅ ElevenLabs Signature Verified');
        } else {
            console.warn('⚠️ ELEVENLABS_WEBHOOK_SECRET not set. Webhook is insecure.');
        }
        // ---------------------------------------------

        console.log('Received ElevenLabs Webhook:', JSON.stringify(payload, null, 2));

        const conversationId = payload.conversation_id;
        const elAgentId = payload.agent_id;
        const transcript = payload.transcript || [];
        const analysis = payload.analysis || {};
        const dataCollection = analysis.data_collection_results || {};

        // 1. Find the local agent ID and notification settings
        const { data: agent, error: agentError } = await supabase
            .from('agentes')
            .select('id, pushover_user_key, pushover_api_token, pushover_template, make_webhook_url')
            .eq('eleven_labs_agent_id', elAgentId)
            .single();

        if (agentError || !agent) {
            console.error('Agent not found for ElevenLabs ID:', elAgentId, agentError);
            return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
        }

        // 2. Extract specific data points
        // Nombres posibles observados: 'nombre', 'Nombre', 'nombre_cliente'
        const nombreVal = dataCollection.nombre?.value ||
            dataCollection.Nombre?.value ||
            dataCollection.nombre_cliente?.value ||
            'Desconocido';

        const phoneVal = dataCollection.telefono?.value ||
            dataCollection.teléfono?.value ||
            'No proveído';

        // Resúmenes posibles observados: 'resumen_de_llamada', 'resumen', 'Resumen', 'resumen_conversacion'
        const resumenVal = dataCollection.resumen_de_llamada?.value ||
            dataCollection.resumen?.value ||
            dataCollection.Resumen?.value ||
            dataCollection.resumen_conversacion?.value ||
            'Sin resumen';

        const calificacionVal = dataCollection.calificacion?.value ||
            dataCollection.Calificación?.value ||
            dataCollection.calificación?.value ||
            'PENDIENTE';

        // Normalize status
        let status: 'POTENCIAL' | 'NO_POTENCIAL' = 'POTENCIAL';
        if (calificacionVal.toUpperCase().includes('NO') || calificacionVal.toUpperCase().includes('RECHAZADO')) {
            status = 'NO_POTENCIAL';
        }

        // 3. Bridge to Make.com (Temporal Transition)
        if (agent.make_webhook_url) {
            console.log('Forwarding to Make.com:', agent.make_webhook_url);
            fetch(agent.make_webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error('Make.com forward error:', err));
        }

        // 4. Send Pushover Notification
        if (agent.pushover_user_key && agent.pushover_api_token) {
            let message = agent.pushover_template || 'Nuevo Lead: {nombre}. Tel: {telefono}';
            message = message.replace(/{nombre}/g, nombreVal).replace(/{telefono}/g, phoneVal);

            console.log('Sending Pushover notification...');
            fetch('https://api.pushover.net/1/messages.json', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: agent.pushover_api_token,
                    user: agent.pushover_user_key,
                    message: message,
                    title: 'Nuevo Lead Detectado'
                })
            }).catch(err => console.error('Pushover error:', err));
        }

        // 5. Save Lead to Supabase
        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                agent_id: agent.id,
                eleven_labs_conversation_id: conversationId,
                nombre: nombreVal,
                status: status,
                summary: resumenVal,
                transcript: transcript,
                phone: phoneVal
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
