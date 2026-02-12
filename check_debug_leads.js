require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Using Service Role Key for full visibility
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDebugLeads() {
    console.log('--- SEARCHING FOR DEBUG LEADS ---');
    
    // 1. Get DEBUG_Fallback Agent ID
    const { data: debugAgent } = await supabase
        .from('agentes')
        .select('id')
        .eq('nombre', 'DEBUG_Fallback')
        .single();
        
    if (!debugAgent) {
        console.log('DEBUG_Fallback agent not found in DB yet.');
        return;
    }
    
    console.log('DEBUG Agent ID:', debugAgent.id);

    // 2. Search for leads assigned to this agent
    const { data: fallbackLeads, error: fallbackError } = await supabase
        .from('leads')
        .select('id, created_at, nombre, summary, transcript, user_id, eleven_labs_conversation_id')
        .eq('agent_id', debugAgent.id)
        .order('created_at', { ascending: false })
        .limit(5);

    if (fallbackError) console.error('Error fetching fallback leads:', fallbackError);
    
    if (fallbackLeads && fallbackLeads.length > 0) {
        console.log('🚨 FOUND FALLBACK LEADS (Captured by Debug Mode):');
        console.table(fallbackLeads);
        
        // Detailed log of summary to see the missing ID
        fallbackLeads.forEach(lead => {
            console.log(`\nLead ID: ${lead.id}`);
            console.log(`Summary: ${lead.summary}`); // Should contain [MISSING AGENT ID: ...]
            console.log(`User ID: ${lead.user_id}`);
        });
    } else {
        console.log('✅ No fallback leads found yet.');
    }

    console.log('\n--- LATEST NORMAL LEADS ---');
    const { data: normalLeads } = await supabase
        .from('leads')
        .select('id, created_at, nombre, agent_id, summary')
        .order('created_at', { ascending: false })
        .limit(3);
    console.table(normalLeads);
}

checkDebugLeads();
