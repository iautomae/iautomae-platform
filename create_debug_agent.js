require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createDebugAgent() {
    console.log('Creating Debug Agent...');

    // Check if exists
    const { data: existing } = await supabase
        .from('agentes')
        .select('id')
        .eq('nombre', 'DEBUG_Fallback')
        .single();

    if (existing) {
        console.log('Debug Agent exists:', existing.id);
        return existing.id;
    }

    // Create
    const { data: newAgent, error } = await supabase
        .from('agentes')
        .insert({
            nombre: 'DEBUG_Fallback',
            user_id: 'd0e3d2c1-b4a5-4c6d-8e9f-0a1b2c3d4e5f', // Hardcoded safe ID
            eleven_labs_agent_id: 'debug_fallback_id',
            status: 'active'
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating debug agent:', error);
    } else {
        console.log('Debug Agent Created:', newAgent.id);
    }
}

createDebugAgent();
