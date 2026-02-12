require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgents() {
    console.log('Consultando agentes configurados...');
    const { data, error } = await supabase
        .from('agentes')
        .select('id, nombre, eleven_labs_agent_id');

    if (error) {
        console.error('Error:', error.message);
    } else {
        console.log('--------------------------------------------------');
        console.log('✅ AGENTES ENCONTRADOS:');
        if (data.length === 0) {
            console.log('⚠️ No hay agentes registrados.');
        } else {
            console.table(data);
        }
        console.log('--------------------------------------------------');
        console.log('💡 IMPORTANTE: El ID del agente en ElevenLabs DEBE coincidir con uno de estos.');
    }
}

checkAgents();
