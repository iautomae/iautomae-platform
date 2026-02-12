const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fetchDebugPayloads() {
    console.log('--- Fetching Debug Payloads from DEBUG_Fallback agent ---');

    const { data: agent, error } = await supabase
        .from('agentes')
        .select('prompt, created_at')
        .eq('nombre', 'DEBUG_Fallback')
        .single();

    if (error) {
        console.error('Error fetching debug agent:', error);
        return;
    }

    if (!agent) {
        console.log('DEBUG_Fallback agent NOT found.');
        return;
    }

    console.log(`Agent found. Created at: ${agent.created_at}`);

    if (!agent.prompt) {
        console.log('No debug payload found in prompt column (it is null or empty).');
        console.log('Using: ' + agent.prompt);
        return;
    }

    console.log('Writing payload to debug_payload.json...');
    const fs = require('fs');
    fs.writeFileSync('debug_payload.json', agent.prompt);
    console.log('Done.');
}

fetchDebugPayloads();
