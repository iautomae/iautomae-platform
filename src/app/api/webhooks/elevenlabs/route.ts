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

    // Define strict type for AgentData to avoid 'any'
    type AgentData = {
        id: string;
        user_id: string;
        pushover_user_key: string | null;
        pushover_api_token: string | null;
        pushover_template: string | null;
        pushover_title: string | null;
        pushover_notification_filter: 'ALL' | 'POTENTIAL_ONLY' | 'NO_POTENTIAL_ONLY' | null;
        make_webhook_url: string | null;
    };

    try {
        const bodyText = await request.text();
        const payload = JSON.parse(bodyText);



        // --- SECURITY: Verify ElevenLabs Signature ---
        const signature = request.headers.get('elevenlabs-signature');
        const secret = process.env.ELEVENLABS_WEBHOOK_SECRET;

        if (secret) {
            if (!signature) {
                console.error('Missing ElevenLabs signature');
            }

            // Calculate HMAC
            const hmac = crypto.createHmac('sha256', secret);
            const digest = hmac.update(bodyText).digest('hex');

            if (signature !== digest) {
                console.error('❌ Invalid ElevenLabs signature');
                console.log(`Expected: ${digest}, Received: ${signature}`);
                console.log(`Secret Used (first 4 chars): ${secret.substring(0, 4)}...`);
            } else {
                console.log('✅ ElevenLabs Signature Verified');
            }
        } else {
            console.warn('⚠️ ELEVENLABS_WEBHOOK_SECRET not set. Webhook is insecure.');
        }

        console.log('Received ElevenLabs Webhook Type:', payload.type);

        // --- ENHANCED EXTRACTION (Support for new nested format) ---
        // ElevenLabs Unified Payload: data { agent_id, conversation_id, analysis, ... }
        const webData = payload.data || {};
        const conversationId = webData.conversation_id || payload.conversation_id;
        const elAgentId = webData.agent_id || payload.agent_id;
        const transcript = webData.transcript || payload.transcript || [];
        const analysis = webData.analysis || payload.analysis || {};
        const dataCollection = analysis.data_collection_results || {};
        // ------------------------------------------------------------

        // --- DEBUG: LOG KEY FIELDS ---
        console.log(`Debug Mapping - AgentID: ${elAgentId}, ConvID: ${conversationId}`);
        // -----------------------------

        // 1. Find the local agent ID and notification settings
        const { data: agentData, error: agentError } = await supabase
            .from('agentes')
            .select('id, user_id, pushover_user_key, pushover_api_token, pushover_template, pushover_title, pushover_notification_filter, make_webhook_url')
            .eq('eleven_labs_agent_id', elAgentId)
            .single();

        let finalAgent: AgentData | null = agentData;
        let summaryPrefix = '';

        if (agentError || !finalAgent) {
            console.error('Agent not found for ElevenLabs ID:', elAgentId, agentError);

            // --- DEBUG FALLBACK ---
            console.log('Using debug fallback for ID:', elAgentId);
            const { data: debugAgent, error: debugError } = await supabase
                .from('agentes')
                .select('id, user_id')
                .eq('nombre', 'DEBUG_Fallback')
                .single();

            if (debugAgent && !debugError) {
                console.log('✅ Fallback successful to DEBUG_Fallback.');
                finalAgent = {
                    id: debugAgent.id,
                    user_id: debugAgent.user_id,
                    pushover_user_key: null,
                    pushover_api_token: null,
                    pushover_template: null,
                    pushover_title: null,
                    pushover_notification_filter: null,
                    make_webhook_url: null
                };
                summaryPrefix = `[MISSING AGENT ID: ${elAgentId}] `;
            } else {
                return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
            }
        }

        // Ensure finalAgent is not null for TypeScript
        if (!finalAgent) {
            return NextResponse.json({ error: 'Agent not found (Final check)' }, { status: 404 });
        }

        // 2. Extract specific data points
        let nombreVal = dataCollection.nombre?.value ||
            dataCollection.Nombre?.value ||
            dataCollection.nombre_cliente?.value ||
            'Desconocido';

        // Helper to format name to Title Case (e.g. "LUISIN" -> "Luisin", "juan perez" -> "Juan Perez")
        if (nombreVal && nombreVal !== 'Desconocido') {
            nombreVal = nombreVal.toLowerCase().replace(/(?:^|\s)\S/g, function (a: string) { return a.toUpperCase(); });
        }

        const phoneVal =
            // 1. WhatsApp ID (Verified from payload: metadata.whatsapp.whatsapp_user_id)
            payload.metadata?.whatsapp?.whatsapp_user_id ||
            webData.metadata?.whatsapp?.whatsapp_user_id ||
            payload.whatsapp?.whatsapp_user_id ||
            webData.whatsapp?.whatsapp_user_id ||

            // 2. System Caller ID (Verified from payload: dynamic_variables.system__caller_id - DOUBLE UNDERSCORE)
            payload.conversation_initiation_client_data?.dynamic_variables?.system__caller_id ||
            webData.conversation_initiation_client_data?.dynamic_variables?.system__caller_id ||

            // 3. Additional System Paths
            payload.conversation_initiation_client_data?.dynamic_variables?.system_caller_id || // Keep single underscore as fallback
            webData.conversation_initiation_client_data?.dynamic_variables?.system_caller_id ||

            // 4. Standard Metadata
            payload.metadata?.caller_id ||
            webData.metadata?.caller_id ||
            payload.metadata?.phone_number ||
            webData.metadata?.phone_number ||

            // 5. Fallbacks
            payload.conversation_initiation_metadata?.caller_id ||
            webData.conversation_initiation_metadata?.caller_id ||
            payload.conversation_initiation_client_data?.phone_number ||
            webData.conversation_initiation_client_data?.phone_number ||
            payload.caller_id ||
            payload.phone_number ||
            webData.caller_id ||
            webData.phone_number ||
            dataCollection.telefono?.value ||
            dataCollection.teléfono?.value ||
            dataCollection.phone?.value ||
            'No proveído';

        // Prioritize data_collection (which is often in the prompt's language, e.g., Spanish)
        let rawSummary = 'Sin resumen';

        // 1. Standard key defined by user
        if (dataCollection.resumen_conversacion?.value) {
            rawSummary = dataCollection.resumen_conversacion.value;
        }
        // 2. Dynamic search for other Spanish keys
        else {
            const summaryKeys = Object.keys(dataCollection);
            const foundSummaryKey = summaryKeys.find(key =>
                key.toLowerCase().includes('resumen') ||
                key.toLowerCase().includes('summary') ||
                key.toLowerCase().includes('conclusion') ||
                key.toLowerCase().includes('analisis')
            );
            if (foundSummaryKey && dataCollection[foundSummaryKey]?.value) {
                rawSummary = dataCollection[foundSummaryKey].value;
            } else {
                // 3. Fallback to ElevenLabs generated summary (often English)
                rawSummary = analysis.transcript_summary || 'Sin resumen';
            }
        }

        const resumenVal = summaryPrefix + rawSummary;

        const calificacionVal = dataCollection.calificacion?.value ||
            dataCollection.Calificación?.value ||
            dataCollection.calificación?.value ||
            'PENDIENTE';

        let status: 'POTENCIAL' | 'NO_POTENCIAL' = 'POTENCIAL';
        if (calificacionVal.toUpperCase().includes('NO') || calificacionVal.toUpperCase().includes('RECHAZADO')) {
            status = 'NO_POTENCIAL';
        }

        // 3. Bridge to Make.com
        if (finalAgent.make_webhook_url) {
            fetch(finalAgent.make_webhook_url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            }).catch(err => console.error('Make.com error:', err));
        }

        // 4. Send Pushover Notification
        if (finalAgent.pushover_user_key && finalAgent.pushover_api_token) {
            const filter = finalAgent.pushover_notification_filter || 'ALL';
            let shouldNotify = false;

            if (filter === 'ALL') shouldNotify = true;
            else if (filter === 'POTENTIAL_ONLY' && status === 'POTENCIAL') shouldNotify = true;
            else if (filter === 'NO_POTENTIAL_ONLY' && status === 'NO_POTENCIAL') shouldNotify = true;

            if (shouldNotify) {
                const messageTemplate = finalAgent.pushover_template || 'Nuevo Lead: *{nombre}*. Tel: {telefono}.';
                const messageTitle = finalAgent.pushover_title || 'Nuevo Lead Detectado';

                // Replace variables
                let message = messageTemplate
                    .replace(/{nombre}/g, nombreVal)
                    .replace(/{telefono}/g, phoneVal)
                    .replace(/{resumen}/g, resumenVal);

                // Convert markdown bold to HTML bold for Pushover
                // Handles *text* -> <b>text</b>
                message = message.replace(/\*(.*?)\*/g, '<b>$1</b>');

                fetch('https://api.pushover.net/1/messages.json', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        token: finalAgent.pushover_api_token,
                        user: finalAgent.pushover_user_key,
                        message: message,
                        title: messageTitle,
                        html: 1 // Enable HTML parsing
                    })
                }).catch(err => console.error('Pushover error:', err));
            }
        }

        // 5. Save Lead to Supabase
        const { error: insertError } = await supabase
            .from('leads')
            .insert({
                agent_id: finalAgent.id,
                user_id: finalAgent.user_id,
                eleven_labs_conversation_id: conversationId,
                nombre: nombreVal,
                status: status,
                summary: resumenVal,
                transcript: transcript,
                phone: phoneVal
            });

        if (insertError) {
            console.error('Error saving lead:', insertError);

            await supabase
                .from('agentes')
                .update({
                    prompt: `ERROR LOG [${new Date().toISOString()}]: ${JSON.stringify(insertError)}. Payload Agent ID: ${elAgentId}. Conv ID: ${conversationId}`
                })
                .eq('nombre', 'DEBUG_Fallback');

            return NextResponse.json({ error: 'Error saving lead', details: insertError }, { status: 500 });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Webhook Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
