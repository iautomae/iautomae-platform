require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('Using Supabase Key (first 4):', supabaseKey ? supabaseKey.substring(0, 4) : 'NONE');

    console.log('--- AGENTS ---');
    const { data: agents, error: agentError } = await supabase.from('agentes').select('id, nombre, eleven_labs_agent_id, user_id');
    if (agentError) console.error('Error fetching agents:', agentError);
    console.table(agents);

    console.log('\n--- LATEST LEADS ---');
    const { data: leads, error: leadError } = await supabase.from('leads').select('id, created_at, nombre, user_id, agent_id').order('created_at', { ascending: false }).limit(3);
    if (leadError) console.error('Error fetching leads:', leadError);
    console.table(leads);
}

check();
