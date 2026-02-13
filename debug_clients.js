
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("--- DEBUG START ---");
    // 1. Fetch profiles
    const { data: profiles, error: errProfiles } = await supabase
        .from('profiles')
        .select('id, email, role');

    if (errProfiles) {
        console.error("Profiles Error:", errProfiles);
    } else {
        console.log("PROFILES FOUND:", profiles.length);
    }

    // 2. Fetch agents to see schema and data
    const { data: agents, error: errAgents } = await supabase
        .from('agentes')
        .select('*')
        .limit(10);

    if (errAgents) {
        console.error("Agents Error:", errAgents);
    } else if (agents) {
        console.log("AGENTS FOUND:", agents.length);
        if (agents.length > 0) {
            console.log("SAMPLE AGENT COLUMNS:", Object.keys(agents[0]));
            agents.forEach(a => {
                console.log(`Agent: ${a.nombre} | user_id: ${a.user_id} | empresa_id: ${a.empresa_id}`);
            });
        }
    }
    console.log("--- DEBUG END ---");
}

debug();
