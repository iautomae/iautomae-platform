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
            user_id: 'b7f1ad5f-1c4f-4b85-9d69-ae0c1ca643e7', // Valid user_id (Omar's owner)
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
