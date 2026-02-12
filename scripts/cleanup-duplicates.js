
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function cleanup() {
    console.log('--- Cleaning up Duplicates ---');

    // Find all agents
    const { data: agents } = await supabase.from('agentes').select('*');

    const seen = new Set();
    const toDelete = [];

    // Prioritize agents that have some config or leads? 
    // For now, just keep the first one seen for each ElevenLabs ID
    for (const agent of agents) {
        if (!agent.eleven_labs_agent_id) continue;

        if (seen.has(agent.eleven_labs_agent_id)) {
            console.log(`Duplicate found: ${agent.nombre} (${agent.id})`);
            toDelete.push(agent.id);
        } else {
            seen.add(agent.eleven_labs_agent_id);
        }
    }

    if (toDelete.length > 0) {
        console.log(`Deleting ${toDelete.length} duplicates...`);
        const { error } = await supabase
            .from('agentes')
            .delete()
            .in('id', toDelete);

        if (error) console.error('Error deleting:', error);
        else console.log('✅ Cleanup successful.');
    } else {
        console.log('No duplicates to delete.');
    }
}

cleanup();
