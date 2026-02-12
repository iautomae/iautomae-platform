
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

// Mock next/env or just load .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function audit() {
    console.log('--- Agent Audit ---');
    const { data: agents, error } = await supabase
        .from('agentes')
        .select('id, nombre, eleven_labs_agent_id, pushover_user_key');

    if (error) {
        console.error('Error fetching agents:', error);
        return;
    }

    const ids = {};
    agents.forEach(a => {
        console.log(`Agent: ${a.nombre} | ID: ${a.eleven_labs_agent_id} | Internal: ${a.id}`);
        if (a.eleven_labs_agent_id) {
            ids[a.eleven_labs_agent_id] = (ids[a.eleven_labs_agent_id] || 0) + 1;
        }
    });

    console.log('--- Duplicates ---');
    Object.keys(ids).forEach(id => {
        if (ids[id] > 1) {
            console.log(`Duplicate found for ElevenLabs ID: ${id} (${ids[id]} instances)`);
        }
    });
}

audit();
