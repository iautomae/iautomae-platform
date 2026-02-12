
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function auditLeads() {
    console.log('--- Latest Leads Audit ---');
    const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching leads:', error);
        return;
    }

    leads.forEach(l => {
        console.log(`Lead: ${l.nombre} | Phone: ${l.phone} | Created: ${l.created_at}`);
        console.log(`Summary: ${l.summary}`);
        // console.log(`Raw Transcript: ${JSON.stringify(l.transcript, null, 2)}`);
        console.log('---');
    });
}

auditLeads();
