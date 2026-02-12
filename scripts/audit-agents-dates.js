
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auditAgents() {
    console.log('--- Agents Ordering Audit ---');
    const { data: agents, error } = await supabase
        .from('agentes')
        .select('id, nombre, created_at')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching agents:', error);
        return;
    }

    agents.forEach((a, i) => {
        console.log(`[${i}] Agent: ${a.nombre} | Created: ${a.created_at} | ID: ${a.id}`);
    });
}

auditAgents();
