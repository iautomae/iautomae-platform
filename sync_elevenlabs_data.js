require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

if (!supabaseUrl || !supabaseKey || !elevenLabsApiKey) {
    console.error('Missing Environment Variables (Supabase or ElevenLabs)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncData() {
    try {
        console.log('🔄 Sincronizando datos con ElevenLabs...');

        // 1. Fetch Agents
        console.log('📡 Obteniendo Agentes de ElevenLabs...');
        const agentsRes = await axios.get('https://api.elevenlabs.io/v1/convai/agents', {
            headers: { 'xi-api-key': elevenLabsApiKey }
        });

        const agents = agentsRes.data.agents;
        console.log(`✅ ${agents.length} agentes encontrados.`);

        for (const agent of agents) {
            console.log(`🔹 Procesando Agente: ${agent.name} (${agent.agent_id})`);

            // Upsert Agent into Supabase (Manual check to avoid constraint error)
            let localAgentId;
            const { data: existingAgent, error: findError } = await supabase
                .from('agentes')
                .select('id')
                .eq('eleven_labs_agent_id', agent.agent_id)
                .single();

            if (findError && findError.code !== 'PGRST116') { // PGRST116 is 'row not found'
                console.error(`❌ Error al buscar agente ${agent.name}:`, findError.message);
                continue;
            }

            if (existingAgent) {
                // Update
                const { data: updated, error: updateError } = await supabase
                    .from('agentes')
                    .update({ nombre: agent.name })
                    .eq('id', existingAgent.id)
                    .select()
                    .single();

                if (updateError) {
                    console.error(`❌ Error al actualizar agente ${agent.name}:`, updateError.message);
                    continue;
                }
                localAgentId = updated.id;
                console.log(`   ✅ Agente actualizado en DB con ID: ${localAgentId}`);
            } else {
                // Insert
                const { data: inserted, error: insertError } = await supabase
                    .from('agentes')
                    .insert({
                        eleven_labs_agent_id: agent.agent_id,
                        nombre: agent.name,
                        user_id: 'd0e3d2c1-b4a5-4c6d-8e9f-0a1b2c3d4e5f' // HARDCODED USER ID
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error(`❌ Error al crear agente ${agent.name}:`, insertError.message);
                    continue;
                }
                localAgentId = inserted.id;
                console.log(`   ✅ Agente creado en DB con ID: ${localAgentId}`);
            }

            // 2. Fetch History for this Agent
            console.log(`   📡 Obteniendo historial de llamadas para ${agent.name}...`);
            const historyRes = await axios.get(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent.agent_id}`, {
                headers: { 'xi-api-key': elevenLabsApiKey }
            });

            const conversations = historyRes.data.conversations;
            console.log(`   ✅ ${conversations.length} conversaciones encontradas.`);

            for (const conv of conversations) {
                // Determine details
                // ElevenLabs API /conversations returns summary object. 
                // We might need to fetch individual conversation details for transcript?
                // Let's verify what data we have.
                // Assuming basic data is there.

                const analysis = conv.analysis || {};
                const dataCollection = analysis.data_collection_results || {};

                // Extraction Logic (Same as Webhook)
                const nombreVal = dataCollection.nombre?.value || dataCollection.Nombre?.value || dataCollection.nombre_cliente?.value || 'Desconocido';
                const phoneVal = dataCollection.telefono?.value || dataCollection.teléfono?.value || 'No proveído';
                const resumenVal = dataCollection.resumen_de_llamada?.value || dataCollection.resumen?.value || dataCollection.Resumen?.value || dataCollection.resumen_conversacion?.value || 'Sin resumen';
                const calificacionVal = dataCollection.calificacion?.value || dataCollection.Calificación?.value || dataCollection.calificación?.value || 'PENDIENTE';

                let status = 'POTENCIAL';
                if (calificacionVal.toUpperCase().includes('NO') || calificacionVal.toUpperCase().includes('RECHAZADO')) {
                    status = 'NO_POTENCIAL';
                }

                // Insert Lead
                const { error: leadError } = await supabase
                    .from('leads')
                    .upsert({
                        agent_id: localAgentId,
                        eleven_labs_conversation_id: conv.conversation_id,
                        nombre: nombreVal,
                        phone: phoneVal,
                        summary: resumenVal,
                        status: status,
                        score: analysis.evaluation_criteria_results?.score,
                        transcript: conv.transcript, // Might need to fetch separate endpoint if not in list
                        created_at: conv.start_time_unix ? new Date(conv.start_time_unix * 1000).toISOString() : new Date().toISOString()
                    }, { onConflict: 'eleven_labs_conversation_id' });

                if (leadError) console.error(`      ❌ Error al guardar lead ${conv.conversation_id}:`, leadError.message);
                else console.log(`      ✅ Lead guardado: ${nombreVal}`);
            }
        }

    } catch (err) {
        console.error('❌ Error General:', err.message);
        if (err.response) console.error('   Detalle:', err.response.data);
    }
}

syncData();
