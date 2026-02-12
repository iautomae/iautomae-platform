const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function auditLeads() {
    console.log('--- Auditing Last 10 Leads ---');

    const { data: leads, error } = await supabase
        .from('leads')
        .select(`
            id,
            created_at,
            nombre,
            phone,
            summary,
            status,
            eleven_labs_conversation_id,
            transcript,
            agent:agentes(nombre)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    if (!leads || leads.length === 0) {
        console.log('No leads found.');
        return;
    }

    console.log(`Found ${leads.length} leads.`);

    leads.forEach((lead, index) => {
        console.log(`\n[Lead ${index + 1}] ID: ${lead.id}`);
        console.log(`  Agent: ${lead.agent?.nombre || 'Unknown'}`);
        console.log(`  Name: ${lead.nombre}`);
        console.log(`  Phone: ${lead.phone || 'MISSING'}`);
        console.log(`  Summary: ${lead.summary ? lead.summary.substring(0, 100) + '...' : 'MISSING'}`);
        console.log(`  Status: ${lead.status}`);
        console.log(`  Conversation ID: ${lead.eleven_labs_conversation_id}`);

        // Inspect transcript for clues if phone is missing
        if (!lead.phone || lead.phone === 'No proveído') {
            console.log('  ⚠️ PHONE MISSING. Checking transcript/metadata if available...');
            // Note: We don't have raw webhook payload here, only what was saved.
            // But we can check if the phone was saved in a wrong column or if it's in the transcript.
        }
    });
}

auditLeads();
