require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
    console.log('--- AGENTS ---');
    const { data: agents } = await supabase.from('agentes').select('id, nombre, eleven_labs_agent_id, user_id');
    console.table(agents);

    console.log('\n--- LATEST LEADS ---');
    const { data: leads } = await supabase.from('leads').select('id, created_at, nombre, user_id, agent_id').order('created_at', { ascending: false }).limit(3);
    console.table(leads);
}

check();
