require('dotenv').config({ path: '.env.local' });
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const elevenLabsApiKey = process.env.ELEVEN_LABS_API_KEY;

if (!supabaseUrl || !supabaseKey || !elevenLabsApiKey) {
    console.error('Missing Environment Variables (Supabase or ElevenLabs)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncData() {
    try {
        console.log('🔄 Sincronizando datos con ElevenLabs...');
        const COST_PER_CREDIT = 0.00022; // $22 / 100k credits

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
            const historyRes = await axios.get(`https://api.elevenlabs.io/v1/convai/conversations?agent_id=${agent.agent_id}&page_size=100`, {
                headers: { 'xi-api-key': elevenLabsApiKey }
            });

            const conversations = historyRes.data.conversations;
            console.log(`   ✅ ${conversations.length} conversacione(s) encontrada(s).`);

            for (const convSummary of conversations) {
                // Fetch FULL conversation details to get transcript cost
                let fullConv = convSummary;
                try {
                    // small delay to be safe
                    await new Promise(r => setTimeout(r, 200));

                    const detailRes = await axios.get(`https://api.elevenlabs.io/v1/convai/conversations/${convSummary.conversation_id}`, {
                        headers: { 'xi-api-key': elevenLabsApiKey }
                    });
                    fullConv = detailRes.data;
                } catch (detailErr) {
                    console.error(`   ⚠️ No se pudo obtener detalle para ${convSummary.conversation_id}, usando resumen. Error: ${detailErr.message}`);
                }

                const analysis = fullConv.analysis || {};
                const dataCollection = analysis.data_collection_results || {};
                const transcript = fullConv.transcript || []; // Ensure Array

                // --- COST CALCULATION ---
                let totalCostUSD = 0;

                if (Array.isArray(transcript)) {
                    transcript.forEach(turn => {
                        const llm = turn.llm_usage || {};
                        const mu = llm.model_usage;
                        if (mu) {
                            // Sum cost from all models used in this turn
                            Object.values(mu).forEach(modelStats => {
                                totalCostUSD += (modelStats.input?.price || 0) +
                                    (modelStats.output_total?.price || 0) +
                                    (modelStats.input_cache_read?.price || 0) +
                                    (modelStats.input_cache_write?.price || 0);
                            });
                        }
                    });
                }

                // Fallback check: metadata.cost if available
                if (totalCostUSD === 0 && fullConv.metadata?.cost) {
                    // Check logic: if < 1 it's likely USD, if > 1 it's likely Credits
                    if (fullConv.metadata.cost < 1) {
                        totalCostUSD = fullConv.metadata.cost;
                    } else {
                        // It's credits, convert back to USD for formula consistency or just use as credits
                        // If it's credits:
                        const credits = fullConv.metadata.cost;
                        totalCostUSD = credits * COST_PER_CREDIT;
                    }
                }

                const realCredits = totalCostUSD / COST_PER_CREDIT;
                const clientCredits = Math.ceil(realCredits * 2); // 2x Rule



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
                        eleven_labs_conversation_id: convSummary.conversation_id,
                        nombre: nombreVal,
                        phone: phoneVal,
                        summary: resumenVal,
                        status: status,
                        score: analysis.evaluation_criteria_results?.score,
                        transcript: transcript,
                        tokens_raw: Math.ceil(realCredits),      // Save Real Credits
                        tokens_billed: clientCredits,            // Save x2 Credits
                        created_at: fullConv.start_time_unix ? new Date(fullConv.start_time_unix * 1000).toISOString() : new Date().toISOString()
                    }, { onConflict: 'eleven_labs_conversation_id' });

                if (leadError) console.error(`      ❌ Error al guardar lead ${convSummary.conversation_id}:`, leadError.message);
                else {
                    // console.log(`      ✅ Lead guardado: ${nombreVal} | Credits: ${clientCredits}`); 
                    // process.stdout.write('.'); // Minimize spam
                }
            }
        }

    } catch (err) {
        console.error('❌ Error General:', err.message);
        if (err.response) console.error('   Detalle:', err.response.data);
    }
}

syncData();
